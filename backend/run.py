#!/usr/bin/env python3
"""
Single entry-point for the Swim School Scheduler.

Usage:
    python run.py          # build frontend + start server
    python run.py --skip-build   # start server without rebuilding frontend
"""

import argparse
import subprocess
import sys
from pathlib import Path

import uvicorn

ROOT = Path(__file__).resolve().parent.parent
STATIC = Path(__file__).resolve().parent / "static"


def build_frontend():
    """Run `npm run build` in the project root to produce backend/static/."""
    print("Building frontend …")
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=str(ROOT),
        shell=True,
    )
    if result.returncode != 0:
        print("Frontend build failed.", file=sys.stderr)
        sys.exit(result.returncode)
    print("Frontend build complete → backend/static/")


def main():
    parser = argparse.ArgumentParser(description="Swim School Scheduler")
    parser.add_argument(
        "--skip-build", action="store_true",
        help="Start the server without rebuilding the frontend",
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    if not args.skip_build:
        build_frontend()

    if not STATIC.is_dir():
        print(
            "Warning: backend/static/ not found. "
            "Run without --skip-build first, or run `npm run build` manually.",
            file=sys.stderr,
        )

    print(f"\n  App running at  http://{args.host}:{args.port}\n")
    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=True,
    )


if __name__ == "__main__":
    main()
