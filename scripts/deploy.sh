#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/deploy.sh — деплой новой версии оффера
#
# НЕЛЬЗЯ МЕНЯТЬ: порядок шагов (pull → build → migrate → restart nginx).
#   Изменение порядка может привести к деплою с несовместимой схемой БД.
#
# Запуск на сервере из директории проекта:
#   ./scripts/deploy.sh
#
# set -e: скрипт останавливается при первой же ошибке.
# Это безопасно: лучше остановиться, чем продолжать с поломанным состоянием.
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "=== Деплой: $(date) ==="

# 1. Получить последние изменения из git
echo "--- [1/4] git pull ---"
git pull origin main

# 2. Пересобрать и запустить backend и frontend.
# --no-deps: не трогать postgres/nginx во время деплоя.
# --build: пересобрать образы с новым кодом.
echo "--- [2/4] docker build & up ---"
docker compose -f docker-compose.prod.yml up -d --build backend frontend --no-deps

# 3. Применить новые миграции Alembic.
# Выполняется внутри уже запущенного контейнера backend.
# upgrade head идемпотентен: если миграций нет — ничего не делает.
echo "--- [3/4] alembic upgrade head ---"
docker compose -f docker-compose.prod.yml exec backend uv run alembic upgrade head

# 4. Перезапустить Nginx.
# ОБЯЗАТЕЛЬНО: Nginx кэширует DNS-резолюцию upstream (backend).
# После пересборки контейнер backend получает новый IP — без restart nginx
# перестаёт проксировать запросы на него.
echo "--- [4/4] restart nginx ---"
docker compose -f docker-compose.prod.yml restart nginx

echo "=== Деплой завершён: $(date) ==="
