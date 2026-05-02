/**
 * DashboardScreen — Professional Research Intelligence Dashboard
 *
 * Sections:
 *  1. Hero banner (core finding)
 *  2. KPI stat cards (4)
 *  3. Research findings (3 insight cards)
 *  4. Data pipeline visualiser (5 steps)
 *  5. Feature importance (animated bars)
 *  6. Sector risk chart + leaderboard
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, RadialBarChart, RadialBar,
} from 'recharts'
import {
  Building2, AlertTriangle, CheckCircle2, Brain,
  Database, Cpu, Target, TrendingUp, Search,
  FlaskConical, ChevronRight, Zap, Award,
} from 'lucide-react'
import { StatCard, SectorPill, RiskBadge } from '../components/Shared'
import { PSU_LIST, SECTOR_STATS, FEATURES } from '../data/mockData'

/* ─────────── helpers ─────────────────────────────────────── */
const fade  = (delay = 0) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.42, delay, ease: 'easeOut' } })

const SECTOR_COLOR = {
  Energy_Mining: '#EF4444', Infrastructure: '#F97316',
  Defense_Aerospace: '#10B981', Financial_Services: '#3B82F6',
  Other_Govt_Services: '#F59E0B',
}

/* ─────────── sub-components ──────────────────────────────── */

