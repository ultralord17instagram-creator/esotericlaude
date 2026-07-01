#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/ssl_init.sh — первичное получение SSL-сертификата Let's Encrypt
#
# Запускается ОДИН РАЗ перед первым продакшн-деплоем.
# После этого certbot сервис (docker-compose.prod.yml) обновляет автоматически.
#
# ПРЕДВАРИТЕЛЬНЫЕ УСЛОВИЯ:
#   1. Домен уже указывает на этот сервер (DNS propagated)
#   2. Port 80 открыт (nginx слушает для HTTP-01 challenge)
#   3. docker-compose.prod.yml запущен (nginx сервис должен работать)
#
# Использование:
#   ./scripts/ssl_init.sh your-domain.com admin@your-email.com
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Аргументы
DOMAIN="${1:?Укажи домен: $0 your-domain.com admin@email.com}"
EMAIL="${2:?Укажи email: $0 your-domain.com admin@email.com}"

echo "Получаем SSL-сертификат для: $DOMAIN"
echo "Email для уведомлений Let's Encrypt: $EMAIL"

# Certbot запрашивает сертификат через HTTP-01 challenge.
# Nginx должен обслуживать /.well-known/acme-challenge/ из /var/www/certbot.
# Volume certbot/www смонтирован в оба контейнера (nginx и certbot).
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

echo "Сертификат получен. Перезапускаем nginx с SSL конфигурацией..."
docker compose -f docker-compose.prod.yml restart nginx

echo ""
echo "=== SSL настроен ==="
echo "Следующий шаг: убедись что nginx/prod.conf содержит правильный домен ($DOMAIN)"
echo "Потом можно деплоить через scripts/deploy.sh"
