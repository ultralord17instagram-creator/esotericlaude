# ═══════════════════════════════════════════════════════════════════════════════
# domain/exceptions/__init__.py — доменные исключения оффера
#
# МОЖНО ДОБАВЛЯТЬ свои исключения для бизнес-логики оффера.
#   Пример: class ContentNotAccessibleError(BaseOfferException): ...
#
# НЕЛЬЗЯ:
#   — импортировать FastAPI, HTTPException — domain не знает о транспорте
#   — создавать исключения не наследующие от BaseOfferException
#
# Маппинг domain exceptions → HTTP статусы: api/v1/dependencies.py
# в функции map_exception_to_http_exception()
# ═══════════════════════════════════════════════════════════════════════════════


class BaseOfferException(Exception):
    """Корень иерархии доменных исключений оффера.

    map_exception_to_http_exception() ловит именно BaseOfferException
    одним except — все новые исключения наследуй от этого класса.
    """


class UserNotFoundError(BaseOfferException):
    """Пользователь не найден в локальной БД оффера.

    Возникает когда сервис ищет пользователя по auth_user_id,
    но тот ещё не зарегистрирован на этом оффере.
    HTTP маппинг: 404 Not Found.
    """

    def __init__(self, auth_user_id: object) -> None:
        super().__init__(f"User not found: auth_user_id={auth_user_id}")


class UserAlreadyExistsError(BaseOfferException):
    """Попытка создать пользователя, который уже существует.

    Возникает при race condition при одновременной регистрации.
    HTTP маппинг: 409 Conflict.
    """

    def __init__(self, auth_user_id: object) -> None:
        super().__init__(f"User already exists: auth_user_id={auth_user_id}")
