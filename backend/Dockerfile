# Build context: backend/  ->  docker build -t portfolio-backend backend
FROM python:3.13-slim@sha256:e48f59cdba69a3cbd9ed2cf0f348d90d45a8d350d98134cf1070bc106ee9ed90 AS builder
WORKDIR /app
# Exact pins. PIP_UPLOADED_PRIOR_TO makes pip take Poetry's own dependencies
# only from releases at least 14 days old (docs/development.md, "Dependencies").
RUN pip install --no-cache-dir pip==26.2.2 \
    && PIP_UPLOADED_PRIOR_TO=P14D pip install --no-cache-dir poetry==2.5.1 \
    && poetry config virtualenvs.in-project true
COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-interaction --no-ansi
COPY . .

FROM python:3.13-slim@sha256:e48f59cdba69a3cbd9ed2cf0f348d90d45a8d350d98134cf1070bc106ee9ed90
WORKDIR /app

COPY --from=builder /app /app
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
