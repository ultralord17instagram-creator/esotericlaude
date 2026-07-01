# Matrix Content — Design Document

**Date:** 2026-06-30
**Goal:** Replace all 462 placeholder strings in `matrix-content.js` with real interpretation texts in Russian.

## Scope

- `MATRIX_CONTENT`: 22 arcana × 13 aspects = 286 texts
- `CHAKRA_CONTENT`: 8 chakras × 22 numbers = 176 texts
- Total: 462 texts

## Content Rules

- Length: 1–2 paragraphs per text (~120–200 words)
- Style: mixed esoteric (tarot/arcana imagery) + psychological (traits, patterns, motivation)
- Language: Russian
- **No em dashes (—).** Use commas, colons, periods, or parentheses instead.
- No filler phrases. Every sentence must add information.

## Arcana Mapping (Tarot → Matrix of Destiny)

| Number | Tarot Arcana | Core Energy |
|--------|-------------|-------------|
| 1  | Маг | Воля, инициатива, начало |
| 2  | Верховная Жрица | Интуиция, тайна, знание |
| 3  | Императрица | Творчество, изобилие, красота |
| 4  | Император | Власть, структура, порядок |
| 5  | Иерофант | Традиции, наставничество, вера |
| 6  | Влюблённые | Выбор, любовь, гармония |
| 7  | Колесница | Движение, воля, победа |
| 8  | Сила | Внутренняя мощь, терпение, контроль |
| 9  | Отшельник | Мудрость, уединение, поиск |
| 10 | Колесо Фортуны | Судьба, циклы, перемены |
| 11 | Справедливость | Баланс, карма, честность |
| 12 | Повешенный | Жертва, пауза, переосмысление |
| 13 | Смерть | Трансформация, завершение, обновление |
| 14 | Умеренность | Алхимия, терпение, синтез |
| 15 | Дьявол | Искушение, зависимость, теневая сторона |
| 16 | Башня | Разрушение иллюзий, кризис, освобождение |
| 17 | Звезда | Надежда, вдохновение, путеводный свет |
| 18 | Луна | Подсознание, иллюзии, страхи |
| 19 | Солнце | Успех, радость, жизненная сила |
| 20 | Суд | Пробуждение, призыв, переоценка |
| 21 | Мир | Завершённость, интеграция, мастерство |
| 22 | Шут | Свобода, доверие потоку, абсолют |

## Aspects

**Free (shown to all users):**
- `personality` — общая характеристика личности с этим числом в центре матрицы
- `lessons` — кармические уроки прошлого, которые несёт это число

**Paid:**
- `relationships` — паттерны в отношениях
- `money` — отношение к деньгам и материальному
- `socialRole` — роль в социуме
- `ancestral` — родовые задачи и программы
- `talents` — природные таланты
- `parentLimits` — ограничения, полученные от родителей
- `personalPurpose` — личное предназначение (20–40 лет)
- `socialPurpose` — социальное предназначение (40–60 лет)
- `spiritualPurpose` — духовное предназначение (после 60)
- `yearForecast` — как это число влияет на персональные годы
- `sexuality` — сексуальная энергия и паттерны

## Chakra Content

Each chakra text for a given number describes how that arcana energy manifests in that energy center:
- `sahasrara` — связь с высшим, духовность, смысл
- `ajna` — интуиция, ясность, видение
- `vishuddha` — самовыражение, коммуникация
- `anahata` — любовь, сочувствие, сердце
- `manipura` — воля, сила, самооценка
- `svadhishthana` — творчество, сексуальность, эмоции
- `muladhara` — безопасность, тело, основа
- `general` — общий энергетический итог

## Writing Order

1. `personality` for arcana 1–22
2. `lessons` for arcana 1–22
3. Paid aspects for arcana 1–22 (one aspect at a time)
4. `CHAKRA_CONTENT` (one chakra at a time, arcana 1–22)

## File Change

Replace the dynamic `placeholder()` function with a full static export:

```js
export const MATRIX_CONTENT = {
  1: { personality: "...", lessons: "...", ... },
  ...
  22: { ... }
}

export const CHAKRA_CONTENT = {
  sahasrara: { 1: "...", ..., 22: "..." },
  ...
}
```

All other exports (`FREE_ASPECTS`, `PAID_ASPECTS`, `ASPECT_LABELS`, `CHAKRA_LABELS`) remain unchanged.
