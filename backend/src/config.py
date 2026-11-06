import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict, YamlConfigSettingsSource

from exceptions.config_error import ConfigError
from schemas.app_config import AppConfig


class _ConfigYamlSettingsSource(YamlConfigSettingsSource):
    def __call__(self):
        data = super().__call__()
        if data is None or data == {}:
            raise ConfigError(
                """\nWhile reading the config file a error happened. The file returns as null.\nThis indicates that your file is empty.\nCheck your local.config.yaml and the path to the file in the CONFIG_PATH environment variable."""
            )
        return data


class _AppConfigSettings(AppConfig, BaseSettings):
    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls,
        init_settings,
        env_settings,
        dotenv_settings,
        file_secret_settings,
    ):
        return (_ConfigYamlSettingsSource(settings_cls),)


def load_config(path: str) -> AppConfig:
    config_path = Path(path)
    if not config_path.exists():
        raise FileNotFoundError(path)

    settings_class = type(
        "PathConfigSettings",
        (_AppConfigSettings,),
        {"model_config": SettingsConfigDict(yaml_file=str(config_path))},
    )
    return settings_class()


config_file_path = os.getenv("CONFIG_PATH", "/app/config.yaml")
config = load_config(config_file_path)
