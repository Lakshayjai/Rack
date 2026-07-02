# rembg microservice

Local, free background-removal service used by the Wardrobe API.

## Setup (Windows / PowerShell)
```powershell
cd services/rembg
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py            # http://localhost:7000
```

macOS/Linux: `source .venv/bin/activate` instead of the Activate script.

## Endpoints
- `GET /health` → `{ "status": "ok" }`
- `POST /remove` → returns a transparent PNG. Accepts a multipart `file` field **or** a raw binary body.

The first `/remove` call downloads the u2net model (~176MB) and is slow; subsequent calls are fast.

The API points at this service via `REMBG_URL` in `apps/api/.env` (default `http://localhost:7000/remove`).
If this service is unreachable and `REMOVE_BG_API_KEY` is set, the API falls back to remove.bg.
