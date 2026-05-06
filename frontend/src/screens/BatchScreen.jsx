import { useState, useRef } from 'react'
import { Upload, Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BATCH_SAMPLE, COMPANIES } from '../data/mockData'
import { RiskBadge, SectorPill, ProgressBar } from '../components/Shared'
import { predictBatch } from '../api'
import { scoreColor } from '../helpers'


// Parse CSV string to array of objects
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) throw new Error('CSV must have header and at least one row')
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = values[i] })
    return obj
  })
  
  return rows
}

// Generate CSV template
function downloadTemplate() {
  const template = 'company_name,disposed_cases,pending_cases,debt_to_equity,profit_margin\nAcme Corp,15,8,0.5,0.15\nGlobal Inc,22,12,0.8,0.12'
  const blob = new Blob([template], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'batch_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Export results as CSV
function exportResults(results) {
  if (!results.length) return
  
  const headers = ['company_name', 'pending_pct', 'risk_probability', 'is_public', 'risk_score', 'model_confidence', 'sector']
  const csv = [
    headers.join(','),
    ...results.map(r => [
      r.company_name,
      r.pending_pct,
      (r.risk_probability * 100).toFixed(1),
      r.is_public ? 'Listed' : 'Unlisted',
      r.risk_score,
      (r.model_confidence * 100).toFixed(0),
      r.sector
    ].join(','))
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `batch_results_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}


export default function BatchScreen() {
  const fileInputRef = useRef(null)
  const [dragging, setDragging]         = useState(false)
  const [fileName, setFileName]         = useState(null)
  const [fileData, setFileData]         = useState(null)
  const [progress, setProgress]         = useState(0)
  const [processing, setProcessing]     = useState(false)
  const [results, setResults]           = useState([])
  const [batchMeta, setBatchMeta]       = useState(null)
  const [error, setError]               = useState('')
  const [showDemoSelector, setShowDemoSelector] = useState(false)
  const [selectedCompanies, setSelectedCompanies] = useState(new Set())

  const handleFileSelect = async (file) => {
    if (!file) return
    try {
      const text = await file.text()
      const data = parseCSV(text)
      setFileName(file.name)
      setFileData(data)
      setError('')
    } catch (err) {
      setError(`Failed to parse CSV: ${err.message}`)
      setFileName(null)
      setFileData(null)
    }
  }

  const toggleCompanySelect = (companyId) => {
    const newSet = new Set(selectedCompanies)
    if (newSet.has(companyId)) {
      newSet.delete(companyId)
    } else {
      newSet.add(companyId)
    }
    setSelectedCompanies(newSet)
  }

  const startDemoAnalysis = () => {
    if (selectedCompanies.size < 5 || selectedCompanies.size > 10) {
      setError('Please select between 5 and 10 companies')
      return
    }
    setShowDemoSelector(false)
    // Convert selected companies to batch format
    const selectedData = Array.from(selectedCompanies)
      .map(id => COMPANIES.find(c => c.id === id))
      .map(c => ({
        company_name: c.name,
        disposed_cases: c.disposed,
        pending_cases: c.pending,
        debt_to_equity: c.de,
        profit_margin: c.pm,
      }))
    setFileData(selectedData)
    setFileName(`Demo (${selectedCompanies.size} companies)`)
    // Run prediction immediately
    setTimeout(() => runBatch(selectedData), 0)
  }

  const runBatch = async (dataToUse = null) => {
    setProcessing(true); setResults([]); setProgress(0); setError('')

    // Animate progress bar while waiting for API
    let p = 0
    const iv = setInterval(() => {
      p = Math.min(p + 12, 85)   // advance to 85% while API is processing
      setProgress(p)
    }, 300)

    try {
      const batchData = dataToUse || fileData || BATCH_SAMPLE
      const data = await predictBatch(batchData)
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
        style={{ display: 'none' }}
      />

      {/* Drop Zone */}
      <motion.div
        className={`drop-zone mb-24 ${dragging ? 'dragging' : ''}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          const f = e.dataTransfer.files[0]
          if (f) handleFileSelect(f)
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: 'pointer' }}
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
          <button 
            className="btn-primary" 
            onClick={(e) => { e.stopPropagation(); fileName ? runBatch() : setShowDemoSelector(true) }}
            disabled={processing}
          >
            {fileName ? `Analyze ${fileName}` : 'Run Demo (5-10 Companies)'}
          </button>
          <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); downloadTemplate() }}>
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
              <button className="btn-secondary" style={{ padding: '7px 14px' }} onClick={() => exportResults(results)}>
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

      {/* Demo Company Selector Modal */}
      <AnimatePresence>
        {showDemoSelector && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDemoSelector(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: 12,
                padding: 24,
                maxWidth: 600,
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Select Companies for Comparison
                </h2>
                <button
                  onClick={() => setShowDemoSelector(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <X size={20} color="#64748B" />
                </button>
              </div>

              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
                Choose 5-10 companies to analyze and compare. Currently selected: <strong>{selectedCompanies.size}</strong>
              </div>

              <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                {COMPANIES.map((company) => (
                  <label
                    key={company.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 12,
                      background: selectedCompanies.has(company.id) ? '#EFF6FF' : '#F8FAFC',
                      border: selectedCompanies.has(company.id) ? '2px solid #2563EB' : '1px solid #E2E8F0',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCompanies.has(company.id)}
                      onChange={() => toggleCompanySelect(company.id)}
                      style={{ marginRight: 12, cursor: 'pointer', width: 18, height: 18 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                        {company.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                        {company.sector.replace(/_/g, ' ')} · {company.pending}% pending · {company.isPublic ? '✓ Listed' : '✗ Unlisted'}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: scoreColor(company.score) }}>
                      {company.score}
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setShowDemoSelector(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={startDemoAnalysis}
                  disabled={selectedCompanies.size < 5 || selectedCompanies.size > 10}
                  style={{
                    opacity: selectedCompanies.size < 5 || selectedCompanies.size > 10 ? 0.5 : 1,
                    cursor: selectedCompanies.size < 5 || selectedCompanies.size > 10 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Compare {selectedCompanies.size} Companies
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


