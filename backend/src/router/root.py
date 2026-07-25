from fastapi import APIRouter

from config import config

router = APIRouter(tags=["ROOT"])


@router.get("/")
def get_root():
    """
    Returns app-name and version for checking if backend is available.
    """
    return {
        "app": "Yaata Backend",
        "version": config.version,
    }
