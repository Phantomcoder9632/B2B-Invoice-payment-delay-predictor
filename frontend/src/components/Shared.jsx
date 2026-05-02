import { scoreColor, scoreLabel, scoreBg } from '../helpers'

export function RiskBadge({ score, small = false }) {
  return (
    <span
      className="risk-badge"
      style={{
        background: scoreBg(score),
        color: scoreColor(score),
        borderColor: `${scoreColor(score)}35`,
        fontSize: small ? 10 : 12,
        padding: small ? '2px 8px' : '4px 12px',
      }}
    >
      {scoreLabel(score)}
    </span>
  )
}

export function SectorPill({ sector }) {
  const map = {
    Energy_Mining: 'Energy',
    Infrastructure: 'Infra',
    Defense_Aerospace: 'Defense',
    Financial_Services: 'Finance',
    Other_Govt_Services: 'Govt',
  }
  return <span className="sector-pill">{map[sector] || sector}</span>
}

export function StatCard({ icon: Icon, label, value, sub, accent, delay = 0 }) {
  return (
    <div className="stat-card fade-up" style={{ '--accent': accent, animationDelay: `${delay}ms` }}>
      <div className="stat-card-icon-wrap" style={{ background: `${accent}15` }}>
        <Icon size={16} color={accent} />
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  )
}

/**
 * RiskGauge — Semicircle gauge (0° at left → 180° at right)
 *
 * FIX: largeArc must ALWAYS be 0 for a semicircle gauge.
 *      The track spans exactly 180°. The fill arc from the start point
 *      to any intermediate point is always ≤ 180°, so the "small arc"
 *      (largeArc=0) is always the correct one.
 *      Setting largeArc=1 when score>50 caused the arc to wrap the
 *      wrong way around the circle — visually broken.
 */
export function RiskGauge({ score }) {
  // Semicircle: left endpoint (10, 90), right endpoint (170, 90), centre (90, 90), r=80
  const r = 80
  const cx = 90
  const cy = 90

  // Angle sweeps from 0 (left) to π (right) as score goes from 0 to 100
  const angle = (Math.PI * Math.min(Math.max(score, 0), 100)) / 100

  const ex = (cx - r * Math.cos(angle)).toFixed(2)
  const ey = (cy - r * Math.sin(angle)).toFixed(2)

  // ALWAYS 0 for a semicircle — the filled portion is always < 180°
  const largeArc = 0

  const col = scoreColor(score)

  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 180 120" style={{ width: 240, overflow: 'visible' }}>
        {/* Background track */}
        <path
          d={`M 10,90 A ${r},${r} 0 0,1 170,90`}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Coloured fill */}
        {score > 0 && (
          <path
            d={`M 10,90 A ${r},${r} 0 ${largeArc},1 ${ex},${ey}`}
            fill="none"
            stroke={col}
            strokeWidth="14"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 5px ${col}60)` }}
          />
        )}

        {/* Needle dot at tip */}
        {score > 0 && (
          <circle
            cx={ex}
            cy={ey}
            r="6"
            fill={col}
            stroke="#fff"
            strokeWidth="2.5"
            style={{ filter: `drop-shadow(0 2px 4px ${col}80)` }}
          />
        )}

        {/* Score number */}
        <text
          x="90"
          y="78"
          textAnchor="middle"
          fontSize="40"
          fontWeight="700"
          fontFamily="Lora, serif"
          fill={col}
        >
          {score}
        </text>

        {/* "/ 100" */}
        <text x="90" y="94" textAnchor="middle" fontSize="11" fill="#94A3B8">
          / 100
        </text>
      </svg>

      <div className="gauge-label" style={{ color: col }}>{scoreLabel(score)}</div>
      <div className="gauge-sub">AI Risk Score · Threshold: 0.46</div>
    </div>
  )
}

export function LoadingSpinner({ message = 'Loading…', sub = '' }) {
  return (
    <div className="empty-state">
      <div className="spinner" />
      <div className="empty-state-title" style={{ marginTop: 20 }}>{message}</div>
      {sub && <div className="empty-state-sub">{sub}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="empty-state">
      <Icon size={48} color="#E2E8F0" />
      <div className="empty-state-title">{title}</div>
      {sub && <div className="empty-state-sub">{sub}</div>}
    </div>
  )
}

export function ProgressBar({ value }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  )
}
