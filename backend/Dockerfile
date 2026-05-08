# syntax=docker/dockerfile:1
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app

# uv binary
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /uvx /usr/local/bin/

# ---- deps ----
FROM base AS deps
COPY backend/pyproject.toml backend/uv.lock ./
RUN --mount=type=cache,id=uv-petromac,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# ---- runtime ----
FROM base AS runtime
ENV PATH="/app/.venv/bin:$PATH"

COPY --from=deps /app/.venv /app/.venv
COPY backend /app/backend

# Bake ONLY the public/ subset the backend actually reads.
# The rest of public/ (videos, 3D models, flipbook page images, etc.)
# is served by the frontend and intentionally left out of this image.
COPY public/data/operations_data.json /app/public/data/operations_data.json
COPY public/data/country_labels.json /app/public/data/country_labels.json
COPY public/flipbooks/catalog/source.pdf /app/public/flipbooks/catalog/source.pdf
COPY public/flipbooks/success-stories/source.pdf /app/public/flipbooks/success-stories/source.pdf

RUN mkdir -p /app/data

# Non-root user
RUN groupadd --system --gid 1001 app \
 && useradd --system --uid 1001 --gid app app \
 && chown -R app:app /app
USER app

EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
