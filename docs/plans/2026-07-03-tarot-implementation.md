# Расклад Таро — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Заменить заглушку Таро полноценным продуктом «Расклад Таро» с тремя сценариями (Карта дня, Три карты, Да/Нет), конфиг-driven раскладами, статическими заготовками текстов и серверным учётом суточных лимитов.

**Architecture:** Frontend — «толстый» продукт со своим `TarotClient` и под-роутами (`/tarot`, `/tarot/day|three|yesno`), как `matrix` (не через `ProductPage`). Колода, конфиг раскладов и тексты — статикой в `frontend/app/content/tarot/`. «Карта дня» детерминирована сидом от даты (без бэкенда). Суточные лимиты живут на бэкенде: новая таблица `tarot_usage` + вертикальный слайс `entity → model → mapper → repo → service → route`. Числовые лимиты дублируются в маленьком backend-конфиге `tarot_limits`, синхронизируемом вручную со `SPREADS`.

**Tech Stack:** Next.js 14 (App Router, JSX), FastAPI (Python 3.12, SQLAlchemy 2.0 async, Alembic), PostgreSQL, Docker Compose, pytest.

**Решения этапа планирования (закрытые открытые вопросы §12 дизайна):**
1. **Анонимный доступ:** сценарии с лимитами («Три карты ППБ», «Да/Нет») — **только залогиненным**. «Карта дня» — публична (детерминирована, без бэкенда). localStorage-лимит НЕ делаем.
2. **Источник лимитов:** маленький **backend-конфиг** `tarot_limits` (dict `(spread_id, theme_id) → limit`), синхронизируется вручную со `SPREADS`.
3. **Часовой пояс суток:** **Europe/Moscow** — и для сброса лимитов на бэкенде, и для сида «Карты дня» на фронте.
4. **Механика демо** платных тем — дефолт-заглушка, data-driven (одно место), владелец допилит позже.

**Вне скоупа (из дизайна §11):** реальные ~160 текстов (пишутся в другом чате — здесь только структура + плейсхолдеры), финальный визуал/анимации, секретная карта, 78 карт, перевёрнутые, картинки (только задел в схеме).

---

## Порядок фаз

- **Фаза 1 — Статический слой данных** (колода, конфиг, тексты-плейсхолдеры, хелперы). Без зависимостей.
- **Фаза 2 — Backend: лимиты** (миграция + вертикальный слайс + тесты). Независима от фронта.
- **Фаза 3 — Frontend API-клиент лимитов** (тонкий модуль поверх Фазы 2).
- **Фаза 4 — Frontend: TarotClient и под-роуты** (механика трёх сценариев). Зависит от Фаз 1 и 3.
- **Фаза 5 — Чистка старого Таро + каталог**.
- **Фаза 6 — Верификация** (единая сборка + ручной прогон).

TDD применяется строго к чистым функциям: backend-сервис (Фаза 2) и JS-хелперы колоды (Фаза 1). UI-задачи (Фаза 4) верифицируются вручную в Фазе 6 — Docker-сборкой (per-task сборок/скриншотов НЕ делаем).

> **Перед началом Фазы 1:** подтвердить, что во фронте есть JS-тест-раннер. Проверь: `frontend/package.json` на `jest` / `vitest` и наличие скрипта `test`. Если раннера нет — тесты хелперов из Задачи 1.4 запускай разово через `node` (см. примечание в задаче), не блокируй план.

> **Перед началом Фазы 2:** прочитать существующий вертикальный слайс `user_profile` целиком как эталон стиля: `backend/app/domain/entities/user_profile.py`, `backend/app/infrastructure/sql/models/user_profile_model.py`, `backend/app/infrastructure/sql/mappers/user_profile_mapper.py`, `backend/app/repositories/user_profile_repo.py`, `backend/app/services/user_profile_service.py`, `backend/app/api/v1/routes/profile.py`. Копируй их структуру.

---

# ФАЗА 1 — Статический слой данных

## Задача 1.1: Колода (`deck.js`)

**Files:**
- Create: `frontend/app/content/tarot/deck.js`

**Step 1: Создать файл колоды**

22 Старших аркана (Rider–Waite–Smith: 8 — Сила, 11 — Справедливость), только прямое положение. Поля-задел (`image`, `arcana`, `reversedMeaning`) НЕ добавляем сейчас — они опишутся при расширении; структура колоды от `SPREADS` не зависит.

`yesno` — фиксированный полюс ответа. Значения ниже — **провизорные плейсхолдеры**, чтобы механика работала; финальные полюса проставляются при наполнении текстами (отдельный чат). Помечено `TODO`.

```js
// 22 Старших аркана, прямое положение. yesno — провизорные плейсхолдеры (TODO: выставить при наполнении).
export const DECK = [
  { number: 0,  en: 'The Fool',           ru: 'Шут',            yesno: 'yes' },
  { number: 1,  en: 'The Magician',       ru: 'Маг',            yesno: 'yes' },
  { number: 2,  en: 'The High Priestess', ru: 'Жрица',          yesno: 'no'  },
  { number: 3,  en: 'The Empress',        ru: 'Императрица',    yesno: 'yes' },
  { number: 4,  en: 'The Emperor',        ru: 'Император',      yesno: 'yes' },
  { number: 5,  en: 'The Hierophant',     ru: 'Иерофант',       yesno: 'yes' },
  { number: 6,  en: 'The Lovers',         ru: 'Влюблённые',     yesno: 'yes' },
  { number: 7,  en: 'The Chariot',        ru: 'Колесница',      yesno: 'yes' },
  { number: 8,  en: 'Strength',           ru: 'Сила',           yesno: 'yes' },
  { number: 9,  en: 'The Hermit',         ru: 'Отшельник',      yesno: 'no'  },
  { number: 10, en: 'Wheel of Fortune',   ru: 'Колесо Фортуны', yesno: 'yes' },
  { number: 11, en: 'Justice',            ru: 'Справедливость', yesno: 'yes' },
  { number: 12, en: 'The Hanged Man',     ru: 'Повешенный',     yesno: 'no'  },
  { number: 13, en: 'Death',              ru: 'Смерть',         yesno: 'no'  },
  { number: 14, en: 'Temperance',         ru: 'Умеренность',    yesno: 'yes' },
  { number: 15, en: 'The Devil',          ru: 'Дьявол',         yesno: 'no'  },
  { number: 16, en: 'The Tower',          ru: 'Башня',          yesno: 'no'  },
  { number: 17, en: 'The Star',           ru: 'Звезда',         yesno: 'yes' },
  { number: 18, en: 'The Moon',           ru: 'Луна',           yesno: 'no'  },
  { number: 19, en: 'The Sun',            ru: 'Солнце',         yesno: 'yes' },
  { number: 20, en: 'Judgement',          ru: 'Суд',            yesno: 'yes' },
  { number: 21, en: 'The World',          ru: 'Мир',            yesno: 'yes' },
]
```

