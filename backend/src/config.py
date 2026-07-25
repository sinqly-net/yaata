import os

import yaml

from exceptions.config_error import ConfigError
from schemas.app_config import AppConfig


def load_config(path: str) -> AppConfig:
    with open(path, "r") as f:
        raw = yaml.safe_load(f)
        if raw is None:
            raise ConfigError(
                """\nWhile reading the config file a error happened. The file returns as null.\nThis indicates that your file is empty.\nCheck your local.config.yaml and the path to the file in the CONFIG_PATH environment variable."""
            )
    return AppConfig(**raw)


config_file_path = os.getenv("CONFIG_PATH", "/app/config.yaml")
config = load_config(config_file_path)
