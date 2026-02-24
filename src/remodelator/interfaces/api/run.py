from __future__ import annotations

import os

import uvicorn


def run() -> None:
    host = os.getenv("REMODELATOR_API_HOST", "127.0.0.1")
    port = int(os.getenv("REMODELATOR_API_PORT", "8000"))
    uvicorn.run("remodelator.interfaces.api.main:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    run()