**Step 2: Commit**

```bash
git add frontend/app/content/tarot/deck.js
git commit -m "feat(tarot): add 22 major arcana deck (upright only)"
```

---

## Задача 1.2: Конфиг раскладов (`spreads.js`)

**Files:**
- Create: `frontend/app/content/tarot/spreads.js`

**Step 1: Создать конфиг SPREADS**

Дословно по дизайну §5. Это источник правды о сценариях; код читает конфиг, не хардкодит сценарии. Поля-задел (`secretCard`, `reversedAllowed`) не добавляем — опишутся при реализации фичи.

```js
export const SPREADS = [
  {
    id: 'day',
    name: 'Карта дня',
    cardCount: 1,
    picksFromDeck: false,   // не выбирается — общая на сутки
    dailyForAll: true,      // одна на всех, детерминированно от даты (сид)
    positions: ['День'],
    themes: null,
    demo: false,            // показывается целиком
    tableCards: 1,          // одна рубашка
  },
  {
    id: 'three',
    name: 'Три карты',
    cardCount: 3,
    picksFromDeck: true,
    positions: ['Прошлое', 'Настоящее', 'Будущее'],  // структурные подзаголовки
    tableCards: 8,          // 8 рубашек в веере
    themes: [
      { id: 'ppf',       name: 'Прошлое, Настоящее, Будущее', paid: false, freeLimit: 1 },
      { id: 'shadow',    name: 'Теневая сторона',             paid: true  },
      { id: 'purpose',   name: 'Предназначение',              paid: true  },
      { id: 'partner',   name: 'Идеальный партнёр',           paid: true  },
      { id: 'ancestral', name: 'Проклятие рода',              paid: true, sensitive: true },
    ],
    demo: { freeCards: 1 }, // ЗАДЕЛ: без подписки — вводная + 1 позиция, остальное под пейволом
  },
  {
    id: 'yesno',
    name: 'Да / Нет',
    cardCount: 1,
    picksFromDeck: true,
    needsQuestion: true,    // требуется ввод вопроса
    positions: ['Ответ'],
    tableCards: 8,
    themes: null,
    freeLimit: 3,           // 3 вопроса в сутки бесплатно
    demo: false,
  },
]

export const getSpread = (id) => SPREADS.find((s) => s.id === id) ?? null
```

**Step 2: Commit**

```bash
git add frontend/app/content/tarot/spreads.js
git commit -m "feat(tarot): add config-driven SPREADS (3 scenarios)"
```

---

## Задача 1.3: Заготовки текстов (плейсхолдеры)

**Files:**
- Create: `frontend/app/content/tarot/texts/day.js`
- Create: `frontend/app/content/tarot/texts/yesno.js`
- Create: `frontend/app/content/tarot/texts/three.js`

**Step 1: `texts/day.js` — 22 текста-плейсхолдера (Карта дня)**

```js
// TODO(content): заменить плейсхолдеры реальными текстами (пишутся в отдельном чате).
// Ключ — номер аркана (0..21).
export const DAY_TEXTS = Object.fromEntries(
  Array.from({ length: 22 }, (_, n) => [n, `[Карта дня · аркан ${n}] Текст-заготовка.`]),
)
```

**Step 2: `texts/yesno.js` — 22 поддерживающих текста-ответа**

```js
// TODO(content): заменить плейсхолдеры. Полюс yes/no берётся из DECK.yesno, здесь — только текст.
export const YESNO_TEXTS = Object.fromEntries(
  Array.from({ length: 22 }, (_, n) => [n, `[Да/Нет · аркан ${n}] Поддерживающий текст-заготовка.`]),
)
```

**Step 3: `texts/three.js` — 5 тем, у каждой intro + 22 карты (Модель 3)**

Текст цельный на пару «тема + карта»; от позиции (Прошлое/Настоящее/Будущее) НЕ зависит. Тон «ancestral» — мягкий/поддерживающий (задаётся при наполнении).

```js
// TODO(content): заменить плейсхолдеры реальными текстами. Тон 'ancestral' — мягкий/поддерживающий.
const cardsStub = (themeId) =>
  Object.fromEntries(Array.from({ length: 22 }, (_, n) => [n, `[Три карты · ${themeId} · аркан ${n}] Заготовка.`]))

export const THREE_TEXTS = {
  ppf:       { intro: '[intro · ppf] Вводный абзац темы.',       cards: cardsStub('ppf') },
  shadow:    { intro: '[intro · shadow] Вводный абзац темы.',    cards: cardsStub('shadow') },
  purpose:   { intro: '[intro · purpose] Вводный абзац темы.',   cards: cardsStub('purpose') },
  partner:   { intro: '[intro · partner] Вводный абзац темы.',   cards: cardsStub('partner') },
  ancestral: { intro: '[intro · ancestral] Вводный абзац темы.', cards: cardsStub('ancestral') },
}
```

**Step 4: Commit**

```bash
git add frontend/app/content/tarot/texts/
git commit -m "feat(tarot): add text placeholders (day/yesno/three, Model 3)"
```

---

## Задача 1.4: Хелперы колоды (`index.js`) — TDD

Чистые функции: `getDayCard()`, `assignRandomCards(count, exclude)`, `getText(...)`. Их тестируем test-first.

