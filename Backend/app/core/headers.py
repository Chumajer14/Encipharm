NO_STORE_PATH_PREFIXES = (
    "/auth",
    "/clientes",
    "/competencia",
    "/dashboard",
    "/interacciones",
    "/me",
    "/oportunidades",
    "/propuestas",
    "/users",
)


def apply_dynamic_cache_headers(path: str, headers) -> None:
    if path.startswith(NO_STORE_PATH_PREFIXES):
        headers["Cache-Control"] = "no-store"
        headers["Pragma"] = "no-cache"
