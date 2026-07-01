'use client'

const SIZE = 500
const CX = SIZE / 2
const CY = SIZE / 2
const OUTER_R = 200   // outer octagon radius
const INNER_R = 110   // inner square radius
const NODE_R = 22     // circle radius for main nodes
const SMALL_R = 16    // circle radius for diagonal nodes
const INNER_NODE_R = 18 // for inner line nodes

// Octagon positions (clockwise from top = 12 o'clock)
function octPoint(index, r) {
  const angle = (index * 45 - 90) * (Math.PI / 180)
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}

// index 0=top, 1=NE, 2=right, 3=SE, 4=bottom, 5=SW, 6=left, 7=NW
const POS = {
  top:       octPoint(0, OUTER_R),
  top_right: octPoint(1, OUTER_R),
  right:     octPoint(2, OUTER_R),
  bot_right: octPoint(3, OUTER_R),
  bottom:    octPoint(4, OUTER_R),
  bot_left:  octPoint(5, OUTER_R),
  left:      octPoint(6, OUTER_R),
  top_left:  octPoint(7, OUTER_R),
  center:    { x: CX, y: CY },
  male1:     { x: CX + (octPoint(6, OUTER_R).x - CX) * 0.5, y: CY + (octPoint(6, OUTER_R).y - CY) * 0.5 },
  male2:     { x: CX + (octPoint(0, OUTER_R).x - CX) * 0.5, y: CY + (octPoint(0, OUTER_R).y - CY) * 0.5 },
  female1:   { x: CX + (octPoint(2, OUTER_R).x - CX) * 0.5, y: CY + (octPoint(2, OUTER_R).y - CY) * 0.5 },
  female2:   { x: CX + (octPoint(4, OUTER_R).x - CX) * 0.5, y: CY + (octPoint(4, OUTER_R).y - CY) * 0.5 },
}

function Node({ pos, value, fill = '#fff', textFill = '#333', r = NODE_R, stroke = '#333' }) {
  return (
    <g>
      <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={stroke} strokeWidth="2" />
      <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
        fontSize={r > 20 ? 14 : 12} fontWeight="700" fill={textFill}>
        {value}
      </text>
    </g>
  )
}

function AgeLabel({ pos, age, offset }) {
  return (
    <text x={pos.x + offset.x} y={pos.y + offset.y}
      textAnchor="middle" fontSize="10" fill="#999">
      {age} лет
    </text>
  )
}

export default function MatrixSVG({ nodes }) {
  const { d, m, y, k, center, top_left, top_right, bot_right, bot_left, male1, male2, female1, female2 } = nodes

  const outerPoints = [
    POS.top, POS.top_right, POS.right, POS.bot_right,
    POS.bottom, POS.bot_left, POS.left, POS.top_left,
  ].map(p => `${p.x},${p.y}`).join(' ')

  const innerSquarePoints = [
    POS.top_left, POS.top_right, POS.bot_right, POS.bot_left,
  ].map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" style={{ maxWidth: 500 }}>
      {/* Outer octagon */}
      <polygon points={outerPoints} fill="none" stroke="#333" strokeWidth="1.5" />

      {/* Inner diamond (connecting diagonals) */}
      <polygon points={innerSquarePoints} fill="none" stroke="#333" strokeWidth="1" strokeDasharray="4 2" />

      {/* Cross lines: top-bottom, left-right */}
      <line x1={POS.top.x} y1={POS.top.y} x2={POS.bottom.x} y2={POS.bottom.y} stroke="#333" strokeWidth="1.5" />
      <line x1={POS.left.x} y1={POS.left.y} x2={POS.right.x} y2={POS.right.y} stroke="#333" strokeWidth="1.5" />

      {/* Male line (blue): left → male1 → center → male2 → top */}
      <polyline
        points={`${POS.left.x},${POS.left.y} ${POS.male1.x},${POS.male1.y} ${POS.center.x},${POS.center.y} ${POS.male2.x},${POS.male2.y} ${POS.top.x},${POS.top.y}`}
        fill="none" stroke="#3498db" strokeWidth="2"
      />

      {/* Female line (red): bottom → female2 → center → female1 → right */}
      <polyline
        points={`${POS.bottom.x},${POS.bottom.y} ${POS.female2.x},${POS.female2.y} ${POS.center.x},${POS.center.y} ${POS.female1.x},${POS.female1.y} ${POS.right.x},${POS.right.y}`}
        fill="none" stroke="#e74c3c" strokeWidth="2"
      />

      {/* Male/Female line labels — placed alongside their segments, clear of nodes */}
      <text x={CX - 12} y={CY - 102} fontSize="10" fill="#3498db" textAnchor="middle"
        transform={`rotate(-90 ${CX - 12} ${CY - 102})`}>
        Мужская линия
      </text>
      <text x={CX + 102} y={CY - 12} fontSize="10" fill="#e74c3c" textAnchor="middle">
        Женская линия
      </text>

      {/* Age markers on outer ring (approximate positions) */}
      <AgeLabel pos={POS.left}    age={0}  offset={{ x: -30, y: 0 }} />
      <AgeLabel pos={POS.top}     age={20} offset={{ x: 0, y: -30 }} />
      <AgeLabel pos={POS.right}   age={40} offset={{ x: 30, y: 0 }} />
      <AgeLabel pos={POS.bottom}  age={60} offset={{ x: 0, y: 30 }} />

      {/* Symbols */}
      <text x={CX - 15} y={CY - 10} fontSize="18" textAnchor="middle">★</text>
      <text x={CX + 15} y={CY + 15} fontSize="16" textAnchor="middle">♥</text>
      <text x={CX + 40} y={CY + 5}  fontSize="16" textAnchor="middle">$</text>

      {/* Main 4 corner nodes */}
      <Node pos={POS.left}    value={d} fill="#9b59b6" textFill="#fff" />
      <Node pos={POS.top}     value={m} fill="#9b59b6" textFill="#fff" />
      <Node pos={POS.right}   value={y} fill="#e74c3c" textFill="#fff" />
      <Node pos={POS.bottom}  value={k} fill="#e74c3c" textFill="#fff" />

      {/* Diagonal outer nodes */}
      <Node pos={POS.top_left}  value={top_left}  fill="#fff" r={SMALL_R} />
      <Node pos={POS.top_right} value={top_right} fill="#fff" r={SMALL_R} />
      <Node pos={POS.bot_right} value={bot_right} fill="#fff" r={SMALL_R} />
      <Node pos={POS.bot_left}  value={bot_left}  fill="#fff" r={SMALL_R} />

      {/* Center node */}
      <Node pos={POS.center} value={center} fill="#f1c40f" textFill="#333" r={26} />

      {/* Inner line nodes */}
      <Node pos={POS.male1}   value={male1}   fill="#3498db" textFill="#fff" r={INNER_NODE_R} />
      <Node pos={POS.male2}   value={male2}   fill="#3498db" textFill="#fff" r={INNER_NODE_R} />
      <Node pos={POS.female1} value={female1} fill="#e67e22" textFill="#fff" r={INNER_NODE_R} />
      <Node pos={POS.female2} value={female2} fill="#e67e22" textFill="#fff" r={INNER_NODE_R} />
    </svg>
  )
}
