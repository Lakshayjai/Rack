"""
Garment-extraction microservice for the Wardrobe app.

Endpoints
    GET  /health   — liveness + which models are loaded.
    POST /remove   — legacy: image in → transparent PNG out (general background removal).
    POST /extract  — image in → JSON list of garment candidates:
                     * If a person is wearing the clothes, `u2net_cloth_seg` parses the
                       photo into upper-body / lower-body / full-body garment masks, so the
                       person (face, skin, hair) is removed and each garment becomes its own
                       transparent cutout.
                     * A whole-foreground cutout (`isnet-general-use`, falling back to
                       `u2net`) is always included as the last candidate — it is the right
                       answer for product shots, shoes and accessories.
                     Every mask is cleaned with OpenCV morphology + connected components,
                     then edge-refined with closed-form alpha matting (PyMatting) for crisp,
                     natural fabric edges. Falls back to a light feather when matting fails.

Run:
    python -m venv .venv
    .venv/Scripts/activate            # Windows
    pip install -r requirements.txt
    python app.py                     # serves on http://localhost:7000

Models download on first use (~170MB each) into ~/.u2net; later requests are fast.
"""

import base64
import logging
import os
from io import BytesIO
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, Request, UploadFile
from fastapi.responses import JSONResponse, Response
from PIL import Image, ImageOps
from rembg import new_session, remove

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wardrobe-extract")

app = FastAPI(title="Wardrobe garment-extraction service")

# Model used for whole-foreground (product shot) removal. isnet has noticeably
# cleaner edges than u2net; override with REMBG_GENERAL_MODEL=u2net to avoid the
# extra download.
GENERAL_MODEL = os.environ.get("REMBG_GENERAL_MODEL", "isnet-general-use")
CLOTH_MODEL = "u2net_cloth_seg"
# Alpha matting is the slowest step (~1-3s on CPU); disable with REMBG_MATTING=0.
MATTING_ENABLED = os.environ.get("REMBG_MATTING", "1") != "0"
# Longest side used for the matting solve — full-res alpha is upsampled from this.
MATTING_MAX_SIDE = 512

# u2net_cloth_seg predicts three garment classes, in this order.
CLOTH_LABELS = ["upper", "lower", "full"]
# A garment mask smaller than this fraction of the frame is treated as noise.
MIN_AREA_FRAC = 0.015

_sessions: dict = {}


def get_session(name: str):
    """Lazily create and cache a rembg session; sessions are heavy (ONNX models)."""
    if name not in _sessions:
        _sessions[name] = new_session(name)
    return _sessions[name]


def general_session():
    """The whole-foreground session, falling back to plain u2net if isnet is unavailable."""
    try:
        return get_session(GENERAL_MODEL)
    except Exception:
        logger.exception("Could not load %s; falling back to u2net", GENERAL_MODEL)
        return get_session("u2net")


# ---------------------------------------------------------------------------
# Mask post-processing
# ---------------------------------------------------------------------------

def clean_mask(mask: np.ndarray) -> Optional[np.ndarray]:
    """
    Binarize a raw model mask and clean it up:
      * open (3px) removes leftover skin/background specks,
      * close (5px) fills pinholes inside the fabric,
      * connected components drops fragments below 5% of the largest region while
        keeping genuinely split garment parts (e.g. a shirt bisected by a bag strap).
    Returns None when nothing meaningful remains.
    """
    _, binary = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
    kernel3 = np.ones((3, 3), np.uint8)
    kernel5 = np.ones((5, 5), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel3)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel5, iterations=2)

    count, labels, stats, _ = cv2.connectedComponentsWithStats(binary, connectivity=8)
    if count <= 1:
        return None
    areas = stats[1:, cv2.CC_STAT_AREA]
    largest = int(areas.max())
    keep = np.zeros_like(binary)
    for i, area in enumerate(areas, start=1):
        if area >= max(64, largest * 0.05):
            keep[labels == i] = 255
    return keep if keep.any() else None