/** Gradient dark hero banner */
function HeroBanner() {
  return (
    <motion.section {...fade(0)} style={{ marginBottom: 28 }}>
      <div style={{
        background: 'linear-gradient(130deg, #0A1628 0%, #0E2040 55%, #122848 100%)',
        borderRadius: 16, padding: '32px 36px',
        border: '1px solid rgba(230,184,74,.18)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* ambient glows */}
        <div style={{ position:'absolute', top:-60, right:-60, width:260, height:260, background:'radial-gradient(circle,rgba(230,184,74,.09) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, left:80, width:180, height:180, background:'radial-gradient(circle,rgba(59,130,246,.07) 0%,transparent 70%)', pointerEvents:'none' }} />

        <div style={{ display:'flex', gap:28, alignItems:'flex-start', position:'relative' }}>
          {/* Emoji pill */}
          <div style={{
            fontSize:32, lineHeight:1, flexShrink:0,
            background:'rgba(230,184,74,.12)', border:'1px solid rgba(230,184,74,.22)',
            borderRadius:12, padding:'12px 14px',
          }}>🔬</div>

          <div style={{ flex:1 }}>
            {/* eyebrow */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:10, fontWeight:700, color:'#E6B84A', letterSpacing:'.13em', textTransform:'uppercase' }}>
                Core Research Finding
              </span>
              <span style={{ fontSize:10, color:'#2A4A6A', fontWeight:600 }}>·</span>
              <span style={{ fontSize:10, color:'#4A6A8A', fontWeight:500 }}>3rd Year B.Tech · IIT (ISM) Dhanbad</span>
            </div>

            <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', fontFamily:'Lora,serif', lineHeight:1.35, marginBottom:14, letterSpacing:'-.02em' }}>
              Financial Health Does <em style={{ color:'#E6B84A', fontStyle:'normal' }}>Not</em> Predict<br />
              Government Payment Delays
            </h2>

            <p style={{ fontSize:13.5, color:'#7A9AB8', lineHeight:1.85, maxWidth:680, marginBottom:22 }}>
              This XGBoost model <strong style={{ color:'#E6B84A' }}>disproved the hypothesis</strong> that a CPSE's financial condition (profit, debt)
              drives MSME invoice delays. After training on <strong style={{ color:'#fff' }}>128 Central PSUs</strong> from MSME Samadhaan,
              both <strong style={{ color:'#fff' }}>Profit Margin and Debt/Equity showed 0.0% predictive weight</strong>. The only real signals
              are <strong style={{ color:'#E6B84A' }}>Public Listing Status (48.3%)</strong> and <strong style={{ color:'#E6B84A' }}>Sector Classification (51.7%)</strong>.
              Payment bottlenecks are <em style={{ color:'#fff', fontStyle:'italic' }}>structural and bureaucratic</em> — not financial.
            </p>

            {/* 4 metric pills */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {[
                { val:'61.29%', lbl:'Model Accuracy',     note:'vs ~50% baseline' },
                { val:'88.0%',  lbl:'High-Risk Recall',   note:'key MSME metric' },
                { val:'0.46',   lbl:'Decision Threshold', note:'AI-optimised' },
                { val:'150',    lbl:'Optuna Trials',      note:'Bayesian search' },
              ].map(m => (
                <div key={m.val} style={{
                  background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)',
                  borderRadius:10, padding:'10px 18px',
                }}>
                  <div style={{ fontSize:22, fontWeight:800, color:'#E6B84A', fontFamily:'Lora,serif', lineHeight:1 }}>{m.val}</div>
                  <div style={{ fontSize:11, color:'#7A9AB8', marginTop:4 }}>
                    <span style={{ color:'#A0BADA', fontWeight:600 }}>{m.lbl}</span> · {m.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

/** 4-column KPI row */
function KpiRow() {
  const highRisk = PSU_LIST.filter(p => p.score >= 61).length
  const lowRisk  = PSU_LIST.filter(p => p.score <  31).length
  return (
    <div className="grid-4" style={{ marginBottom:28 }}>
      <StatCard icon={Building2}    label="Total PSUs Monitored" value="128"    sub="Central PSUs on Samadhaan" accent="#0A1628" delay={0}   />
      <StatCard icon={AlertTriangle} label="High Risk Entities"  value={highRisk} sub="Risk score ≥ 61 / threshold 0.46" accent="#EF4444" delay={60}  />
      <StatCard icon={CheckCircle2}  label="Low Risk Entities"   value={lowRisk}  sub="Risk score < 31 — safe payers"   accent="#10B981" delay={120} />
      <StatCard icon={Brain}         label="Recall (Key Metric)" value="88.0%"  sub="Catches 88% of risky CPSEs"    accent="#F59E0B" delay={180} />
    </div>
  )
}

/** Research insight cards */
function ResearchInsights() {
  const cards = [
    {
      icon:'🏛️', accent:'#3B82F6',
      tag:'Primary Driver · 48.3%',
      title:'Public Listing = Accountability',
      body:'Listed CPSEs face SEBI regulations, quarterly disclosures, and shareholder scrutiny — creating structural pressure to honour payment timelines. Unlisted PSUs (e.g., BSNL) have no such enforcement mechanism.',
    },
    {
      icon:'🏭', accent:'#F97316',
      tag:'Primary Driver · 51.7%',
      title:'Sector Culture Defines Behaviour',
      body:'Energy & Mining sector shows 65% high-risk rate due to institutional inertia and commodity cycles. Defense & Aerospace clocks just 10% — disciplined procurement processes, strict audits and accountability.',
    },
    {
      icon:'💸', accent:'#10B981',
      tag:'Null Hypothesis Rejected · 0.0%',
      title:'Profit & Debt Are Irrelevant Here',
      body:'After 150 Optuna trials, XGBoost assigned exactly 0.0% importance to Profit Margin and Debt-to-Equity. A loss-making PSU pays invoices as reliably as a profitable one — it\'s bureaucracy, not balance sheets.',
    },
  ]
  return (
    <motion.section {...fade(0.1)} style={{ marginBottom:28 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <FlaskConical size={16} color="#E6B84A" />
        <h3 style={{ fontSize:15, fontWeight:700, color:'#0F172A', fontFamily:'Lora,serif' }}>Research Insights</h3>
        <span style={{ fontSize:12, color:'#94A3B8', marginLeft:4 }}>From XGBoost model trained on MSME Samadhaan + YFinance data</span>
      </div>
      <div className="grid-3" style={{ gap:18 }}>
        {cards.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.12 + i*0.1, duration:0.4 }}
            style={{
              background:'#fff',
              border:`1px solid ${c.accent}22`,
              borderTop:`3px solid ${c.accent}`,
              borderRadius:12,
              padding:'22px 22px 20px',
              boxShadow:'0 2px 8px rgba(0,0,0,.05)',
              transition:'transform .2s, box-shadow .2s',
              cursor:'default',
            }}
            whileHover={{ y:-3, boxShadow:'0 8px 24px rgba(0,0,0,.1)' }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <span style={{ fontSize:28, lineHeight:1 }}>{c.icon}</span>
              <span style={{
                fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6,
                color:c.accent,
                background:`${c.accent}12`,
                border:`1px solid ${c.accent}30`,
                letterSpacing:'.04em',
              }}>{c.tag}</span>
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:'#0F172A', marginBottom:8, lineHeight:1.4 }}>{c.title}</div>
            <div style={{ fontSize:12.5, color:'#64748B', lineHeight:1.75 }}>{c.body}</div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

/** Data pipeline — 5 steps */
function DataPipeline() {
  const steps = [
    { icon:<Database size={18} color="#E6B84A"/>,  step:'01', title:'Scrape Samadhaan',    body:'Playwright scrapes 128 Central PSUs: disposed cases, pending cases, amounts from MSME Samadhaan portal.' },
    { icon:<TrendingUp size={18} color="#3B82F6"/>, step:'02', title:'YFinance Signals',    body:'yfinance pulls Profit Margin, Debt/Equity for listed PSUs. Unlisted (BSNL etc.) get null → imputed 0.' },
    { icon:<FlaskConical size={18} color="#10B981"/>,step:'03',title:'Feature Engineering', body:'10 features: Is_Public, D/E, Profit Margin, 5 sector dummies, 2 sector-relative features.' },
    { icon:<Cpu size={18} color="#F97316"/>,        step:'04', title:'Optuna + XGBoost',    body:'150 Bayesian trials tune n_estimators, max_depth, learning_rate, subsample, gamma, min_child_weight.' },
    { icon:<Target size={18} color="#8B5CF6"/>,     step:'05', title:'Threshold = 0.46',    body:'AI sweeps 0.30–0.70 to find 0.46 maximising recall. 88% of risky PSUs caught — protects MSMEs.' },
  ]
  return (
    <motion.section {...fade(0.2)} style={{ marginBottom:28 }}>
      <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
        <div style={{ padding:'18px 24px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:10 }}>
          <Cpu size={15} color="#E6B84A" />
          <span style={{ fontSize:14, fontWeight:700, color:'#0F172A', fontFamily:'Lora,serif' }}>ML Pipeline — How It Works</span>
          <span style={{ marginLeft:'auto', fontSize:11, color:'#94A3B8' }}>MSME Samadhaan → YFinance → XGBoost → FastAPI → React</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:0 }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              padding:'22px 20px',
              borderRight: i < 4 ? '1px solid #F1F5F9' : 'none',
              position:'relative',
            }}>
              {/* step number */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%',
                  background:'#0A1628', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:10, fontWeight:800, color:'#E6B84A',
                }}>{s.step}</div>
                {s.icon}
                {i < 4 && (
                  <div style={{ position:'absolute', right:-10, top:'50%', zIndex:2, background:'#fff', padding:'0 2px' }}>
                    <ChevronRight size={14} color="#CBD5E1" />
                  </div>
                )}
              </div>
              <div style={{ fontSize:12.5, fontWeight:700, color:'#0F172A', marginBottom:7, lineHeight:1.3 }}>{s.title}</div>
              <div style={{ fontSize:11.5, color:'#64748B', lineHeight:1.7 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}

/** Feature importance bars — animated */
function FeatureImportance() {
  const items = [
    { label:'Public Listing Status', pct:48.3, color:'#E6B84A', tag:'DOMINANT',   tagColor:'#E6B84A' },
    { label:'Sector: Energy/Mining', pct:28.1, color:'#E6B84A', tag:'DOMINANT',   tagColor:'#E6B84A' },
    { label:'Sector: Other Govt',    pct:14.8, color:'#E6B84A', tag:'DOMINANT',   tagColor:'#E6B84A' },
    { label:'Sector: Infrastructure',pct: 8.8, color:'#94A3B8', tag:null,         tagColor:null },
    { label:'Profit Margin',         pct: 0.0, color:'#E2E8F0', tag:'0.0% — NULL',tagColor:'#94A3B8' },
    { label:'Debt-to-Equity',        pct: 0.0, color:'#E2E8F0', tag:'0.0% — NULL',tagColor:'#94A3B8' },
  ]
  return (
    <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, padding:'22px 24px', boxShadow:'0 2px 8px rgba(0,0,0,.04)', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:20 }}>
        <Zap size={15} color="#E6B84A" />
        <span style={{ fontSize:14, fontWeight:700, color:'#0F172A', fontFamily:'Lora,serif' }}>Feature Importance</span>
        <span style={{ marginLeft:'auto', fontSize:10, color:'#94A3B8', fontWeight:600 }}>XGBoost gain-based</span>
      </div>
      {items.map((f, i) => (
        <motion.div
          key={f.label}
          initial={{ opacity:0, x:-12 }}
          animate={{ opacity:1, x:0 }}
          transition={{ delay:0.25 + i*0.07 }}
          style={{ marginBottom:16 }}
        >
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ fontSize:12.5, fontWeight: f.pct > 0 ? 600 : 400, color: f.pct > 0 ? '#0F172A' : '#94A3B8' }}>
                {f.label}
              </span>
              {f.tag && (
                <span style={{
                  fontSize:9, fontWeight:700, letterSpacing:'.06em', padding:'1px 7px', borderRadius:5,
                  color: f.tagColor, background:`${f.tagColor}15`, border:`1px solid ${f.tagColor}30`,
                }}>{f.tag}</span>
              )}
            </div>
            <span style={{ fontSize:13, fontWeight:800, color: f.pct > 0 ? '#0A1628' : '#CBD5E1', fontFamily:'Lora,serif' }}>
              {f.pct}%
            </span>
          </div>
          <div style={{ height:8, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
            <motion.div
              initial={{ width:0 }}
              animate={{ width:`${f.pct}%` }}
              transition={{ duration:0.9, delay:0.3 + i*0.07, ease:'easeOut' }}
              style={{ height:'100%', background:f.color, borderRadius:99,
                       boxShadow: f.pct > 0 ? `0 0 6px ${f.color}60` : 'none' }}
            />
          </div>
        </motion.div>
      ))}
      <div style={{
        marginTop:18, padding:'11px 14px',
        background:'linear-gradient(135deg,rgba(230,184,74,.06),rgba(230,184,74,.1))',
        border:'1px solid rgba(230,184,74,.25)', borderRadius:8,
        fontSize:12, color:'#92400E', lineHeight:1.65,
      }}>
        <strong style={{ color:'#E6B84A' }}>Conclusion:</strong>{' '}
        Financial features contribute 0.0% — disproving the hypothesis that financial health predicts
        government payment delays. The model is entirely structurally driven.
      </div>
    </div>
  )
}

/** Sector risk horizontal bar chart */
function SectorChart() {
  const data = [
    { name:'Energy & Mining',    rate:65, color:'#EF4444' },
    { name:'Infrastructure',     rate:45, color:'#F97316' },
    { name:'Other Govt Svcs',    rate:35, color:'#F59E0B' },
    { name:'Financial Services', rate:20, color:'#3B82F6' },
    { name:'Defense & Aero',     rate:10, color:'#10B981' },
  ]
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0]
    return (
      <div style={{ background:'#0A1628', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, padding:'10px 14px' }}>
        <div style={{ fontSize:12, color:'#fff', fontWeight:600 }}>{d.payload.name}</div>
        <div style={{ fontSize:13, color:'#E6B84A', fontWeight:700, marginTop:3 }}>{d.value}% high-risk rate</div>
      </div>
    )
  }
  return (
    <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, padding:'22px 24px', boxShadow:'0 2px 8px rgba(0,0,0,.04)', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:20 }}>
        <TrendingUp size={15} color="#E6B84A" />
        <span style={{ fontSize:14, fontWeight:700, color:'#0F172A', fontFamily:'Lora,serif' }}>High-Risk Rate by Sector</span>
        <span style={{ marginLeft:'auto', fontSize:10, color:'#94A3B8', fontWeight:600 }}>Sector = 51.7% importance</span>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} layout="vertical" margin={{ top:0, right:40, bottom:0, left:10 }}>
          <XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`}
            tick={{ fontSize:11, fill:'#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={130}
            tick={{ fontSize:11.5, fill:'#64748B' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(10,22,40,.04)' }} />
          <Bar dataKey="rate" radius={[0,6,6,0]} maxBarSize={24}
            label={{ position:'right', formatter:v=>`${v}%`, fill:'#64748B', fontSize:11, fontWeight:600 }}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** PSU Leaderboard */
function Leaderboard() {
  const [search, setSearch] = useState('')
  const filtered = PSU_LIST.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
      <div style={{ padding:'18px 22px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:10 }}>
        <Award size={15} color="#E6B84A" />
        <span style={{ fontSize:14, fontWeight:700, color:'#0F172A', fontFamily:'Lora,serif' }}>PSU Risk Leaderboard</span>
        <span style={{ marginLeft:'auto', fontSize:11, color:'#94A3B8' }}>{PSU_LIST.length} companies · sorted by score</span>
      </div>

      {/* Search bar */}
      <div style={{ padding:'12px 22px 0', position:'relative' }}>
        <Search size={13} color="#94A3B8" style={{ position:'absolute', left:36, top:'50%', transform:'translateY(-50%)' }} />
        <input
          className="form-input"
          placeholder="Search any PSU…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft:32, fontSize:12.5, height:36 }}
        />
      </div>

      <div style={{ overflowX:'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {['#','Company','Sector','Status','Pending %','Risk Score'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0,10).map((p, i) => (
              <motion.tr
                key={p.name}
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                transition={{ delay:i*0.03 }}
              >
                <td style={{ color:'#CBD5E1', fontSize:11, fontWeight:700, width:28 }}>{i+1}</td>
                <td style={{ fontWeight:700, color:'#0F172A', fontSize:12.5 }}>{p.name}</td>
                <td><SectorPill sector={p.sector} /></td>
                <td>
                  <span style={{
                    fontSize:10.5, fontWeight:700, borderRadius:5, padding:'2px 8px',
                    color:      p.isPublic ? '#10B981' : '#EF4444',
                    background: p.isPublic ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${p.isPublic ? '#86EFAC' : '#FCA5A5'}`,
                  }}>
                    {p.isPublic ? '✓ Listed' : '✗ Unlisted'}
                  </span>
                </td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, height:5, background:'#F1F5F9', borderRadius:99, overflow:'hidden', minWidth:60 }}>
                      <div style={{ height:'100%', width:`${p.pp}%`, borderRadius:99,
                        background: p.pp >= 61 ? '#EF4444' : p.pp >= 31 ? '#F59E0B' : '#10B981' }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color: p.pp >= 61 ? '#EF4444' : p.pp >= 31 ? '#F59E0B' : '#10B981', minWidth:32 }}>
                      {p.pp}%
                    </span>
                  </div>
                </td>
                <td><RiskBadge score={p.score} small /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > 10 && (
        <div style={{ padding:'10px 22px', fontSize:11.5, color:'#94A3B8', borderTop:'1px solid #F1F5F9', background:'#FAFBFC' }}>
          Showing 10 of {filtered.length} · use search to filter
        </div>
      )}
    </div>
  )
}

/* ─────────── Main export ─────────────────────────────────── */
export default function DashboardScreen() {
  return (
    <div className="screen-pad">
      {/* Page title */}
      <motion.div {...fade(0)} className="screen-header">
        <h1 className="screen-title">Payment Risk Intelligence</h1>
        <p className="screen-sub">
          Live XGBoost model · 128 Central PSUs monitored · Accuracy 61.29% · Recall 88.0% · Threshold 0.46
        </p>
      </motion.div>

      <HeroBanner />
      <KpiRow />
      <ResearchInsights />
      <DataPipeline />

      {/* Feature importance + sector chart side by side */}
      <motion.section {...fade(0.3)} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
        <FeatureImportance />
        <SectorChart />
      </motion.section>

      {/* Full-width leaderboard */}
      <motion.section {...fade(0.35)}>
        <Leaderboard />
      </motion.section>
    </div>
  )
}
