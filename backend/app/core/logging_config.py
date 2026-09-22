"""Centralized logging configuration for ResilienceOS."""

import logging
import logging.config
from pathlib import Path


LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

LOG_FILE = LOG_DIR / "resilienceos.log"


def configure_logging() -> None:
    """Configure application-wide logging."""

    logging.config.dictConfig({
        "version": 1,
        "disable_existing_loggers": False,

        "formatters": {
            "standard": {
                "format": (
                    "%(asctime)s | %(levelname)s | "
                    "%(name)s | %(message)s"
                )
            }
        },

        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "standard",
                "level": "INFO",
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "filename": str(LOG_FILE),
                "maxBytes": 5_000_000,
                "backupCount": 3,
                "formatter": "standard",
                "level": "INFO",
                "encoding": "utf-8",
            },
        },

        "root": {
            "handlers": ["console", "file"],
            "level": "INFO",
        },
    })


def get_logger(name: str) -> logging.Logger:
    """Return a named application logger."""
    return logging.getLogger(name)
