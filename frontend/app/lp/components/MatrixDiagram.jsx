import styles from '../lp.module.css'

// Простая «матрица отношений» из макета Lovematrix.dc (viewBox 320).
// Портреты (день/месяц/год/задача), диагонали, мужская и женская линии, центр.
// Числа реальные — из calculateMatrix(). Отдельная от общесайтового MatrixSVG,
// чтобы лендинг ничего не заимствовал у страницы /matrix.

const LOOK = {
  portrait: { fill: '#160c0f', stroke: 'rgba(224,165,120,.9)', sw: 1.5, color: '#f6e9df', serif: true },
  diag:     { fill: 'rgba(246,233,223,.04)', stroke: 'rgba(246,233,223,.3)', sw: 1, color: '#cdb2a5', serif: false },
  male:     { fill: '#22474d', stroke: '#3f6d74', sw: 1, color: '#eaf4f4', serif: false },
  female:   { fill: '#7a3f28', stroke: '#a35f3f', sw: 1, color: '#fbe9dd', serif: false },
  center:   { fill: '#160c0f', stroke: '#e7cf94', sw: 2, color: '#f0d3ae', serif: true },
}

function Node({ x, y, r, kind, num }) {
  const l = LOOK[kind]
  const fs = (l.serif ? r * 0.92 : r * 0.8)
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={l.fill} stroke={l.stroke} strokeWidth={l.sw} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
        fontFamily={l.serif ? 'var(--font-serif)' : 'var(--font-body)'}
        fontWeight="600" fontSize={fs} fill={l.color}>{num}</text>
    </g>
  )
}

export default function MatrixDiagram({ nodes, highlight = [] }) {
  const { d, m, y, k, center, top_left, top_right, bot_right, bot_left,
    male1, male2, female1, female2 } = nodes

  const POS = { center: [160, 160], female1: [214, 160] }

  return (
    <div className={styles.diagram}>
      <svg viewBox="0 0 320 320" aria-hidden="true">
        {/* Каркас */}
        <polygon points="160,46 246,74 274,160 246,246 160,274 74,246 46,160 74,74"
          fill="none" stroke="rgba(224,165,120,.28)" strokeWidth="1" />
        <line x1="74" y1="74" x2="246" y2="246" stroke="rgba(246,233,223,.14)" strokeWidth="1" strokeDasharray="3 5" />
        <line x1="246" y1="74" x2="74" y2="246" stroke="rgba(246,233,223,.14)" strokeWidth="1" strokeDasharray="3 5" />

        {/* Мужская линия: день → центр → месяц. Женская: задача → центр → год */}
        <polyline points="46,160 160,160 160,46" fill="none" stroke="#3f6d74" strokeWidth="3" strokeLinecap="round" opacity=".85" />
        <polyline points="160,274 160,160 274,160" fill="none" stroke="#c07a4e" strokeWidth="3" strokeLinecap="round" opacity=".85" />

        {/* Подписи осей */}
        <g fontFamily="var(--font-body)" fontSize="10" letterSpacing="1.2" fill="#9b8478"
          style={{ textTransform: 'uppercase' }}>
          <text x="160" y="15" textAnchor="middle">Месяц</text>
          <text x="160" y="309" textAnchor="middle">Задача</text>
          <text x="14" y="163" textAnchor="middle">День</text>
          <text x="306" y="163" textAnchor="middle">Год</text>
        </g>
        {/* Подписи линий */}
        <text x="112" y="108" transform="rotate(-45 112 108)" textAnchor="middle"
          fontFamily="var(--font-body)" fontSize="9" letterSpacing="1.2" fill="#8fa0c4"
          style={{ textTransform: 'uppercase' }}>Мужская линия</text>
        <text x="206" y="206" transform="rotate(-45 206 206)" textAnchor="middle"
          fontFamily="var(--font-body)" fontSize="9" letterSpacing="1.2" fill="#d29a6f"
          style={{ textTransform: 'uppercase' }}>Женская линия</text>

        {/* Диагонали (суммы соседних) */}
        <Node x={74} y={74} r={21} kind="diag" num={top_left} />
        <Node x={246} y={74} r={21} kind="diag" num={top_right} />
        <Node x={74} y={246} r={21} kind="diag" num={bot_left} />
        <Node x={246} y={246} r={21} kind="diag" num={bot_right} />

        {/* Внутренние на линиях */}
        <Node x={160} y={103} r={19} kind="male" num={male2} />
        <Node x={103} y={160} r={19} kind="male" num={male1} />
        <Node x={160} y={217} r={19} kind="female" num={female2} />
        <Node x={214} y={160} r={19} kind="female" num={female1} />

        {/* Портреты */}
        <Node x={160} y={46} r={27} kind="portrait" num={m} />
        <Node x={160} y={274} r={27} kind="portrait" num={k} />
        <Node x={46} y={160} r={27} kind="portrait" num={d} />
        <Node x={274} y={160} r={27} kind="portrait" num={y} />

        {/* Центр — медальон + мягкое свечение */}
        <circle cx="160" cy="160" r="39" fill="none" stroke="rgba(231,207,148,.12)" strokeWidth="6" />
        <Node x={160} y={160} r={33} kind="center" num={center} />
        <text x="160" y="182" textAnchor="middle" fontFamily="var(--font-body)" fontSize="7"
          letterSpacing="1" fill="#c79a86" style={{ textTransform: 'uppercase' }}>личность</text>

        {/* Подсветка узлов (проп highlight) */}
        <g fill="none" stroke="#f0d3ae" strokeWidth="2" opacity=".9">
          {highlight.map((key) => {
            const p = POS[key]
            if (!p) return null
            return <circle key={key} cx={p[0]} cy={p[1]} r={key === 'center' ? 40 : 25} />
          })}
        </g>
      </svg>
    </div>
  )
}
