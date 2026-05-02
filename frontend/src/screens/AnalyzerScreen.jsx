import { useState } from 'react'
import { Zap, RefreshCw, Brain, ChevronRight, AlertCircle, Wifi } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RiskGauge, LoadingSpinner } from '../components/Shared'
import { predictSingle } from '../api'

const QUICK_FILL = [
  { label: 'BSNL (Critical)',  data: { company_name: 'BSNL',  disposed_cases: '280', pending_cases: '200', debt_to_equity: '1.85', profit_margin: '-8.2',  is_public: false } },
  { label: 'NTPC (High)',      data: { company_name: 'NTPC',  disposed_cases: '145', pending_cases: '110', debt_to_equity: '0.95', profit_margin: '12.5',  is_public: true  } },
  { label: 'HAL (Low)',        data: { company_name: 'HAL',   disposed_cases: '145', pending_cases: '40',  debt_to_equity: '0.35', profit_margin: '18.9',  is_public: true  } },
]

const impactConfig = {
  '-1': { emoji: '🔴', color: '#DC2626', bg: '#FEF2F2' },
   '0': { emoji: '🟡', color: '#D97706', bg: '#FFFBEB' },
   '1': { emoji: '🟢', color: '#16A34A', bg: '#F0FDF4' },
}

export default function AnalyzerScreen() {
  const [form, setForm] = useState({
    company_name: '', disposed_cases: '', pending_cases: '',
    debt_to_equity: '', profit_margin: '', is_public: true,
  })
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handlePredict = async () => {
    if (!form.company_name || !form.disposed_cases || !form.pending_cases) {
      setError('Company Name, Disposed Cases, and Pending Cases are required.')
      return
    }
    setError(''); setLoading(true); setResult(null)
    try {
      const data = await predictSingle(form)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm({ company_name: '', disposed_cases: '', pending_cases: '', debt_to_equity: '', profit_margin: '', is_public: true })
    setResult(null); setError('')
  }

  const quickFill = (data) => {
    setForm({ ...data, disposed_cases: String(data.disposed_cases), pending_cases: String(data.pending_cases) })
    setResult(null); setError('')
  }

  return (
    <div className="screen-pad">
      {/* Header */}
      <div className="screen-header">
        <h1 className="screen-title">Company Risk Analyzer</h1>
        <p className="screen-sub">
          Live XGBoost inference via FastAPI backend · Threshold: 0.46 · Recall: 88.0%
        </p>
      </div>

      {/* Quick Fill */}
      <div className="flex-row mb-24" style={{ gap: 10 }}>
        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Quick demo:</span>
        {QUICK_FILL.map(q => (
          <button
            key={q.label}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: 12 }}
            onClick={() => quickFill(q.data)}
          >
            {q.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>

        {/* ── Input Form ── */}
        <motion.div
          className="card card-pad"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="card-title mb-16" style={{ paddingBottom: 14, borderBottom: '1px solid #E2E8F0' }}>
            Enter Company Details
          </div>

          <div className="form-group">
            <label className="form-label">Company Name *</label>
            <input className="form-input" placeholder="e.g. NTPC Limited"
              value={form.company_name} onChange={e => set('company_name', e.target.value)} />
          </div>

          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Disposed Cases *</label>
              <input className="form-input" type="number" placeholder="e.g. 145"
                value={form.disposed_cases} onChange={e => set('disposed_cases', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Pending Cases *</label>
              <input className="form-input" type="number" placeholder="e.g. 110"
                value={form.pending_cases} onChange={e => set('pending_cases', e.target.value)} />
            </div>
          </div>

          {/* Public Status — most important feature */}
          <div className="form-group">
            <label className="form-label">
              Public Listing Status
              <span style={{ color: '#C9A84C', fontWeight: 700, marginLeft: 6 }}>★ 48.3% importance</span>
            </label>
            <select
              className="form-input form-select"
              value={String(form.is_public)}
              onChange={e => set('is_public', e.target.value === 'true')}
            >
              <option value="true">✓ Listed (Stock Exchange)</option>
              <option value="false">✗ Unlisted (Government Owned)</option>
            </select>
          </div>

          {/* Financial fields — negligible warning */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#D97706', marginBottom: 4 }}>
              ⚠️ Financial Metrics (0.0% Predictive Weight)
            </div>
            <div style={{ fontSize: 11, color: '#92400E' }}>
              Research confirmed Profit & Debt have negligible impact. These are passed to the model but carry no weight.
            </div>
          </div>

          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Debt/Equity (optional)</label>
              <input className="form-input" type="number" step="0.01" placeholder="e.g. 0.95"
                value={form.debt_to_equity} onChange={e => set('debt_to_equity', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Profit Margin % (optional)</label>
              <input className="form-input" type="number" step="0.1" placeholder="e.g. 12.5"
                value={form.profit_margin} onChange={e => set('profit_margin', e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="error-box" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              {error.includes('backend') ? <Wifi size={14} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
              <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
            </div>
          )}

          <div className="flex-row" style={{ gap: 10 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handlePredict} disabled={loading}>
              {loading
                ? <><RefreshCw size={14} style={{ animation: 'spin .8s linear infinite' }} /> Analyzing…</>
                : <><Zap size={14} /> Predict Risk</>
              }
            </button>
            <button className="btn-secondary" onClick={handleReset}>Reset</button>
          </div>

          {/* Backend status note */}
          <div style={{ marginTop: 16, padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 11, color: '#94A3B8', lineHeight: 1.6 }}>
            <strong style={{ color: '#64748B' }}>🔌 Live API:</strong> Results come from your real XGBoost model running at <code style={{ fontFamily: 'monospace' }}>localhost:8000</code>
          </div>
        </motion.div>

        {/* ── Result Panel ── */}
        <motion.div
          className="card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ padding: 28, minHeight: 460 }}
        >
          <AnimatePresence mode="wait">

            {/* Empty */}
            {!result && !loading && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="empty-state" style={{ paddingTop: 80 }}>
                  <Brain size={52} color="#E2E8F0" />
                  <div className="empty-state-title">Ready to assess risk</div>
                  <div className="empty-state-sub">
                    Enter company details or use a quick-demo button, then click <strong>Predict Risk</strong>.
                    Predictions come from your real XGBoost model via the FastAPI backend.
                  </div>
                </div>
              </motion.div>
            )}

            {/* Loading */}
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LoadingSpinner message="Running real XGBoost inference…" sub="Calling FastAPI backend · threshold: 0.46" />
              </motion.div>
            )}

            {/* Result */}
            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>
                  Assessment for:{' '}
                  <span style={{ fontFamily: 'Lora, serif', color: '#0F1C35' }}>{result.company_name}</span>
                  <span style={{ marginLeft: 10, fontSize: 11, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 4, padding: '1px 7px' }}>
                    🔌 Live Model
                  </span>
                </div>

                {/* Gauge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <RiskGauge score={result.risk_score} />
                </div>

                {/* Classification banner */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '10px 24px', borderRadius: 10,
                    background: result.is_high_risk ? '#FEF2F2' : '#F0FDF4',
                    border: `1.5px solid ${result.is_high_risk ? '#FCA5A5' : '#86EFAC'}`,
                  }}>
                    <span style={{ fontSize: 20 }}>{result.is_high_risk ? '⚠️' : '✅'}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: result.is_high_risk ? '#DC2626' : '#16A34A' }}>
                        {result.is_high_risk ? 'HIGH RISK — Payment Delay Likely' : 'LOW RISK — Payment Likely on Time'}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                        Predicted Probability: {(result.risk_probability * 100).toFixed(1)}% ·
                        Threshold: {result.decision_threshold} ·
                        Model Confidence: {(result.model_confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meta chips */}
                <div className="flex-row" style={{ justifyContent: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  {[
                    `Sector: ${result.sector.replace(/_/g, ' ')}`,
                    `Pending: ${result.pending_pct}%`,
                    `Delay Ratio: ${result.delay_risk_ratio}`,
                    result.is_public ? '✓ Listed' : '✗ Unlisted',
                  ].map(chip => (
                    <span key={chip} style={{
                      fontSize: 11, background: '#F8FAFC', border: '1px solid #E2E8F0',
                      borderRadius: 6, padding: '4px 12px', color: '#64748B',
                    }}>
                      {chip}
                    </span>
                  ))}
                </div>

                {/* Research Insight */}
                <div className="insight-box" style={{
                  background: result.is_high_risk ? '#FEF2F2' : '#F0FDF4',
                  borderColor: result.is_high_risk ? '#FCA5A5' : '#86EFAC',
                  color: result.is_high_risk ? '#991B1B' : '#166534',
                  marginBottom: 20,
                }}>
                  <strong>💡 Model Insight:</strong> {result.insight}
                </div>

                {/* Factors + Recs */}
                <div className="grid-2" style={{ gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
                      Feature Importance Breakdown
                    </div>
                    {result.factors.map((f, i) => {
                      const cfg = impactConfig[String(f.impact)]
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '9px 12px', background: cfg.bg, borderRadius: 8, marginBottom: 7,
                            border: `1px solid ${cfg.color}20`,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{f.label}</div>
                            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>
                              Model importance: <strong>{f.importance}%</strong>
                            </div>
                          </div>
                          <span style={{ fontSize: 18, marginLeft: 8 }}>{cfg.emoji}</span>
                        </motion.div>
                      )
                    })}
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
                      MSME Recommendations
                    </div>
                    {result.recommendations.map((r, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}
                      >
                        <ChevronRight size={14} color="#C9A84C" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#0F172A', lineHeight: 1.6 }}>{r}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
