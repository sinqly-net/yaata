from fastapi import APIRouter

import config
from utils.auth import CurrentUser

router = APIRouter(tags=["ROOT"])


@router.get("/")
def get_root():
    """
    Returns app-name and version for checking if backend is available.
    """
    return {
        "app": "Yaata Backend",
        "version": config.VERSION,
    }


@router.get("/auth_config")
def get_auth_config():
    return config.AUTH_CONFIG


@router.get("/auth_test")
async def get_auth_test(user: CurrentUser):
    print(user)
