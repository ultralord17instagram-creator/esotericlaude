'use client'
import styles from './matrix.module.css'

// Geometry & styling ported 1:1 from the Claude Design mockup
// (design-reference/matrix-reference). viewBox 800×800, centre at 400,400.
// Node → value mapping matches calculateMatrix():
//   left=day, top=month, right=year, bottom=karma, centre=personality,
//   diagonals=sums of neighbours, inner nodes=on male/female lines.

const MALE = '#4C6E7B'    // male line — cool
const FEMALE = '#C0764E'  // female line — warm
const GRAPHITE = '#1B1A30'
const PARCH = '#FBF7EF'
const CREAM = '#F3ECDB'
const INK = '#3A3550'
const GOLD = '#B9954F'
const GOLD_TEXT = '#E9C877'
const MUTED = '#9A8D72'
const AGE = '#A99E86'

// Circle positions (viewBox 800)
const POS = {
  left:   { x: 150, y: 400 },  // day
  top:    { x: 400, y: 150 },  // month
  right:  { x: 650, y: 400 },  // year
  bottom: { x: 400, y: 650 },  // karma
  tl: { x: 223.2, y: 223.2 },  // top_left
  tr: { x: 576.8, y: 223.2 },  // top_right
  br: { x: 576.8, y: 576.8 },  // bot_right
  bl: { x: 223.2, y: 576.8 },  // bot_left
  male1:   { x: 272, y: 400 }, // left ↔ centre
  male2:   { x: 400, y: 272 }, // top ↔ centre
  female1: { x: 528, y: 400 }, // right ↔ centre
  female2: { x: 400, y: 528 }, // bottom ↔ centre
  centre:  { x: 400, y: 400 },
}

function NodeNum({ pos, value, size, fill }) {
  return (
    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
      fontFamily="var(--font-heading)" fontSize={size} fill={fill}>
      {value}
    </text>
  )
}

