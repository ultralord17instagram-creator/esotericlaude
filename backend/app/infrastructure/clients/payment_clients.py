# ═══════════════════════════════════════════════════════════════════════════════
# infrastructure/clients/payment_clients.py — S2S клиент к payment_service партнёрки
#
# Используется для получения тарифа оффера — публичные данные, авторизация не нужна.
# URL сервиса: Settings.payment_service_url (.env: PAYMENT_SERVICE_URL)
# ═══════════════════════════════════════════════════════════════════════════════

import logging

import httpx

log = logging.getLogger(__name__)


class PaymentServiceError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail


class PaymentS2SClient:
    """HTTP-клиент для запросов к payment_service партнёрки.

    Создаётся один раз в lifespan (main.py), хранится в app.state.payment_client.
    """

    def __init__(self, base_url: str) -> None:
        self._client = httpx.AsyncClient(base_url=base_url, timeout=10.0)

    async def get_offer_tariff(self, offer_id: str) -> dict:
        """Получить тариф оффера из payment_service.

        Эндпоинт: GET /api/v1/tariffs/offers/{offer_id}/tariff
        Авторизация не требуется — публичный эндпоинт.
        """
        try:
            response = await self._client.get(
                f"/api/v1/tariffs/offers/{offer_id}/tariff"
            )
        except httpx.RequestError as exc:
            log.warning("payment_service get_offer_tariff error: %s", exc)
            raise PaymentServiceError(503, "Payment service unavailable") from exc
        if not response.is_success:
            try:
                detail = response.json().get("detail", "Tariff not found")
            except Exception:
                detail = "Tariff not found"
            raise PaymentServiceError(response.status_code, detail)
        return response.json()

    async def aclose(self) -> None:
        await self._client.aclose()