def refine_alpha(rgb: np.ndarray, mask: np.ndarray, matting: bool) -> np.ndarray:
    """
    Turn a clean binary mask into a soft alpha channel.

    Preferred path: closed-form alpha matting (PyMatting) over a trimap built by
    eroding (sure-foreground) and dilating (unknown band) the mask — this both
    sharpens fabric edges and eats the 1-2px skin/background fringe left around
    collars and sleeves. The solve runs at <=512px and is upsampled.

    Fallback: 1px erode + gaussian feather.
    """
    kernel = np.ones((5, 5), np.uint8)
    sure_fg = cv2.erode(mask, kernel, iterations=2)
    unknown = cv2.dilate(mask, kernel, iterations=2)

    if matting and sure_fg.any():
        try:
            from pymatting import estimate_alpha_cf

            h, w = mask.shape
            scale = min(1.0, MATTING_MAX_SIDE / max(h, w))
            sw, sh = max(1, int(w * scale)), max(1, int(h * scale))

            trimap = np.zeros((h, w), dtype=np.float64)
            trimap[unknown > 0] = 0.5
            trimap[sure_fg > 0] = 1.0

            rgb_small = cv2.resize(rgb, (sw, sh), interpolation=cv2.INTER_AREA)
            trimap_small = cv2.resize(trimap, (sw, sh), interpolation=cv2.INTER_NEAREST)

            alpha_small = estimate_alpha_cf(
                rgb_small.astype(np.float64) / 255.0, trimap_small
            )
            alpha = cv2.resize(alpha_small, (w, h), interpolation=cv2.INTER_LINEAR)
            alpha = (np.clip(alpha, 0.0, 1.0) * 255).astype(np.uint8)
            # Never let matting bleed outside the dilated mask or hollow out the core.
            alpha[unknown == 0] = 0
            alpha = np.maximum(alpha, sure_fg)
            return alpha
        except Exception:
            pass  # fall through to the feather path

    eroded = cv2.erode(mask, np.ones((3, 3), np.uint8))
    return cv2.GaussianBlur(eroded, (5, 5), 0)


def estimate_confidence(alpha: np.ndarray) -> float:
    """
    Cheap quality heuristic used by the UI to flag "review this one" cutouts.
    Penalizes tiny masks, garments cut off by the frame edge, and fragmentation.
    """
    h, w = alpha.shape
    binary = (alpha > 127).astype(np.uint8)
    area_frac = float(binary.sum()) / (h * w)

    conf = 0.92
    if area_frac < 0.03:
        conf -= 0.30
    elif area_frac < 0.06:
        conf -= 0.12

    # Garment touching the frame border usually means it is partially out of shot.
    edges = [binary[0, :], binary[-1, :], binary[:, 0], binary[:, -1]]
    if any(float(e.sum()) / len(e) > 0.02 for e in edges):
        conf -= 0.18

    count, _ = cv2.connectedComponents(binary, connectivity=8)
    if count - 1 > 3:
        conf -= 0.10

    return round(float(np.clip(conf, 0.05, 0.99)), 2)


def build_candidate(label: str, rgb: np.ndarray, alpha: np.ndarray) -> Optional[dict]:
    """Compose a full-frame RGBA cutout + bbox + confidence for one garment mask."""
    ys, xs = np.nonzero(alpha > 8)
    if len(xs) == 0:
        return None
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())

    rgba = np.dstack([rgb, alpha])
    buf = BytesIO()
    Image.fromarray(rgba, mode="RGBA").save(buf, format="PNG")
    return {
        "label": label,
        "confidence": estimate_confidence(alpha),
        "png": base64.b64encode(buf.getvalue()).decode("ascii"),
        "bbox": {"x": x0, "y": y0, "width": x1 - x0 + 1, "height": y1 - y0 + 1},
        "width": int(rgb.shape[1]),
        "height": int(rgb.shape[0]),
        "areaFrac": round(float((alpha > 127).sum()) / (alpha.shape[0] * alpha.shape[1]), 4),
    }