export default function MatrixSVG({ nodes, highlight = [] }) {
  const { d, m, y, k, center, top_left, top_right, bot_right, bot_left, male1, male2, female1, female2 } = nodes

  return (
    <div className={styles.diagram}>
      <svg viewBox="0 0 800 800" width="100%" style={{ display: 'block' }}
        fontFamily="var(--font-body)">

        {/* ===== Каркас ===== */}
        <polygon
          points="400,150 576.8,223.2 650,400 576.8,576.8 400,650 223.2,576.8 150,400 223.2,223.2"
          fill="none" stroke="rgba(30,29,52,.26)" strokeWidth="1.4" />
        <polygon
          points="223.2,223.2 576.8,223.2 576.8,576.8 223.2,576.8"
          fill="none" stroke="rgba(30,29,52,.30)" strokeWidth="1.3" strokeDasharray="6 7" />
        <line x1="150" y1="400" x2="650" y2="400" stroke="rgba(30,29,52,.20)" strokeWidth="1.3" />
        <line x1="400" y1="150" x2="400" y2="650" stroke="rgba(30,29,52,.20)" strokeWidth="1.3" />

        {/* ===== Смысловые линии ===== */}
        <path d="M150,400 L400,400 L400,150" fill="none" stroke={MALE} strokeWidth="7"
          strokeLinecap="round" strokeLinejoin="round" opacity=".85" />
        <path d="M400,650 L400,400 L650,400" fill="none" stroke={FEMALE} strokeWidth="7"
          strokeLinecap="round" strokeLinejoin="round" opacity=".85" />

        {/* Подписи линий (в зазорах между кругами) */}
        <text x="298" y="300" transform="rotate(-45 298 300)" textAnchor="middle"
          fill={MALE} fontSize="14" fontWeight="600" letterSpacing="1.6"
          style={{ textTransform: 'uppercase' }}>Мужская линия</text>
        <text x="502" y="500" transform="rotate(-45 502 500)" textAnchor="middle"
          fill={FEMALE} fontSize="14" fontWeight="600" letterSpacing="1.6"
          style={{ textTransform: 'uppercase' }}>Женская линия</text>

        {/* ===== Шкала возраста ===== */}
        <g fill={AGE} fontSize="11.5" fontWeight="500">
          <text x="79" y="404" textAnchor="middle">0 лет</text>
          <text x="400" y="80" textAnchor="middle">20</text>
          <text x="723" y="404" textAnchor="middle">40</text>
          <text x="400" y="734" textAnchor="middle">60</text>
          <text x="196" y="196" textAnchor="middle" opacity=".8">10</text>
          <text x="604" y="196" textAnchor="middle" opacity=".8">30</text>
          <text x="604" y="608" textAnchor="middle" opacity=".8">50</text>
          <text x="196" y="608" textAnchor="middle" opacity=".8">70</text>
        </g>

        {/* ===== Диагональные вершины ===== */}
        <g>
          {[[POS.tl, top_left], [POS.tr, top_right], [POS.br, bot_right], [POS.bl, bot_left]].map(([p, v], i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="30" fill={PARCH} stroke="rgba(30,29,52,.28)" strokeWidth="1.4" />
              <NodeNum pos={p} value={v} size="25" fill={INK} />
            </g>
          ))}
        </g>

        {/* ===== Внутренние круги на линиях ===== */}
        <g>
          <circle cx={POS.male1.x} cy={POS.male1.y} r="26" fill={MALE} stroke="rgba(255,255,255,.35)" strokeWidth="1" />
          <NodeNum pos={POS.male1} value={male1} size="21" fill={CREAM} />
          <circle cx={POS.male2.x} cy={POS.male2.y} r="26" fill={MALE} stroke="rgba(255,255,255,.35)" strokeWidth="1" />
          <NodeNum pos={POS.male2} value={male2} size="21" fill={CREAM} />
          <circle cx={POS.female1.x} cy={POS.female1.y} r="26" fill={FEMALE} stroke="rgba(255,255,255,.35)" strokeWidth="1" />
          <NodeNum pos={POS.female1} value={female1} size="21" fill={CREAM} />
          <circle cx={POS.female2.x} cy={POS.female2.y} r="26" fill={FEMALE} stroke="rgba(255,255,255,.35)" strokeWidth="1" />
          <NodeNum pos={POS.female2} value={female2} size="21" fill={CREAM} />
        </g>

        {/* ===== Главные портреты ===== */}
        <g>
          {[[POS.left, d], [POS.top, m], [POS.right, y], [POS.bottom, k]].map(([p, v], i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="40" fill={GRAPHITE} />
              <NodeNum pos={p} value={v} size="34" fill={CREAM} />
            </g>
          ))}
        </g>

        {/* Подписи портретов */}
        <g fill={INK} fontSize="14.5" fontWeight="600">
          <text x="150" y="342" textAnchor="middle">День рождения</text>
          <text x="400" y="102" textAnchor="middle">Месяц</text>
          <text x="650" y="342" textAnchor="middle">Год</text>
          <text x="400" y="712" textAnchor="middle">Кармическая задача</text>
        </g>

        {/* ===== Центр — медальон ===== */}
        <circle cx="400" cy="400" r="59" fill="none" stroke={GOLD} strokeWidth="2" />
        <circle cx="400" cy="400" r="52" fill={GRAPHITE} />
        <text x="400" y="400" textAnchor="middle" dominantBaseline="central"
          fontFamily="var(--font-heading)" fontSize="42" fill={GOLD_TEXT}>{center}</text>
        <text x="400" y="432" textAnchor="middle" fontSize="9.5" letterSpacing="1.4"
          fill="rgba(233,200,119,.75)" style={{ textTransform: 'uppercase' }}>личность</text>

        {/* ===== Зоны-символы ===== */}
        <g>
          <text x="120" y="132" textAnchor="middle" fontSize="20" fill={GOLD}>✦</text>
          <text x="120" y="150" textAnchor="middle" fontSize="10.5" fill={MUTED}>духовность</text>
          <text x="688" y="132" textAnchor="middle" fontSize="18" fill="#BC6B6B">♥</text>
          <text x="688" y="150" textAnchor="middle" fontSize="10.5" fill={MUTED}>линия любви</text>
          <text x="688" y="662" textAnchor="middle" fontSize="19" fontWeight="700" fill={GOLD}>$</text>
          <text x="688" y="680" textAnchor="middle" fontSize="10.5" fill={MUTED}>денежный канал</text>
        </g>

        {/* ===== Подсветка узлов (проп highlight, лендинги) ===== */}
        <g fill="none" stroke={GOLD_TEXT} strokeWidth="3" opacity="0.95">
          {highlight.map((key) => {
            const p = POS[key === 'center' ? 'centre' : key]
            if (!p) return null
            const r = key === 'center' ? 64 : 32
            return <circle key={key} cx={p.x} cy={p.y} r={r} />
          })}
        </g>
      </svg>

      {/* ===== Легенда ===== */}
      <div className={styles.diagramLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendBar} style={{ background: MALE }} />
          <span><b>Мужская линия</b> — Лево → центр → Верх</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendBar} style={{ background: FEMALE }} />
          <span><b>Женская линия</b> — Низ → центр → Право</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: GRAPHITE }} />
          <span><b>Портреты</b> — день, месяц, год, задача</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: PARCH, border: '1.4px solid rgba(30,29,52,.28)' }} />
          <span><b>Диагонали</b> — суммы соседних</span>
        </div>
        <div className={`${styles.legendItem} ${styles.legendWide}`}>
          <span className={styles.legendDot} style={{ background: GRAPHITE, border: `2px solid ${GOLD}` }} />
          <span><b>Центр</b> — Число личности, зона комфорта · шкала по периметру 0–80 лет</span>
        </div>
      </div>
    </div>
  )
}
