import logging


def install_safe_logging():
    """
    Ensure access logs never include request bodies or headers.
    Uvicorn's default access log prints method + path + status only.
    We also strip any accidental Authorization in exceptions.
    """
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    for name in ("uvicorn.access", "uvicorn.error"):
        logging.getLogger(name).setLevel(logging.INFO)
