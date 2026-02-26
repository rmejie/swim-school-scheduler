"""
Swim School Scheduler — single-server application.

Serves the REST API at /api/* and the React frontend for everything else.
Both backend and frontend run from one process on one port.
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import engine, Base
from app.crypto import get_dek
from app.routes import instructors, clients, appointments

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(application: FastAPI):
    Base.metadata.create_all(bind=engine)
    get_dek()
    yield


app = FastAPI(
    title="Swim School Scheduler",
    description="Full-stack swim school scheduling app with encrypted storage",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(instructors.router)
app.include_router(clients.router)
app.include_router(appointments.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


if STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA; any non-API path returns index.html."""
        file = STATIC_DIR / full_path
        if file.is_file():
            return FileResponse(str(file))
        return FileResponse(str(STATIC_DIR / "index.html"))