**Files:**
- Create: `frontend/app/content/tarot/index.js`
- Test: `frontend/app/content/tarot/__tests__/index.test.js`

**Step 1: Написать падающие тесты**

> Если во фронте нет jest/vitest (см. примечание к Фазе 1) — перенеси эти проверки в разовый node-скрипт `scratch/tarot-helpers.check.mjs` с `assert` и запусти `node scratch/tarot-helpers.check.mjs`; смысл проверок тот же.

```js
import { getDayCard, assignRandomCards, getText } from '../index'
import { DECK } from '../deck'

describe('getDayCard', () => {
  it('returns a deck card deterministically for a given date', () => {
    const a = getDayCard(new Date('2026-07-03T10:00:00+03:00'))
    const b = getDayCard(new Date('2026-07-03T23:00:00+03:00'))
    expect(a).toEqual(b)                 // одна карта на сутки
    expect(DECK).toContainEqual(a)       // это карта из колоды
  })

  it('changes across days', () => {
    const a = getDayCard(new Date('2026-07-03T12:00:00+03:00'))
    const b = getDayCard(new Date('2026-07-04T12:00:00+03:00'))
    expect(a.number).not.toBe(b.number) // допустимо редкое совпадение; при флаке заменить даты
  })
})

describe('assignRandomCards', () => {
  it('returns N distinct cards from the deck', () => {
    const picked = assignRandomCards(3, [])
    expect(picked).toHaveLength(3)
    const nums = picked.map((c) => c.number)
    expect(new Set(nums).size).toBe(3)             // без дублей
    picked.forEach((c) => expect(DECK).toContainEqual(c))
  })

  it('never returns an excluded card', () => {
    const exclude = [0, 1, 2]
    const picked = assignRandomCards(3, exclude)
    picked.forEach((c) => expect(exclude).not.toContain(c.number))
  })
})

describe('getText', () => {
  it('returns day text by arcana number', () => {
    expect(getText({ scenario: 'day', number: 0 })).toContain('аркан 0')
  })
  it('returns yesno text by arcana number', () => {
    expect(getText({ scenario: 'yesno', number: 5 })).toContain('аркан 5')
  })
  it('returns three-cards text by theme + number, plus intro', () => {
    expect(getText({ scenario: 'three', themeId: 'ppf', number: 7 })).toContain('аркан 7')
    expect(getText({ scenario: 'three', themeId: 'ppf', intro: true })).toContain('intro')
  })
})
```

**Step 2: Прогнать тесты — убедиться, что падают**

Run: `cd frontend && npm test -- content/tarot` (или node-скрипт).
Expected: FAIL — `index.js` не существует / функции не определены.

**Step 3: Реализовать хелперы**

```js
import { DECK } from './deck'
import { DAY_TEXTS } from './texts/day'
import { YESNO_TEXTS } from './texts/yesno'
import { THREE_TEXTS } from './texts/three'

// Сид от даты в TZ проекта (Europe/Moscow), совпадает с логикой суток на бэкенде.
function moscowDayKey(date = new Date()) {
  // en-CA даёт формат YYYY-MM-DD
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
  const [y, m, d] = s.split('-').map(Number)
  return y * 10000 + m * 100 + d
}

// «Карта дня» — детерминированно от даты, одна для всех.
export function getDayCard(date = new Date()) {
  const idx = moscowDayKey(date) % DECK.length
  return DECK[idx]
}

// Случайное назначение N карт без дублей, исключая номера из exclude.
export function assignRandomCards(count, exclude = []) {
  const pool = DECK.filter((c) => !exclude.includes(c.number))
  const picked = []
  const local = [...pool]
  for (let i = 0; i < count && local.length > 0; i += 1) {
    const j = Math.floor(Math.random() * local.length)
    picked.push(local.splice(j, 1)[0])
  }
  return picked
}

// Единая точка доступа к заготовкам текстов.
export function getText({ scenario, number, themeId, intro = false }) {
  if (scenario === 'day') return DAY_TEXTS[number]
  if (scenario === 'yesno') return YESNO_TEXTS[number]
  if (scenario === 'three') {
    const theme = THREE_TEXTS[themeId]
    if (!theme) return ''
    return intro ? theme.intro : theme.cards[number]
  }
  return ''
}
```

**Step 4: Прогнать тесты — убедиться, что проходят**

Run: `cd frontend && npm test -- content/tarot`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/app/content/tarot/index.js frontend/app/content/tarot/__tests__/
git commit -m "feat(tarot): add deck helpers (getDayCard/assignRandomCards/getText) + tests"
```

---

# ФАЗА 2 — Backend: суточные лимиты

> Эталон стиля — слайс `user_profile` (см. примечание к Фазе 2). Каждый файл повторяет его структуру.

## Задача 2.1: Backend-конфиг лимитов + TZ-хелпер

**Files:**
- Create: `backend/app/services/tarot_limits.py`

**Step 1: Создать конфиг и хелпер даты**

`tarot_limits` — единственный backend-источник чисел лимитов, синхронизируется вручную со `frontend/app/content/tarot/spreads.js`. Дата суток считается в Europe/Moscow.

```python
from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

PROJECT_TZ = ZoneInfo("Europe/Moscow")

# Синхронизировать вручную со SPREADS (frontend/app/content/tarot/spreads.js).
# Ключ: (spread_id, theme_id | None). Значение: суточный бесплатный лимит.
TAROT_LIMITS: dict[tuple[str, str | None], int] = {
    ("three", "ppf"): 1,
    ("yesno", None): 3,
}

# Платные сценарии/темы: доступ по подписке, суточного лимита нет.
PAID_KEYS: set[tuple[str, str | None]] = {
    ("three", "shadow"),
    ("three", "purpose"),
    ("three", "partner"),
    ("three", "ancestral"),
}


def project_today(now: datetime | None = None) -> date:
    """Текущая дата в TZ проекта (граница суток для лимитов и 'карты дня')."""
    moment = now.astimezone(PROJECT_TZ) if now else datetime.now(PROJECT_TZ)
    return moment.date()
