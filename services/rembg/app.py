"""
Background-removal microservice for the Wardrobe app.

Exposes a single endpoint that takes an image and returns a transparent PNG
with the background removed, using the open-source `rembg` library.

Run:
    python -m venv .venv
    .venv/Scripts/activate            # Windows
    pip install -r requirements.txt
    python app.py                     # serves on http://localhost:7000

The NestJS API POSTs the (already resized) image bytes to POST /remove.
The first request downloads the u2net model (~176MB) and is slow; later ones are fast.
"""

from io import BytesIO

from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import Response, JSONResponse
from rembg import remove, new_session

app = FastAPI(title="Wardrobe rembg service")

# Reuse a single model session across requests for speed.
_session = new_session("u2net")


def _strip_background(data: bytes) -> bytes:
    """Remove the background from raw image bytes, returning PNG bytes with alpha."""
    return remove(data, session=_session)


@app.get("/health")
def health() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.post("/remove")
async def remove_background(request: Request, file: UploadFile | None = File(default=None)) -> Response:
    """
    Accepts either a multipart `file` field or a raw binary request body.
    Returns a transparent PNG.
    """
    if file is not None:
        data = await file.read()
    else:
        data = await request.body()

    if not data:
        return JSONResponse({"error": "no image data"}, status_code=400)

    output = _strip_background(data)
    return Response(content=output, media_type="image/png")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=7000)
