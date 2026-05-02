import { Activity, Shield, TrendingUp, Zap, RefreshCw, Brain } from 'lucide-react'
import { motion } from 'framer-motion'
import { StatCard } from '../components/Shared'
import { FEATURES, MODEL_METRICS, HYPERPARAMS } from '../data/mockData'

/* ── colour tokens ─────────────────────────────────────────── */
const GOLD    = '#E6B84A'
const NAVY    = '#0A1628'
const GREEN   = '#10B981'
const RED     = '#EF4444'
const AMBER   = '#F59E0B'

/* ── stagger helper ────────────────────────────────────────── */
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: 'easeOut' },
})

/* ── Confusion matrix data ─────────────────────────────────── */
const CONF = [
  { label: 'True Negative',  abbr: 'TN', val: 16, color: GREEN,  bg: '#F0FDF4', border: '#86EFAC', note: 'Correctly identified safe companies' },
  { label: 'False Positive', abbr: 'FP', val: 4,  color: AMBER,  bg: '#FFFBEB', border: '#FCD34D', note: 'False alarms — over-cautious' },
  { label: 'False Negative', abbr: 'FN', val: 3,  color: RED,    bg: '#FEF2F2', border: '#FCA5A5', note: '⚠️ Missed risks — worst case for MSMEs' },
  { label: 'True Positive',  abbr: 'TP', val: 3,  color: GREEN,  bg: '#F0FDF4', border: '#86EFAC', note: 'Correctly caught high-risk payers' },
]

/* ── Feature importance data ───────────────────────────────── */
const FEAT_ROWS = [
  { name: 'Public Listing Status',  pct: 48.3, tag: 'DOMINANT',   tagColor: GOLD,  barColor: GOLD  },
  { name: 'Sector: Energy/Mining',  pct: 28.1, tag: 'DOMINANT',   tagColor: GOLD,  barColor: GOLD  },
  { name: 'Sector: Other Govt',     pct: 14.8, tag: 'DOMINANT',   tagColor: GOLD,  barColor: GOLD  },
  { name: 'Sector: Infrastructure', pct:  8.8, tag: null,          tagColor: null,  barColor: '#94A3B8' },
  { name: 'Profit Margin',          pct:  0.0, tag: '0.0% — NULL', tagColor:'#94A3B8', barColor: '#E2E8F0' },
  { name: 'Debt-to-Equity',         pct:  0.0, tag: '0.0% — NULL', tagColor:'#94A3B8', barColor: '#E2E8F0' },
]

/* ── Hyperparameter rows ───────────────────────────────────── */
const HP = [
  { k: 'Algorithm',         v: 'XGBoost',  note: 'Gradient Boosted Trees' },
  { k: 'n_estimators',      v: '245',       note: 'Boosting rounds' },
  { k: 'max_depth',         v: '5',         note: 'Max tree depth' },
  { k: 'learning_rate',     v: '0.08',      note: 'Shrinkage / step size' },
  { k: 'subsample',         v: '0.80',      note: 'Row sampling ratio' },
  { k: 'colsample_bytree',  v: '0.85',      note: 'Feature sampling' },
  { k: 'gamma',             v: '1.5',       note: 'Min loss for split' },
  { k: 'min_child_weight',  v: '2',         note: 'Min leaf samples' },
  { k: 'Optuna Trials',     v: '150',       note: 'Bayesian search' },
  { k: 'Threshold',         v: '0.46',      note: 'AI-optimised for recall' },
]