```

**Step 2: Commit**

```bash
git add backend/app/services/tarot_limits.py
git commit -m "feat(tarot): add backend limits config + Moscow-TZ day helper"
```

---

## Задача 2.2: Domain entity `TarotUsageEntity`

**Files:**
- Create: `backend/app/domain/entities/tarot_usage.py`

**Step 1: Создать dataclass (по образцу `user_profile.py`)**

```python
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from uuid import UUID, uuid4


def _now() -> datetime:
    return datetime.now(UTC)


@dataclass(kw_only=True)
class TarotUsageEntity:
    auth_user_id: UUID
    spread_id: str
    usage_date: date
    theme_id: str | None = None
    count: int = 0
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=_now)
    updated_at: datetime = field(default_factory=_now)

    def increment(self) -> None:
        self.count += 1
        self.updated_at = _now()
```

**Step 2: Commit**

```bash
git add backend/app/domain/entities/tarot_usage.py
git commit -m "feat(tarot): add TarotUsageEntity"
```

---

## Задача 2.3: SQLAlchemy-модель + миграция Alembic

**Files:**
- Create: `backend/app/infrastructure/sql/models/tarot_usage_model.py`
- Modify: `backend/app/infrastructure/alembic/env.py` (импорт новой модели в metadata)
- Create: `backend/app/infrastructure/alembic/versions/<next>_tarot_usage.py`

**Step 1: Модель (по образцу `user_profile_model.py`)**

```python
from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.sql.models.base import Base


class TarotUsageModel(Base):
    __tablename__ = "tarot_usage"

    id: Mapped[UUID] = mapped_column(sa.Uuid, primary_key=True)
    auth_user_id: Mapped[UUID] = mapped_column(sa.Uuid, nullable=False, index=True)
    spread_id: Mapped[str] = mapped_column(sa.String(32), nullable=False)
    theme_id: Mapped[str | None] = mapped_column(sa.String(32), nullable=True)
    usage_date: Mapped[date] = mapped_column(sa.Date, nullable=False)
    count: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False,
    )

    __table_args__ = (
        sa.UniqueConstraint(
            "auth_user_id", "spread_id", "theme_id", "usage_date",
            name="uq_tarot_usage_day",
        ),
    )
```

**Step 2: Зарегистрировать модель в Alembic metadata**

Открыть `backend/app/infrastructure/alembic/env.py`, добавить импорт рядом с другими моделями (до `target_metadata = Base.metadata`):

```python
from app.infrastructure.sql.models.tarot_usage_model import TarotUsageModel  # noqa: F401
```

**Step 3: Определить номер следующей ревизии**

Проект нумерует ревизии вручную (`001`, `002`, …). Найти последнюю:

Run: `ls backend/app/infrastructure/alembic/versions/`
Взять максимальный номер, следующий = `<max+1>` (в примерах ниже — `003`, но **сверь фактический**).

**Step 4: Написать миграцию вручную (по образцу `002_add_user_profiles.py`)**

Файл `..._tarot_usage.py`:

```python
"""tarot_usage table"""
import sqlalchemy as sa
from alembic import op