def predict_mask(session, img: Image.Image) -> Optional[np.ndarray]:
    """Run a single-mask session (u2net / isnet) and return the raw uint8 mask."""
    masks = session.predict(img)
    if not masks:
        return None
    return np.array(masks[0].convert("L"))


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health() -> JSONResponse:
    return JSONResponse(
        {
            "status": "ok",
            "generalModel": GENERAL_MODEL,
            "clothModel": CLOTH_MODEL,
            "matting": MATTING_ENABLED,
            "loaded": list(_sessions.keys()),
        }
    )


async def read_image_bytes(request: Request, file: Optional[UploadFile]) -> bytes:
    if file is not None:
        return await file.read()
    return await request.body()


@app.post("/remove")
async def remove_background(
    request: Request, file: UploadFile | None = File(default=None)
) -> Response:
    """Legacy endpoint: plain background removal, returns a transparent PNG."""
    data = await read_image_bytes(request, file)
    if not data:
        return JSONResponse({"error": "no image data"}, status_code=400)
    output = remove(data, session=general_session())
    return Response(content=output, media_type="image/png")


@app.post("/extract")
async def extract_garments(
    request: Request,
    file: UploadFile | None = File(default=None),
    matting: int = 1,
) -> JSONResponse:
    """
    Garment extraction. Returns JSON:
        {
          "mode": "person" | "product",
          "candidates": [
            { "label": "upper" | "lower" | "full" | "item",
              "confidence": 0..1, "png": <base64 full-frame RGBA>,
              "bbox": {x, y, width, height}, "width": W, "height": H }
          ]
        }
    Cloth-parsed garments come first; the whole-foreground cutout is always last.
    """
    data = await read_image_bytes(request, file)
    if not data:
        return JSONResponse({"error": "no image data"}, status_code=400)

    try:
        img = Image.open(BytesIO(data))
        img = ImageOps.exif_transpose(img).convert("RGB")
    except Exception:
        return JSONResponse({"error": "unreadable image"}, status_code=400)

    rgb = np.array(img)
    total_px = rgb.shape[0] * rgb.shape[1]
    use_matting = MATTING_ENABLED and matting != 0

    candidates: list[dict] = []
    cloth_area = 0

    # 1) Garment parsing — segments clothes by class, implicitly removing the person.
    try:
        cloth_masks = get_session(CLOTH_MODEL).predict(img)
    except Exception:
        logger.exception("Cloth segmentation failed; continuing with foreground only")
        cloth_masks = []

    for idx, pil_mask in enumerate(cloth_masks[: len(CLOTH_LABELS)]):
        cleaned = clean_mask(np.array(pil_mask.convert("L")))
        if cleaned is None:
            continue
        area = int((cleaned > 0).sum())
        if area < total_px * MIN_AREA_FRAC:
            continue
        alpha = refine_alpha(rgb, cleaned, use_matting)
        candidate = build_candidate(CLOTH_LABELS[idx], rgb, alpha)
        if candidate:
            cloth_area += area
            candidates.append(candidate)

    # 2) Whole-foreground cutout — best for product shots, shoes, accessories.
    fg_area = 0
    try:
        fg_mask = predict_mask(general_session(), img)
        fg_clean = clean_mask(fg_mask) if fg_mask is not None else None
        if fg_clean is not None:
            fg_area = int((fg_clean > 0).sum())
            alpha = refine_alpha(rgb, fg_clean, use_matting)
            candidate = build_candidate("item", rgb, alpha)
            if candidate:
                candidates.append(candidate)
    except Exception:
        logger.exception("Whole-foreground extraction failed")

    # A person is present when the foreground is clearly bigger than the clothes
    # (head, arms and legs add area) or when several garment classes were found.
    person = bool(cloth_area) and (
        len(candidates) > 2 or fg_area > cloth_area * 1.25
    )

    return JSONResponse({"mode": "person" if person else "product", "candidates": candidates})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=7000)
