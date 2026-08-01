import logging
import os
import signal
from contextlib import asynccontextmanager
from importlib import import_module
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from uvicorn.config import LOGGING_CONFIG

from config import config


def check_environment():
    try:
        if config.debug.level == "DEBUG":
            pass
    except Exception as e:
        logging.error(e)
        logging.error(f"Couldn't connect to Database!")
        os.kill(os.getpid(), signal.SIGTERM)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info("Application startup")

    try:
        load_router()
        check_environment()
        for formatter in LOGGING_CONFIG["formatters"]:
            LOGGING_CONFIG["formatters"][formatter]["fmt"] = config.debug.format

        yield
    finally:
        logging.info("Application shutdown")


app = FastAPI(
    title=f"Yaata Backend V{config.version}", lifespan=lifespan, root_path="/api"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_router() -> None:
    """
    Loads all the router modules and registers them in the app.
    :return: None
    """
    router_path = Path(__file__).parent / "router"
    for router_file in router_path.glob("*.py"):
        if router_file.name != "__init__.py":
            module_path = f"router.{router_file.stem}"
            router_module = import_module(module_path)
            if router_module.__getattribute__("router"):
                app.include_router(router_module.router)


if __name__ == "__main__":
    """
    Dev Only. Runs the app in the development mode.
    """
    uvicorn.run("main:app", host="0.0.0.0", loop="asyncio", reload=True)
