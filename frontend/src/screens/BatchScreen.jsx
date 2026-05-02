import { useState } from 'react'
import { Upload, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BATCH_SAMPLE } from '../data/mockData'
import { RiskBadge, SectorPill, ProgressBar } from '../components/Shared'
import { predictBatch } from '../api'
import { scoreColor } from '../helpers'


export default function BatchScreen() {
  const [dragging, setDragging]     = useState(false)
  const [fileName, setFileName]     = useState(null)
  const [progress, setProgress]     = useState(0)
  const [processing, setProcessing] = useState(false)
  const [results, setResults]       = useState([])
  const [batchMeta, setBatchMeta]   = useState(null)
  const [error, setError]           = useState('')

  const runBatch = async () => {
    setProcessing(true); setResults([]); setProgress(0); setError('')

    // Animate progress bar while waiting for API
    let p = 0
    const iv = setInterval(() => {
      p = Math.min(p + 12, 85)   // advance to 85% while API is processing
      setProgress(p)
    }, 300)

    try {
      const data = await predictBatch(BATCH_SAMPLE)
      clearInterval(iv)
      setProgress(100)
      setBatchMeta({ total: data.total, high_risk: data.high_risk, low_risk: data.low_risk })
      setResults(data.results)
    } catch (err) {
      clearInterval(iv)
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }


  return (
    <div className="screen-pad">
      <div className="screen-header">
        <h1 className="screen-title">Batch Risk Analysis</h1>
        <p className="screen-sub">
          Upload a CSV to assess multiple CPSEs simultaneously — results powered by Optuna-XGBoost
        </p>
      </div>

      {/* Drop Zone */}
      <motion.div
        className={`drop-zone mb-24 ${dragging ? 'dragging' : ''}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          const f = e.dataTransfer.files[0]
          if (f) setFileName(f.name)
        }}
      >
        <motion.div animate={{ scale: dragging ? 1.1 : 1 }} transition={{ duration: 0.2 }}>
          <Upload size={44} color={dragging ? '#0F1C35' : '#CBD5E1'} style={{ marginBottom: 16 }} />
        </motion.div>

        <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
          {fileName ? `✓ ${fileName}` : 'Drag & drop your CSV here'}
        </div>
        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
          Required columns:{' '}
          <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>
            company_name, disposed_cases, pending_cases, debt_to_equity, profit_margin
          </code>
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 24 }}>Max 500 companies · CSV or Excel</div>

        <div className="flex-row" style={{ justifyContent: 'center', gap: 12 }}>
          <button className="btn-primary" onClick={runBatch} disabled={processing}>
            {fileName ? `Analyze ${fileName}` : 'Run Demo (5 Companies)'}
          </button>
          <button className="btn-secondary">
            <Download size={13} /> Download Template
          </button>
        </div>
      </motion.div>

      {/* Progress */}
      <AnimatePresence>
        {processing && (
          <motion.div
            className="card card-pad mb-24"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex-between mb-8">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                Processing companies…
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1C35' }}>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>
              Running XGBoost inference · Optuna-tuned model v2.0 · Threshold: 0.46
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="error-box mb-24" style={{ whiteSpace: 'pre-line' }}>
          🔌 {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="card-header">
              <div>
                <div className="card-title">
                  {batchMeta?.total} Companies Analyzed
                  <span style={{ marginLeft: 10, fontSize: 11, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 4, padding: '1px 7px' }}>
                    🔌 Live Model
                  </span>
                </div>
                <div className="card-sub">
                  {batchMeta?.high_risk} high-risk · {batchMeta?.low_risk} low-risk
                </div>
              </div>
              <button className="btn-secondary" style={{ padding: '7px 14px' }}>
                <Download size={13} /> Export Results
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {['Company', 'Pending %', 'Probability', 'Public', 'Risk Score', 'Model Confidence', 'Sector'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>{r.company_name}</td>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(r.risk_score) }}>
                          {r.pending_pct}%
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 12, color: '#64748B' }}>
                          {(r.risk_probability * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: r.is_public ? '#16A34A' : '#DC2626',
                          background: r.is_public ? '#F0FDF4' : '#FEF2F2',
                          borderRadius: 4, padding: '2px 8px',
                        }}>
                          {r.is_public ? '✓ Listed' : '✗ Unlisted'}
                        </span>
                      </td>
                      <td><RiskBadge score={r.risk_score} small /></td>
                      <td style={{ fontSize: 12, color: '#64748B' }}>
                        {(r.model_confidence * 100).toFixed(0)}%
                      </td>
                      <td><SectorPill sector={r.sector} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Research note */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid #E2E8F0', fontSize: 12, color: '#94A3B8' }}>
              <strong style={{ color: '#C9A84C' }}>Research Note:</strong> Risk classification uses threshold{' '}
              <code style={{ fontFamily: 'monospace', fontSize: 11 }}>P(high_risk) {'>'} 0.46</code>.
              The model's 88.0% recall means nearly all truly risky CPSEs are flagged — protecting MSMEs from bad payers.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

