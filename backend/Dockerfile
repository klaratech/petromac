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
# Catalog uses a single-PDF scheme: one compressed (<4 MB) descriptive-named PDF
# and serves email too. Success-stories keeps a separate email.pdf (its
# source stays full-res for page rendering); backend falls back to source.pdf.
RUN --mount=type=bind,source=public,target=/tmp/public,readonly \
    mkdir -p /app/public/data \
      /app/public/flipbooks/catalog \
      /app/public/flipbooks/success-stories \
 && cp /tmp/public/data/operations_data.json /app/public/data/operations_data.json \
 && cp /tmp/public/data/country_labels.json /app/public/data/country_labels.json \
 && cp /tmp/public/flipbooks/catalog/petromac-product-catalog.pdf /app/public/flipbooks/catalog/petromac-product-catalog.pdf \
 && cp /tmp/public/flipbooks/success-stories/source.pdf /app/public/flipbooks/success-stories/source.pdf \
 && if [ -f /tmp/public/flipbooks/success-stories/email.pdf ]; then cp /tmp/public/flipbooks/success-stories/email.pdf /app/public/flipbooks/success-stories/email.pdf; fi

RUN mkdir -p /app/data

# Non-root user
RUN groupadd --system --gid 1001 app \
 && useradd --system --uid 1001 --gid app app \
 && chown -R app:app /app
USER app

EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
