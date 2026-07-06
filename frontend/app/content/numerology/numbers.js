// Единственный источник правды по нумерологическим формулам (дизайн §5, Прил. A/B).
// Всё детерминировано и чисто: «сегодня» передаётся аргументом.

// ── Таблицы букв → числа (Приложение A) ──────────────────────────────────────
const CYRILLIC = {
  а:1, б:2, в:3, г:4, д:5, е:6, ё:7, ж:8, з:9,
  и:1, й:2, к:3, л:4, м:5, н:6, о:7, п:8, р:9,
  с:1, т:2, у:3, ф:4, х:5, ц:6, ч:7, ш:8, щ:9,
  ъ:1, ы:2, ь:3, э:4, ю:5, я:6,
}
const LATIN = {
  a:1, b:2, c:3, d:4, e:5, f:6, g:7, h:8, i:9,
  j:1, k:2, l:3, m:4, n:5, o:6, p:7, q:8, r:9,
  s:1, t:2, u:3, v:4, w:5, x:6, y:7, z:8,
}
const CYR_VOWELS = new Set(['а','е','ё','и','о','у','ы','э','ю','я'])
const LAT_VOWELS = new Set(['a','e','i','o','u']) // y — согласная

function letterValue(ch) {
  return CYRILLIC[ch] ?? LATIN[ch] ?? 0
}
function isVowel(ch) {
  return CYR_VOWELS.has(ch) || LAT_VOWELS.has(ch)
}
function letters(name) {
  return String(name).toLowerCase().split('').filter(ch => ch in CYRILLIC || ch in LATIN)
}

// ── Свёртки ─────────────────────────────────────────────────────────────────
export function reduceKeepMaster(n) {
  while (n > 9 && n !== 11 && n !== 22) {
    n = String(n).split('').reduce((a, d) => a + Number(d), 0)
  }
  return n
}
export function reduceToDigit(n) {
  while (n > 9) {
    n = String(n).split('').reduce((a, d) => a + Number(d), 0)
  }
  return n
}

// ── Разбор ISO-даты 'YYYY-MM-DD' ─────────────────────────────────────────────
function parseISO(date) {
  const [y, m, d] = String(date).split('-').map(Number)
  return { y, m, d }
}

// ── Идентификационные числа (11/22 сохраняются) ──────────────────────────────
export function lifePath(date) {
  const { y, m, d } = parseISO(date)
  const dd = reduceKeepMaster(d)
  const mm = reduceKeepMaster(m)
  const yy = reduceKeepMaster(y)
  return reduceKeepMaster(dd + mm + yy)
}
export function expression(name) {
  const sum = letters(name).reduce((a, ch) => a + letterValue(ch), 0)
  return reduceKeepMaster(sum)
}
export function soul(name) {
  const sum = letters(name).filter(isVowel).reduce((a, ch) => a + letterValue(ch), 0)
  return reduceKeepMaster(sum)
}

// ── «Сегодня» в TZ проекта (Europe/Moscow) ───────────────────────────────────
// Дублируется из Таро намеренно: продукты не связываем импортами между собой.
export function moscowDayKey(date = new Date()) {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
  const [y, m, d] = s.split('-').map(Number)
  return y * 10000 + m * 100 + d
}
function moscowParts(date = new Date()) {
  const key = moscowDayKey(date)
  return { y: Math.floor(key / 10000), m: Math.floor(key / 100) % 100, d: key % 100 }
}

// ── Персональные циклы (сводятся к 1..9, без мастер-чисел) ────────────────────
export function personalYear(birthDate, today = new Date()) {
  const b = parseISO(birthDate)
  const t = moscowParts(today)
  return reduceToDigit(reduceToDigit(b.d) + reduceToDigit(b.m) + reduceToDigit(t.y))
}
export function personalMonth(birthDate, today = new Date()) {
  return reduceToDigit(personalYear(birthDate, today) + moscowParts(today).m)
}
export function personalDay(birthDate, today = new Date()) {
  return reduceToDigit(personalMonth(birthDate, today) + moscowParts(today).d)
}

// ── Парные числа (Совместимость) ─────────────────────────────────────────────
export function pairNumber(lp1, lp2) {
  return reduceKeepMaster(lp1 + lp2)
}
export function pairKey(a, b) {
  return [a, b].sort((x, y) => x - y).join('-') // числовая сортировка
}
export function nameCompat(expr1, expr2) {
  return reduceKeepMaster(expr1 + expr2)
}

// ── Выбор варианта «Дня» ─────────────────────────────────────────────────────
export function dayVariantIndex(today = new Date(), count = 1) {
  return count > 0 ? moscowDayKey(today) % count : 0
}
