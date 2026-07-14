# rembg microservice

Local, free background-removal / garment-extraction service used by the Wardrobe API (FastAPI + [rembg](https://github.com/danielgatis/rembg) + OpenCV + PyMatting).

## Setup (Windows / PowerShell)
```powershell
cd services/rembg
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py            # http://localhost:7000   (or `pnpm rembg` from the repo root)
```

macOS/Linux: `source .venv/bin/activate` instead of the Activate script.

## Endpoints
- `GET /health` — liveness + which models are loaded.
- `POST /extract` — **the main endpoint.** Image in (multipart `file` field or raw binary body) → JSON garment candidates out. If a person is wearing the clothes, `u2net_cloth_seg` parses the photo into upper/lower/full-body garment cutouts (removing the person); a whole-foreground cutout (`isnet-general-use`) is always appended for product shots, shoes and accessories. Masks are cleaned with OpenCV morphology and edge-refined with closed-form alpha matting. Response: `{ mode: "person" | "product", candidates: [{ label, confidence, png (base64 RGBA), bbox, width, height }] }`.
- `POST /remove` — legacy: plain background removal, returns a single transparent PNG.

The first call per model downloads it (~170MB each into `~/.u2net`) and is slow; later requests are fast.

## Configuration (env vars)
| Var | Default | Effect |
|---|---|---|
| `REMBG_GENERAL_MODEL` | `isnet-general-use` | Whole-foreground model; set `u2net` to skip the extra download |
| `REMBG_MATTING` | `1` | Set `0` to disable alpha matting (the slowest step, ~1–3s on CPU) |

The API points here via `REMBG_URL` / `REMBG_EXTRACT_URL` in `apps/api/.env` (defaults `http://localhost:7000/remove` and `/extract`). If this service is unreachable the API falls back to remove.bg (when `REMOVE_BG_API_KEY` is set), then to storing the image without removal.
