FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VSF_PROFILER_OUTPUT_DIR=/app/outputs/web_runs

WORKDIR /app

RUN python -m pip install --upgrade pip

COPY pyproject.toml README.md ./
COPY src ./src
COPY templates ./templates
COPY web ./web
COPY examples ./examples
COPY data/evaluation_public ./data/evaluation_public

RUN python -m pip install --no-cache-dir -e .

EXPOSE 8765

CMD ["sh", "-c", "if [ ! -f /app/data/demo_small/schema.dbml ]; then vsf-profiler demo create-small --out /app/data/demo_small >/dev/null; fi; exec vsf-profiler web --host 0.0.0.0 --port ${PORT:-8765} --run-root ${VSF_PROFILER_OUTPUT_DIR:-/app/outputs/web_runs}"]
