FROM python:3.12-slim-trixie AS base
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY srcs ./srcs

COPY pyproject.toml uv.lock .

# INFO: with --locked uv.lock stays unchanged
RUN uv sync --locked

EXPOSE 8000

FROM base AS dev
ENTRYPOINT ["uv", "run", "fastapi", "dev", "--host", "0.0.0.0", "./srcs/main.py"]

FROM base AS production
ENTRYPOINT ["uv", "run", "fastapi", "run", "./srcs/main.py"]
