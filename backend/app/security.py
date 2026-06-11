"""Single-key API auth. Set API_KEY in backend/.env and every request must
send  X-API-Key: <value>. Good enough for self-use over the open internet;
swap for per-user tokens before onboarding strangers.

/health stays open so connectivity can be checked before configuring the key."""
from fastapi import Header, HTTPException, Request
from . import config

OPEN_PATHS = {"/health", "/docs", "/openapi.json"}


async def require_api_key(request: Request,
                          x_api_key: str | None = Header(default=None)) -> None:
    if not config.API_KEY or request.url.path in OPEN_PATHS:
        return
    if x_api_key != config.API_KEY:
        raise HTTPException(status_code=401, detail="Missing or invalid X-API-Key")
