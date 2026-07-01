# ═══════════════════════════════════════════════════════════════════════════════
# main.py — FastAPI приложение
#
# НЕЛЬЗЯ МЕНЯТЬ: lifespan (создание engine, session_factory), S2SAuthMiddleware,
#   /health эндпоинт — это инфраструктурный фундамент.
#
# В ИСКЛЮЧИТЕЛЬНЫХ СЛУЧАЯХ можно:
#   — добавить свой middleware (например CORS, rate limiting)
#   — добавить startup/shutdown handler в lifespan
#
# Точка входа: uvicorn app.main:app (dev) / gunicorn app.main:app (prod)
# ═══════════════════════════════════════════════════════════════════════════════

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.api.v1.router import router
from app.config import get_settings
from app.infrastructure.clients.auth_clients import AuthS2SClient
from app.infrastructure.clients.payment_clients import PaymentS2SClient
from app.infrastructure.middleware.s2s_auth import S2SAuthMiddleware

log = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Фабрика FastAPI-приложения.

    Все зависимости создаются здесь или в lifespan.
    Не создавай engine/session/auth_client вне этой функции.
    """
    cfg = get_settings()

    # S2SAuthMiddleware нужен auth_client при регистрации middleware.
    # Создаём клиент здесь (не в lifespan) чтобы передать в middleware constructor.
    # aclose() вызывается в lifespan teardown.
    # Источник cfg: .env файл → Settings
    auth_client = AuthS2SClient(
        base_url=cfg.auth_service_url,
        api_key=cfg.auth_service_api_key,
    )
    payment_client = PaymentS2SClient(base_url=cfg.payment_service_url)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        """Lifecycle ресурсов приложения.

        Yield разделяет startup (до yield) и shutdown (после yield).
        Все ресурсы создаются один раз и живут весь lifecycle приложения.
        """
        # AsyncEngine + connection pool — один на всё приложение
        engine = create_async_engine(
            cfg.database_url,
            echo=cfg.debug,  # True: логировать все SQL-запросы в DEBUG-режиме
        )
        # session_factory передаётся в get_db_session() через app.state
        app.state.session_factory = async_sessionmaker(
            engine,
            expire_on_commit=False,  # не сбрасывать атрибуты после commit
        )
        # Клиенты доступны роутам через request.app.state
        app.state.auth_client = auth_client
        app.state.payment_client = payment_client

        log.info("started | offer_id=%s debug=%s", cfg.offer_id, cfg.debug)
        yield

        # Shutdown: закрыть соединения
        await auth_client.aclose()
        await payment_client.aclose()
        await engine.dispose()
        log.info("stopped | offer_id=%s", cfg.offer_id)

    app = FastAPI(
        title="Offer Template",
        description="Партнёрский оффер — замени этот текст в main.py",
        # /docs и /openapi.json открыты только в debug-режиме.
        # В продакшне включай осторожно — документирует весь API.
        docs_url="/docs" if cfg.debug else None,
        redoc_url="/redoc" if cfg.debug else None,
        openapi_url="/openapi.json" if cfg.debug else None,
        lifespan=lifespan,
    )

    # S2S Auth Middleware — должен быть зарегистрирован ДО роутов.
    # Перехватывает все запросы и проверяет токен + подписку.
    app.add_middleware(S2SAuthMiddleware, auth_client=auth_client)

    # Все роуты с префиксом /api/v1
    app.include_router(router, prefix="/api/v1")

    @app.get("/health", tags=["health"])
    async def health():
        """Проверка работоспособности. Публичный эндпоинт — не требует авторизации.

        Используется docker-compose healthcheck, load balancer, мониторингом.
        Источник: PUBLIC_PATHS в S2SAuthMiddleware.
        """
        return {"status": "ok"}

    return app


app = create_app()
