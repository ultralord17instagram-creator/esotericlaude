# ═══════════════════════════════════════════════════════════════════════════════
# backend/Dockerfile
#
# НЕЛЬЗЯ МЕНЯТЬ: базовый образ Python, установку uv, команды сборки.
# МОЖНО МЕНЯТЬ: если нужны системные зависимости (apt-get install ...).
#
# Dev команда (docker-compose.dev.yml):  uvicorn --reload
# Prod команда (docker-compose.prod.yml): gunicorn -k uvicorn.workers.UvicornWorker
# Команды переопределяются в docker-compose через `command:`.
# ═══════════════════════════════════════════════════════════════════════════════

FROM python:3.12-slim

WORKDIR /app

# Установить uv — пакетный менеджер
RUN pip install --no-cache-dir uv

# Скопировать файлы зависимостей первыми — для кеширования слоёв Docker.
# Зависимости переустанавливаются только при изменении pyproject.toml или uv.lock.
COPY pyproject.toml uv.lock ./

# Установить только runtime зависимости (не dev).
# --frozen: не обновлять lockfile — детерминированная сборка.
# После добавления зависимостей в pyproject.toml — запусти uv sync локально
# чтобы обновить uv.lock, потом закоммить оба файла.
RUN uv sync --no-dev

# Скопировать код приложения
COPY . .

EXPOSE 8000

# Команда по умолчанию — для dev.
# Prod переопределяет через command: в docker-compose.prod.yml.
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
