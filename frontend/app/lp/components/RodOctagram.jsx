// Октаграмма «матрицы судьбы» для лендинга rod (дизайн «Родовой сценарий»).
// Две наложенные квадратные звезды -> 8-конечная звезда, золотая обводка на тёмной
// карточке. Числа реальные — из calculateMatrix(). Отдельный компонент, чтобы
// общий MatrixDiagram (Result/Verdict других лендингов) остался нетронутым.
// viewBox -34 -14 408 368, центр 170,170. Роль Prata из макета — сериф-дисплей.

export default function RodOctagram({ nodes }) {
  const {
    d, m, y, k, center,
    top_left, top_right, bot_right, bot_left,
    male1, male2, female1, female2,
  } = nodes

  const serif = "var(--font-cosmic-serif), 'Playfair Display', Georgia, serif"
  const sans = "var(--font-sans), 'Golos Text', sans-serif"

  return (
    <svg viewBox="-34 -14 408 368" width="100%"
      style={{ display: 'block', maxWidth: 336, margin: '0 auto', overflow: 'visible' }}
      aria-hidden="true">
      <defs>
        <radialGradient id="rsCore" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#2a1c22" />
          <stop offset="100%" stopColor="#160f12" />
        </radialGradient>
      </defs>

      {/* Две квадратные звезды -> октаграмма */}
      <polygon points="170,50 290,170 170,290 50,170" fill="rgba(201,138,74,0.05)" stroke="#c98a4a" strokeWidth="1.1" strokeOpacity="0.7" />
      <polygon points="255,85 255,255 85,255 85,85" fill="rgba(201,138,74,0.05)" stroke="#c98a4a" strokeWidth="1.1" strokeOpacity="0.7" />

      {/* Оси и диагонали (пунктир) */}
      <line x1="50" y1="170" x2="290" y2="170" stroke="#c98a4a" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 4" />
      <line x1="170" y1="50" x2="170" y2="290" stroke="#c98a4a" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 4" />
      <line x1="85" y1="85" x2="255" y2="255" stroke="#c98a4a" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 4" />
      <line x1="255" y1="85" x2="85" y2="255" stroke="#c98a4a" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 4" />

      {/* Внешние подписи осей */}
      <text x="170" y="10" textAnchor="middle" fill="#b39c8b" fontSize="10" letterSpacing="2" fontFamily={sans}>МЕСЯЦ</text>
      <text x="170" y="334" textAnchor="middle" fill="#b39c8b" fontSize="10" letterSpacing="2" fontFamily={sans}>ЗАДАЧА</text>
      <text x="-2" y="174" textAnchor="middle" fill="#c9b19d" fontSize="10" letterSpacing="1" fontFamily={sans}>ДЕНЬ</text>
      <text x="342" y="174" textAnchor="middle" fill="#c9b19d" fontSize="10" letterSpacing="1" fontFamily={sans}>ГОД</text>
      <text x="44" y="34" textAnchor="middle" fill="#d8c4ad" fontSize="9" fontFamily={sans} transform="rotate(-45 44 34)">мужская линия</text>
      <text x="296" y="306" textAnchor="middle" fill="#d8c4ad" fontSize="9" fontFamily={sans} transform="rotate(-45 296 306)">женская линия</text>

      <g fontFamily={sans} fontWeight="700">
        {/* Угловые узлы (диагонали) */}
        <circle cx="85" cy="85" r="19" fill="#241a20" stroke="#c98a4a" strokeOpacity="0.5" strokeWidth="1.4" />
        <text x="85" y="85" textAnchor="middle" dominantBaseline="central" fill="#cbb8a0" fontSize="15">{top_left}</text>
        <circle cx="255" cy="85" r="19" fill="#241a20" stroke="#c98a4a" strokeOpacity="0.5" strokeWidth="1.4" />
        <text x="255" y="85" textAnchor="middle" dominantBaseline="central" fill="#cbb8a0" fontSize="15">{top_right}</text>
        <circle cx="85" cy="255" r="19" fill="#241a20" stroke="#c98a4a" strokeOpacity="0.5" strokeWidth="1.4" />
        <text x="85" y="255" textAnchor="middle" dominantBaseline="central" fill="#cbb8a0" fontSize="15">{bot_left}</text>
        <circle cx="255" cy="255" r="19" fill="#241a20" stroke="#c98a4a" strokeOpacity="0.5" strokeWidth="1.4" />
        <text x="255" y="255" textAnchor="middle" dominantBaseline="central" fill="#cbb8a0" fontSize="15">{bot_right}</text>

        {/* Кардинальные вершины (день/месяц/год/задача) */}
        <circle cx="170" cy="50" r="27" fill="#241a20" stroke="#c98a4a" strokeWidth="2" />
        <text x="170" y="50" textAnchor="middle" dominantBaseline="central" fill="#f3ece2" fontSize="21">{m}</text>
        <circle cx="170" cy="290" r="27" fill="#241a20" stroke="#c98a4a" strokeWidth="2" />
        <text x="170" y="290" textAnchor="middle" dominantBaseline="central" fill="#f3ece2" fontSize="21">{k}</text>
        <circle cx="50" cy="170" r="27" fill="#241a20" stroke="#c98a4a" strokeWidth="2" />
        <text x="50" y="170" textAnchor="middle" dominantBaseline="central" fill="#f3ece2" fontSize="21">{d}</text>
        <circle cx="290" cy="170" r="27" fill="#241a20" stroke="#c98a4a" strokeWidth="2" />
        <text x="290" y="170" textAnchor="middle" dominantBaseline="central" fill="#f3ece2" fontSize="21">{y}</text>

        {/* Внутренние узлы: мужская линия (бирюза), женская (терракота) */}
        <circle cx="170" cy="110" r="18" fill="#3f7d74" />
        <text x="170" y="110" textAnchor="middle" dominantBaseline="central" fill="#f3ece2" fontSize="15">{male2}</text>
        <circle cx="110" cy="170" r="18" fill="#3f7d74" />
        <text x="110" y="170" textAnchor="middle" dominantBaseline="central" fill="#f3ece2" fontSize="15">{male1}</text>
        <circle cx="230" cy="170" r="18" fill="#a8582f" />
        <text x="230" y="170" textAnchor="middle" dominantBaseline="central" fill="#f7ece2" fontSize="15">{female1}</text>
        <circle cx="170" cy="230" r="18" fill="#a8582f" />
        <text x="170" y="230" textAnchor="middle" dominantBaseline="central" fill="#f7ece2" fontSize="15">{female2}</text>

        {/* Ядро */}
        <circle cx="170" cy="170" r="34" fill="url(#rsCore)" stroke="#c98a4a" strokeWidth="3" />
        <text x="170" y="166" textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="26" fontWeight="800" fontFamily={serif}>{center}</text>
        <text x="170" y="188" textAnchor="middle" dominantBaseline="central" fill="#b79a8f" fontSize="7" letterSpacing="1.5">ЛИЧНОСТЬ</text>
      </g>
    </svg>
  )
}
