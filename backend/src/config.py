import os


def convertStringToBool(bool_string: str) -> bool:
    isTrue = ["true", "True", "TRUE"].__contains__(bool_string)
    return isTrue


# DO NOT CHANGE UNLESS YOU KNOW WHAT YOU'RE DOING!!!
VERSION = float(os.getenv("VERSION", 1.0))

# Free to edit.
LOGGING_LEVEL = os.getenv("LOG_LEVEL", "DEBUG")
LOGGING_FORMAT = os.getenv("LOG_FORMAT", "%(levelname)s | %(asctime)s: %(message)s")

REQUIRED_ENVIRONMENT_VARIABLES = [
    "DB_PROVIDER",
    "DB_USER",
    "DB_PASSWORD",
    "DB_HOST",
    "DB_PORT",
    "DB_DATABASE",
    "DB_SCHEMA",
]

DB_PROVIDER = os.getenv("DB_PROVIDER")
DB_USER = os.getenv("DB_USER", "yaata")
DB_PASSWORD = os.getenv("DB_PASSWORD", "yaata")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_DATABASE = os.getenv("DB_DATABASE", "yaata")
DB_SCHEMA = os.getenv("DB_SCHEMA", "public")
DB_OPTIONS = os.getenv("DB_OPTIONS", f"-c search-path={DB_SCHEMA}")

AUTH_CONFIG = {
    "issuer": os.getenv("AUTH_ISSUER"),
    "clientId": os.getenv("AUTH_CLIENT_ID"),
    "clientSecret": os.getenv("AUTH_CLIENT_SECRET"),
    "scope": os.getenv("AUTH_SCOPE"),
    "responseType": os.getenv("AUTH_RESPONSE_TYPE"),
    "showDebugInformation": convertStringToBool(os.getenv("AUTH_DEBUG", "")),
    "sessionChecksEnabled": convertStringToBool(os.getenv("AUTH_SESSION_CHECKS", "")),
    "useSilentRefresh": convertStringToBool(os.getenv("AUTH_USE_SILENT_REFRESH", "")),
}