revision = "003"          # СВЕРИ: следующий за фактическим последним
down_revision = "002"     # СВЕРИ: фактический последний
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tarot_usage",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("auth_user_id", sa.Uuid(), nullable=False),
        sa.Column("spread_id", sa.String(length=32), nullable=False),
        sa.Column("theme_id", sa.String(length=32), nullable=True),
        sa.Column("usage_date", sa.Date(), nullable=False),
        sa.Column("count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_tarot_usage_auth_user_id", "tarot_usage", ["auth_user_id"])
    op.create_unique_constraint(
        "uq_tarot_usage_day", "tarot_usage",
        ["auth_user_id", "spread_id", "theme_id", "usage_date"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_tarot_usage_day", "tarot_usage", type_="unique")
    op.drop_index("ix_tarot_usage_auth_user_id", table_name="tarot_usage")
    op.drop_table("tarot_usage")
```

> Примечание про NULL в UNIQUE: в PostgreSQL два NULL считаются различными, поэтому для `yesno` (`theme_id IS NULL`) уникальность по `(user, spread, NULL, date)` не сработает как ожидается на уровне constraint. Репозиторий (Задача 2.4) обрабатывает это явно через `get`-then-`insert/update` в рамках одной транзакции, а не полагается только на constraint. Constraint остаётся защитой для непустых `theme_id`.

**Step 5: Применить миграцию**

Run: `docker compose -f docker-compose.dev.yml exec backend uv run alembic upgrade head`
Expected: `Running upgrade 002 -> 003, tarot_usage table`, ошибок нет.

**Step 6: Commit**

```bash
git add backend/app/infrastructure/sql/models/tarot_usage_model.py \
        backend/app/infrastructure/alembic/env.py \
        backend/app/infrastructure/alembic/versions/
git commit -m "feat(tarot): add tarot_usage table + migration"
```

---

## Задача 2.4: Mapper + Repository

**Files:**
- Create: `backend/app/infrastructure/sql/mappers/tarot_usage_mapper.py`
- Create: `backend/app/repositories/tarot_usage_repo.py`

**Step 1: Mapper (по образцу `user_profile_mapper.py`)**

```python
from __future__ import annotations

from app.domain.entities.tarot_usage import TarotUsageEntity
from app.infrastructure.sql.models.tarot_usage_model import TarotUsageModel


class TarotUsageMapper:
    @staticmethod
    def to_entity(model: TarotUsageModel) -> TarotUsageEntity:
        return TarotUsageEntity(
            id=model.id,
            auth_user_id=model.auth_user_id,
            spread_id=model.spread_id,
            theme_id=model.theme_id,
            usage_date=model.usage_date,
            count=model.count,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_model(entity: TarotUsageEntity) -> TarotUsageModel:
        return TarotUsageModel(
            id=entity.id,
            auth_user_id=entity.auth_user_id,
            spread_id=entity.spread_id,
            theme_id=entity.theme_id,
            usage_date=entity.usage_date,
            count=entity.count,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )
```

**Step 2: Repository (Protocol + Sql, по образцу `user_profile_repo.py`)**

```python
from __future__ import annotations

from datetime import date
from typing import Protocol
from uuid import UUID

from sqlalchemy import select

from app.domain.entities.tarot_usage import TarotUsageEntity
from app.infrastructure.sql.mappers.tarot_usage_mapper import TarotUsageMapper
from app.infrastructure.sql.models.tarot_usage_model import TarotUsageModel


class ITarotUsageRepository(Protocol):
    async def get(
        self, auth_user_id: UUID, spread_id: str, theme_id: str | None, usage_date: date,
    ) -> TarotUsageEntity | None: ...

    async def save(self, usage: TarotUsageEntity) -> TarotUsageEntity: ...


class SqlTarotUsageRepository:
    def __init__(self, session) -> None:
        self._session = session

    async def get(self, auth_user_id, spread_id, theme_id, usage_date):
        stmt = select(TarotUsageModel).where(
            TarotUsageModel.auth_user_id == auth_user_id,
            TarotUsageModel.spread_id == spread_id,
            TarotUsageModel.theme_id.is_(None) if theme_id is None
            else TarotUsageModel.theme_id == theme_id,
            TarotUsageModel.usage_date == usage_date,
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return TarotUsageMapper.to_entity(model) if model else None

    async def save(self, usage: TarotUsageEntity) -> TarotUsageEntity:
        model = TarotUsageMapper.to_model(usage)
        merged = await self._session.merge(model)
        await self._session.flush()
        return TarotUsageMapper.to_entity(merged)
```

**Step 3: Commit**

```bash
git add backend/app/infrastructure/sql/mappers/tarot_usage_mapper.py \
        backend/app/repositories/tarot_usage_repo.py
git commit -m "feat(tarot): add tarot_usage mapper + repository"
```

---

## Задача 2.5: `TarotService` — TDD (ядро бизнес-логики)

Это ключевая логика лимитов: тестируем test-first с фейковым репозиторием (без БД, как `IUserRepository` в проекте).

**Files:**
- Create: `backend/app/services/tarot_service.py`
- Test: `backend/tests/services/test_tarot_service.py`

**Step 1: Написать падающие тесты**

> Сверь путь к тестам с фактической структурой (`ls backend/tests` / `backend/app/tests`). Используй существующий каталог тестов проекта.

```python
from datetime import date
from uuid import uuid4

import pytest

from app.domain.entities.tarot_usage import TarotUsageEntity
from app.services.tarot_service import TarotService


class FakeRepo:
    def __init__(self):
        self.rows: dict[tuple, TarotUsageEntity] = {}

    async def get(self, auth_user_id, spread_id, theme_id, usage_date):
        return self.rows.get((auth_user_id, spread_id, theme_id, usage_date))

    async def save(self, usage):
        self.rows[(usage.auth_user_id, usage.spread_id, usage.theme_id, usage.usage_date)] = usage
        return usage


TODAY = date(2026, 7, 3)


@pytest.mark.asyncio
async def test_free_limited_allows_until_limit_then_blocks():
    svc = TarotService(FakeRepo())
    uid = uuid4()
    # yesno: лимит 3 в сутки
    for i in range(3):
        res = await svc.check_and_consume(uid, "yesno", None, is_subscribed=False, today=TODAY)
        assert res.allowed is True
        assert res.remaining == 2 - i
    blocked = await svc.check_and_consume(uid, "yesno", None, is_subscribed=False, today=TODAY)
    assert blocked.allowed is False
    assert blocked.reason == "limit"


@pytest.mark.asyncio
async def test_subscriber_bypasses_free_limit():
    svc = TarotService(FakeRepo())
    uid = uuid4()
    for _ in range(10):
        res = await svc.check_and_consume(uid, "yesno", None, is_subscribed=True, today=TODAY)
        assert res.allowed is True
    assert res.remaining is None  # безлимит


@pytest.mark.asyncio
async def test_paid_theme_requires_subscription():
    svc = TarotService(FakeRepo())
    uid = uuid4()
    denied = await svc.check_and_consume(uid, "three", "shadow", is_subscribed=False, today=TODAY)
    assert denied.allowed is False
    assert denied.reason == "subscription"
    ok = await svc.check_and_consume(uid, "three", "shadow", is_subscribed=True, today=TODAY)
    assert ok.allowed is True


@pytest.mark.asyncio
async def test_three_ppf_free_once_per_day():
    svc = TarotService(FakeRepo())
    uid = uuid4()
    first = await svc.check_and_consume(uid, "three", "ppf", is_subscribed=False, today=TODAY)
    assert first.allowed is True and first.remaining == 0
    second = await svc.check_and_consume(uid, "three", "ppf", is_subscribed=False, today=TODAY)
    assert second.allowed is False and second.reason == "limit"


@pytest.mark.asyncio
async def test_get_limits_reports_remaining():
    svc = TarotService(FakeRepo())
    uid = uuid4()
    await svc.check_and_consume(uid, "yesno", None, is_subscribed=False, today=TODAY)
    limits = await svc.get_limits(uid, is_subscribed=False, today=TODAY)
    # remaining для yesno = 2 после одного использования
    assert limits[("yesno", None)] == 2
    assert limits[("three", "ppf")] == 1
```

**Step 2: Прогнать — убедиться, что падают**

Run: `docker compose -f docker-compose.dev.yml exec backend uv run pytest tests/services/test_tarot_service.py -v`
Expected: FAIL — `TarotService` не существует.

**Step 3: Реализовать сервис**

```python
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from uuid import UUID

from app.domain.entities.tarot_usage import TarotUsageEntity
from app.services.tarot_limits import PAID_KEYS, TAROT_LIMITS, project_today


@dataclass(frozen=True)
class LimitResult:
    allowed: bool
    remaining: int | None = None          # None = безлимит (подписчик)
    reason: str | None = None             # 'limit' | 'subscription'


class TarotService:
    def __init__(self, repo) -> None:
        self._repo = repo

    async def check_and_consume(
        self, auth_user_id: UUID, spread_id: str, theme_id: str | None,
        *, is_subscribed: bool, today: date | None = None,
    ) -> LimitResult:
        key = (spread_id, theme_id)
        day = today or project_today()

        # Платные темы: гейт по подписке, без учёта суток.
        if key in PAID_KEYS:
            return LimitResult(allowed=True) if is_subscribed else LimitResult(allowed=False, reason="subscription")

        # Бесплатные с суточным лимитом.
        if key in TAROT_LIMITS:
            if is_subscribed:
                return LimitResult(allowed=True, remaining=None)  # подписчик — безлимит
            limit = TAROT_LIMITS[key]
            usage = await self._repo.get(auth_user_id, spread_id, theme_id, day)
            used = usage.count if usage else 0
            if used >= limit:
                return LimitResult(allowed=False, reason="limit")
            if usage is None:
                usage = TarotUsageEntity(
                    auth_user_id=auth_user_id, spread_id=spread_id, theme_id=theme_id, usage_date=day,
                )
            usage.increment()
            await self._repo.save(usage)
            return LimitResult(allowed=True, remaining=limit - usage.count)

        # Неизвестный/безлимитный ключ (например 'day' сюда не приходит) — пропускаем.
        return LimitResult(allowed=True, remaining=None)

    async def get_limits(
        self, auth_user_id: UUID, *, is_subscribed: bool, today: date | None = None,
    ) -> dict[tuple[str, str | None], int | None]:
        day = today or project_today()
        out: dict[tuple[str, str | None], int | None] = {}
        for key, limit in TAROT_LIMITS.items():
            if is_subscribed:
                out[key] = None  # безлимит
                continue
            usage = await self._repo.get(auth_user_id, key[0], key[1], day)
            used = usage.count if usage else 0
            out[key] = max(0, limit - used)
        return out
```

**Step 4: Прогнать — убедиться, что проходят**

Run: `docker compose -f docker-compose.dev.yml exec backend uv run pytest tests/services/test_tarot_service.py -v`
Expected: PASS (все 5).

**Step 5: Commit**

```bash
git add backend/app/services/tarot_service.py backend/tests/services/test_tarot_service.py
git commit -m "feat(tarot): add TarotService limit logic + unit tests"
```

---

## Задача 2.6: Роуты `/api/v1/tarot/*` + регистрация

**Files:**
- Create: `backend/app/api/v1/routes/tarot.py`
- Modify: `backend/app/api/v1/router.py` (include_router)

> **КРИТИЧЕСКАЯ ПРОВЕРКА перед реализацией:** по отчёту исследования, `S2SAuthMiddleware` может возвращать **403 для неподписчиков на всех аутентифицированных маршрутах**. Наши лимитные роуты должны быть доступны **залогиненным без подписки**. Открой `backend/app/infrastructure/middleware/s2s_auth.py` и проверь: (а) есть ли список путей, требующих активной подписки, или гейт применяется глобально; (б) как `subscriptions/me` (доступный неподписчикам) обходит гейт. Реализуй `/tarot/*` по тому же принципу, что и `subscriptions/me` — **только аутентификация, без гейта подписки**. Если middleware блокирует глобально — добавить `/tarot` в whitelist «только-auth». Зафиксируй найденное решение в комментарии роутера.

**Step 1: Роуты (по образцу `profile.py` — инлайн `Service(Repo(session))`)**

```python
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import get_current_user, get_db_session
from app.infrastructure.clients.auth_clients import UserContext
from app.repositories.tarot_usage_repo import SqlTarotUsageRepository
from app.services.tarot_service import TarotService

router = APIRouter(prefix="/tarot", tags=["tarot"])


class UsageRequest(BaseModel):
    spread_id: str
    theme_id: str | None = None


class UsageResponse(BaseModel):
    allowed: bool
    remaining: int | None = None
    reason: str | None = None


class LimitsResponse(BaseModel):
    # ключ сериализуем как "spread_id:theme_id" (theme_id может быть пустым)
    limits: dict[str, int | None]


def _key_str(spread_id: str, theme_id: str | None) -> str:
    return f"{spread_id}:{theme_id or ''}"


@router.get("/limits", response_model=LimitsResponse)
async def get_limits(
    current_user: UserContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    svc = TarotService(SqlTarotUsageRepository(session))
    raw = await svc.get_limits(
        current_user.user_id, is_subscribed=current_user.has_active_subscription,
    )
    return LimitsResponse(limits={_key_str(s, t): v for (s, t), v in raw.items()})


@router.post("/usage", response_model=UsageResponse)
async def post_usage(
    body: UsageRequest,
    current_user: UserContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    svc = TarotService(SqlTarotUsageRepository(session))
    res = await svc.check_and_consume(
        current_user.user_id, body.spread_id, body.theme_id,
        is_subscribed=current_user.has_active_subscription,
    )
    return UsageResponse(allowed=res.allowed, remaining=res.remaining, reason=res.reason)
```

**Step 2: Зарегистрировать роутер**

В `backend/app/api/v1/router.py` добавить рядом с остальными:

```python
from app.api.v1.routes.tarot import router as tarot_router
...
router.include_router(tarot_router)   # /api/v1/tarot/*
```

**Step 3: Smoke-проверка endpoints**

Run (после перезапуска backend-контейнера, залогиненным пользователем — cookie):
```bash
curl -s -X POST http://localhost/api/v1/tarot/usage \
  -H 'Content-Type: application/json' -b "access_token=<token>" \
  -d '{"spread_id":"yesno"}'
```
Expected: `{"allowed":true,"remaining":2,"reason":null}`; повтор 4 раза → `{"allowed":false,...,"reason":"limit"}`.
Также `GET /api/v1/tarot/limits` → JSON с `three:ppf` и `yesno:`.

**Step 4: Commit**

```bash
git add backend/app/api/v1/routes/tarot.py backend/app/api/v1/router.py
git commit -m "feat(tarot): add /tarot/limits and /tarot/usage routes"
```

---

# ФАЗА 3 — Frontend: API-клиент лимитов

## Задача 3.1: Тонкий клиент лимитов

**Files:**
- Create: `frontend/app/content/tarot/api.js`

**Step 1: Реализовать fetch-обёртки (same-origin, куки автоматически)**

```js
// Тонкий клиент над backend-лимитами. Same-origin, HttpOnly cookie шлётся автоматически.
export async function fetchLimits() {
  const res = await fetch('/api/v1/tarot/limits')
  if (!res.ok) return null
  const data = await res.json()
  return data.limits // { 'three:ppf': 1|null, 'yesno:': 3|null }
}

// Возвращает { allowed, remaining, reason }. reason: 'limit' | 'subscription' | 'auth'.
export async function consumeUsage(spreadId, themeId = null) {
  const res = await fetch('/api/v1/tarot/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spread_id: spreadId, theme_id: themeId }),
  })
  if (res.status === 401) return { allowed: false, reason: 'auth' }
  if (!res.ok) return { allowed: false, reason: 'error' }
  return res.json()
}
```

**Step 2: Commit**

```bash
git add frontend/app/content/tarot/api.js
git commit -m "feat(tarot): add frontend limits API client"
```

---

# ФАЗА 4 — Frontend: TarotClient и под-роуты

> Визуал/анимации — задел, не финал (дизайн §7). Цель фазы — рабочая структура и механика. Стили — минимальные модульные CSS; веер/flip — базовая реализация, владелец допилит в Claude Design.

## Задача 4.1: Общие UI-компоненты веера и карты

**Files:**
- Create: `frontend/app/tarot/components/CardFan.jsx` (N одинаковых рубашек; `onPick(index)`)
- Create: `frontend/app/tarot/components/TarotCard.jsx` (лицо карты: `en`, `ru`, номер; flip-состояние)
- Create: `frontend/app/tarot/components/tarot.module.css`

**Step 1: `TarotCard.jsx`** — карта с двумя состояниями (рубашка / лицо). Props: `card` (`{number,en,ru}` или null), `faceUp` (bool). Рисует названия (картинок пока нет — задел `card.image`).

**Step 2: `CardFan.jsx`** — принимает `count`, `disabledIndices`, `onPick(index)`; рисует `count` одинаковых рубашек веером; клик по невыбранной → `onPick`. Логику назначения карт держит родитель (использует `assignRandomCards`).

**Step 3: Commit**

```bash
git add frontend/app/tarot/components/
git commit -m "feat(tarot): add CardFan + TarotCard UI components"
```

---

## Задача 4.2: Экран выбора сценария `/tarot`

**Files:**
- Create: `frontend/app/tarot/page.jsx` (server component: metadata + `<TarotClient/>`)
- Create: `frontend/app/tarot/TarotClient.jsx` (клиент: 3 карточки сценариев из `SPREADS`, ссылки на под-роуты)

**Step 1: `page.jsx`** (по образцу существующего `tarot/page.jsx` — server component с metadata; НЕ использует `getProduct`/`ProductPage`).

```jsx
import TarotClient from './TarotClient'

export const metadata = {
  title: 'Расклад Таро',
  description: 'Три сценария: карта дня, три карты, да/нет',
}

export default function TarotPage() {
  return <TarotClient />
}
```

**Step 2: `TarotClient.jsx`** — читает `SPREADS`, рисует 3 карточки (`Карта дня` / `Три карты` / `Да / Нет`) со ссылками (`next/link`) на `/tarot/day`, `/tarot/three`, `/tarot/yesno`.

**Step 3: Commit**

```bash
git add frontend/app/tarot/page.jsx frontend/app/tarot/TarotClient.jsx
git commit -m "feat(tarot): scenario picker screen at /tarot"
```

---

## Задача 4.3: Под-роут «Карта дня» `/tarot/day`

**Files:**
- Create: `frontend/app/tarot/day/page.jsx`
- Create: `frontend/app/tarot/day/DayClient.jsx`

**Step 1: `DayClient.jsx`** — одна рубашка. Клик → flip → `getDayCard()` → карта + `getText({scenario:'day', number})`. Без лимитов, без бэкенда, без проверки авторизации (публично).

**Step 2: `page.jsx`** — server wrapper + metadata.

**Step 3: Commit**

```bash
git add frontend/app/tarot/day/
git commit -m "feat(tarot): /tarot/day (deterministic daily card, no backend)"
```

---

## Задача 4.4: Под-роут «Да / Нет» `/tarot/yesno`

**Files:**
- Create: `frontend/app/tarot/yesno/page.jsx`
- Create: `frontend/app/tarot/yesno/YesNoClient.jsx`

**Step 1: `YesNoClient.jsx`** — поток по дизайну §7.3:
1. `useAuth()`: если не залогинен — сообщение + ссылка на `/register` (сценарий только для залогиненных).
2. Поле ввода вопроса. По «отправить» → `consumeUsage('yesno')`:
   - `allowed:false, reason:'auth'` → предложить вход;
   - `allowed:false, reason:'limit'` → «доступно завтра» + предложение подписки (`<Paywall/>`);
   - `allowed:true` → показать веер из 8 рубашек (`spread.tableCards`).
3. Выбор 1 карты → `assignRandomCards(1)` → flip.
4. Экран ответа: карта → крупно **Да/Нет** из `DECK.yesno` → текст `getText({scenario:'yesno', number})`.

**Step 2: `page.jsx`** — server wrapper + metadata.

**Step 3: Commit**

```bash
git add frontend/app/tarot/yesno/
git commit -m "feat(tarot): /tarot/yesno (question + limit-gated single card)"
```

---

## Задача 4.5: Под-роут «Три карты» `/tarot/three`

**Files:**
- Create: `frontend/app/tarot/three/page.jsx`
- Create: `frontend/app/tarot/three/ThreeClient.jsx`

**Step 1: `ThreeClient.jsx`** — поток по дизайну §7.2:
1. `useAuth()`: не залогинен → предложить вход.
2. Экран выбора темы: 5 тем из `spread.themes`; платные (`paid:true`) помечены; без подписки — ведут на пейвол/демо.
3. Бесплатная тема `ppf`: `consumeUsage('three','ppf')`:
   - `allowed:false, reason:'limit'` → «доступно завтра» + `<Paywall/>`;
   - `allowed:true` → веер из 8 → выбор 3 → `assignRandomCards(3)` → расклад из 3 позиций (подзаголовки `spread.positions`) + `getText({scenario:'three', themeId:'ppf', intro:true})` + по карте `getText({scenario:'three', themeId:'ppf', number})`. **Бесплатная тема — целиком.**
4. Платная тема: `user.subscribed` → полный расклад; иначе **демо-заглушка** (data-driven из `spread.demo.freeCards`): открыта вводная + `freeCards` позиций, остальное под `<Paywall/>`. Механику демо вынести в одну функцию `renderDemo(spread, cards)`, чтобы владелец менял в одном месте.

**Step 2: `page.jsx`** — server wrapper + metadata.

**Step 3: Commit**

```bash
git add frontend/app/tarot/three/
git commit -m "feat(tarot): /tarot/three (theme picker, ppf free, paid demo stub)"
```

---

# ФАЗА 5 — Чистка старого Таро и каталог

## Задача 5.1: Удалить старую реализацию Таро

**Files:**
- Delete: `frontend/app/tarot/TarotFreeResult.jsx`
- Delete: `frontend/app/tarot/TarotPaidResult.jsx`
- Delete: `frontend/app/tarot/results.module.css` (если не переиспользуется новыми компонентами — проверить импорты)
- Delete: `frontend/app/content/tarot.js`

**Step 1: Проверить, что на удаляемые файлы нет ссылок**

Run: `cd frontend && grep -rn "TarotFreeResult\|TarotPaidResult\|content/tarot'" app/ || echo "no refs"`
Expected: ссылки только из удаляемого старого `page.jsx` (переписан в Задаче 4.2) — иначе поправить.

> Старый `tarot/page.jsx` уже перезаписан в Задаче 4.2. Убедиться, что он больше не импортирует `getProduct`/`ProductPage`/старые Result-компоненты.

**Step 2: Удалить файлы и закоммитить**

```bash
git rm frontend/app/tarot/TarotFreeResult.jsx frontend/app/tarot/TarotPaidResult.jsx frontend/app/content/tarot.js
# results.module.css — только если не используется новыми компонентами
git commit -m "chore(tarot): remove legacy single-spread stub"
```

---

## Задача 5.2: Обновить запись в каталоге продуктов

**Files:**
- Modify: `frontend/app/products.config.js` (запись `tarot`)

**Step 1: Обновить запись `tarot`**

Оставить одну запись-вход в каталог. Убрать `inputs`/`extraInputs` (ввод теперь внутри сценариев, не через `ProductPage`). Проверить, как каталог строит ссылку — она должна вести на `/tarot` (экран выбора сценария), что уже работает по slug.

```js
{
  id: 'tarot',
  name: 'Расклад Таро',
  slug: 'tarot',
  tag: 'Гадание на картах',
  icon: 'Layers',
  description: 'Карта дня, три карты, да/нет',
  inputs: [],
  extraInputs: [],
}
```

> Проверить, не ломает ли пустой `extraInputs` каталожную карточку/`getProduct`. Если каталог где-то ожидает, что клик по продукту откроет `ProductPage` — убедиться, что для `tarot` переход идёт на кастомный `/tarot` (наш `page.jsx`), а не на универсальную обёртку.

**Step 2: Commit**

```bash
git add frontend/app/products.config.js
git commit -m "chore(tarot): point catalog entry to multi-scenario /tarot"
```

---

# ФАЗА 6 — Верификация (единый прогон)

> Per-task сборок/скриншотов НЕ делали намеренно. Финальная проверка — один Docker-прогон. Node в этом окружении только через Docker; `NODE_ENV=development` ломает `next build` — собирать production-режимом.

## Задача 6.1: Backend-тесты и миграция

Run:
```bash
docker compose -f docker-compose.dev.yml exec backend uv run pytest tests/ -v
docker compose -f docker-compose.dev.yml exec backend uv run alembic upgrade head
```
Expected: все тесты зелёные; миграция на `head` без ошибок.

## Задача 6.2: Frontend-сборка

Run:
```bash
docker compose -f docker-compose.dev.yml exec frontend npm run build
```
Expected: production-сборка Next.js без ошибок; роуты `/tarot`, `/tarot/day`, `/tarot/three`, `/tarot/yesno` присутствуют в выводе.

> Если фронт-тест-раннер есть — также `docker compose ... exec frontend npm test`.

## Задача 6.3: Ручной прогон сценариев (через nginx на :80)

Проверить вручную в браузере (залогиненным неподписчиком и подписчиком):
1. `/tarot` — 3 карточки, ссылки ведут в под-роуты.
2. `/tarot/day` — клик по рубашке → карта + текст; та же карта после перезагрузки; работает без входа.
3. `/tarot/yesno` — вопрос → веер → карта → Да/Нет + текст; после 3 вопросов неподписчик видит «доступно завтра» + пейвол; подписчик — без лимита.
4. `/tarot/three` — выбор темы; `ppf` бесплатно 1 раз/сутки (2-й раз неподписчику — пейвол); платная тема неподписчику → демо + пейвол, подписчику → полный расклад.
5. Проверить `POST /api/v1/tarot/usage` доступен залогиненному **без подписки** (middleware не режет 403) — ключевой риск из Задачи 2.6.

## Задача 6.4: Финальный статус

Сообщить пользователю: что реализовано, что осталось как задел (тексты-плейсхолдеры → отдельный чат; финальный визуал → Claude Design; демо платных тем → дефолт-заглушка).

---

## Приложение — контрольный список синхронизации лимитов

При любом изменении лимитов держать в синхроне **два места** (осознанное дублирование, §8.4 дизайна):
- `frontend/app/content/tarot/spreads.js` — `freeLimit` в `SPREADS`.
- `backend/app/services/tarot_limits.py` — `TAROT_LIMITS`.