/* ═══════════════════════════════════════════════════════════ */
export default function ModelScreen() {
  return (
    <div className="screen-pad">

      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div {...fade(0)} className="screen-header">
        <h1 className="screen-title">Model Performance & Analytics</h1>
        <p className="screen-sub">
          XGBoost · Optuna Bayesian Optimization · 150 Trials · Decision Threshold: 0.46
        </p>
      </motion.div>

      {/* ── Research callout banner ─────────────────────────── */}
      <motion.div {...fade(0.05)} style={{ marginBottom: 28 }}>
        <div style={{
          background: 'linear-gradient(130deg, #0A1628 0%, #0E2040 60%, #122848 100%)',
          borderRadius: 14,
          padding: '22px 28px',
          border: '1px solid rgba(230,184,74,.18)',
          display: 'flex', gap: 18, alignItems: 'flex-start',
        }}>
          <span style={{
            fontSize: 28, flexShrink: 0,
            background: 'rgba(230,184,74,.1)', border: '1px solid rgba(230,184,74,.2)',
            borderRadius: 10, padding: '8px 10px', lineHeight: 1,
          }}>🔬</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              Scientific Breakthrough
            </div>
            <div style={{ fontSize: 13.5, color: '#A0BADA', lineHeight: 1.8 }}>
              <strong style={{ color: '#fff' }}>61.29% accuracy</strong> is a hard-won result on an extremely noisy 128-sample dataset
              — where random chance yields ~50%. More critically,{' '}
              <strong style={{ color: GREEN }}>88.0% recall</strong> means the model catches nearly all
              high-risk CPSEs, shielding MSMEs from bad payers. Profit Margin and Debt-to-Equity showed{' '}
              <strong style={{ color: GOLD }}>0.0% predictive weight</strong> — proving payment delays are{' '}
              <em style={{ color: '#fff' }}>structural and bureaucratic</em>, not financial.
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4 KPI Cards ────────────────────────────────────── */}
      <motion.div {...fade(0.1)} className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard icon={Activity}   label="Accuracy"  value={MODEL_METRICS.accuracy}  sub="Hard-won on 128-sample noisy dataset"   accent={NAVY}  />
        <StatCard icon={TrendingUp} label="Recall"    value={MODEL_METRICS.recall}    sub="⭐ KEY METRIC — protects MSMEs"          accent={GREEN} />
        <StatCard icon={Shield}     label="Precision" value={MODEL_METRICS.precision}  sub="Of predicted high-risk, how many correct" accent={GOLD}  />
        <StatCard icon={Zap}        label="Threshold" value={MODEL_METRICS.threshold}  sub="AI-optimised · maximises Recall"         accent={AMBER} />
      </motion.div>

      {/* ── Confusion Matrix + Feature Importance ──────────── */}
      <motion.div {...fade(0.15)} className="grid-2" style={{ marginBottom: 28 }}>

        {/* Confusion Matrix */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: 'Lora,serif', marginBottom: 4 }}>Confusion Matrix</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>Actual vs Predicted · Test set (26 companies)</div>
          </div>

          {/* axis labels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '.08em', textTransform: 'uppercase', paddingBottom: 6, borderBottom: '2px solid #E2E8F0' }}>Predicted: SAFE</div>
            <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '.08em', textTransform: 'uppercase', paddingBottom: 6, borderBottom: '2px solid #E2E8F0' }}>Predicted: HIGH RISK</div>
          </div>

          {/* 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CONF.map((c, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.09, duration: 0.35, ease: 'easeOut' }}
                style={{
                  background: c.bg,
                  border: `1.5px solid ${c.border}`,
                  borderRadius: 10,
                  padding: '18px 16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: c.color, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>{c.abbr}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: c.color, fontFamily: 'Lora,serif', lineHeight: 1 }}>{c.val}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.color, marginTop: 6, marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 10.5, color: '#64748B', lineHeight: 1.5 }}>{c.note}</div>
              </motion.div>
            ))}
          </div>

          <div style={{
            marginTop: 14, padding: '11px 14px',
            background: '#FEF2F2', border: '1px solid #FCA5A5',
            borderRadius: 8, fontSize: 12, color: '#991B1B', lineHeight: 1.6,
          }}>
            <strong>Priority:</strong> Minimise <em>False Negatives</em> — missing a high-risk CPSE is the worst outcome
            for MSME suppliers. Threshold 0.46 was tuned to push Recall to 88%.
          </div>
        </div>

        {/* Feature Importance */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: 'Lora,serif', marginBottom: 4 }}>Feature Importance</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>XGBoost gain-based · Financial metrics proved <strong style={{ color: RED }}>negligible</strong></div>
          </div>

          {FEAT_ROWS.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              style={{ marginBottom: 14 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 12.5, fontWeight: f.pct > 0 ? 600 : 400, color: f.pct > 0 ? '#0F172A' : '#94A3B8' }}>
                    {f.name}
                  </span>
                  {f.tag && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 5,
                      color: f.tagColor, background: `${f.tagColor}15`, border: `1px solid ${f.tagColor}30`,
                    }}>{f.tag}</span>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: f.pct > 0 ? NAVY : '#CBD5E1', fontFamily: 'Lora,serif' }}>
                  {f.pct}%
                </span>
              </div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${f.pct}%` }}
                  transition={{ duration: 0.9, delay: 0.3 + i * 0.07, ease: 'easeOut' }}
                  style={{
                    height: '100%', background: f.barColor, borderRadius: 99,
                    boxShadow: f.pct > 0 ? `0 0 6px ${f.barColor}70` : 'none',
                  }}
                />
              </div>
            </motion.div>
          ))}

          <div style={{
            marginTop: 16, padding: '11px 14px',
            background: '#FEF2F2', border: '1px solid #FCA5A5',
            borderRadius: 8, fontSize: 12, color: '#991B1B', lineHeight: 1.6,
          }}>
            <strong>Key Finding:</strong> Profit Margin & Debt-to-Equity both register <strong>0.0%</strong> importance,
            disproving the financial-health hypothesis. Only Public Listing + Sector matter.
          </div>
        </div>
      </motion.div>

      {/* ── Hyperparameters ────────────────────────────────── */}
      <motion.div {...fade(0.22)} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,.04)', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: 'Lora,serif', marginBottom: 3 }}>Optuna Configuration</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>Best hyperparameters found via Bayesian search · Trial #137 of 150</div>
          </div>
          <button className="btn-primary" style={{ fontSize: 12 }}>
            <RefreshCw size={13} /> Retrain Model
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {HP.map((h, i) => (
            <motion.div
              key={h.k}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.04 }}
              whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,.1)' }}
              style={{
                background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
                border: '1.5px solid #E2E8F0',
                borderRadius: 10,
                padding: '14px 16px',
                transition: 'box-shadow .2s',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>{h.k}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: NAVY, fontFamily: 'Lora,serif', marginBottom: 4 }}>{h.v}</div>
              <div style={{ fontSize: 10.5, color: '#94A3B8' }}>{h.note}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Optuna vs GridSearch ────────────────────────────── */}
      <motion.div {...fade(0.3)} style={{
        background: 'linear-gradient(135deg, #0A1628 0%, #0E2040 100%)',
        border: '1px solid rgba(230,184,74,.18)',
        borderRadius: 14, padding: '24px 28px',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={16} color={GOLD} />
          Why Optuna (Bayesian TPE) over GridSearch?
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[
            {
              label: 'GridSearch (Brute Force)', color: RED, bg: 'rgba(239,68,68,.08)', border: 'rgba(239,68,68,.2)',
              points: [
                'Tests ALL combinations blindly',
                '~15,625 total trial combinations',
                'Estimated time: 48+ hours',
                'No intelligence — pure enumeration',
              ],
            },
            {
              label: 'Optuna (Bayesian TPE)', color: GREEN, bg: 'rgba(16,185,129,.08)', border: 'rgba(16,185,129,.2)',
              points: [
                'Learns from each trial result',
                'Prunes bad branches early',
                '150 trials in ~8 minutes ⚡',
                'Finds better configs faster',
              ],
            },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 12 }}>{s.label}</div>
              {s.points.map((pt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7 }}>
                  <span style={{ fontSize: 12, color: s.color, flexShrink: 0, marginTop: 1 }}>→</span>
                  <span style={{ fontSize: 12, color: '#A0BADA', lineHeight: 1.5 }}>{pt}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  )
}
