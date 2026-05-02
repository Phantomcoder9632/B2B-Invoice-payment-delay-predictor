import { motion } from 'framer-motion'
import {
  LayoutDashboard, Search, Upload, Brain, FileText,
  HelpCircle,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',      Icon: LayoutDashboard },
  { id: 'analyzer',  label: 'Risk Analyzer',  Icon: Search          },
  { id: 'batch',     label: 'Batch Analysis', Icon: Upload          },
  { id: 'model',     label: 'Model Stats',    Icon: Brain           },
]

export default function Navbar({ active, setActive, onHelp }) {
  return (
    <header className="navbar">
      {/* Brand */}
      <div className="navbar-brand">
        <div className="navbar-brand-icon">
          <FileText size={18} color="#fff" />
        </div>
        <div>
          <div className="navbar-brand-name">B2B Invoice Delay Predictor</div>
          <div className="navbar-brand-sub">XGBoost · Optuna · v2.0</div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="navbar-nav">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              className={`navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setActive(id)}
            >
              {isActive && (
                <motion.div
                  className="navbar-link-indicator"
                  layoutId="navbar-indicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <div className="navbar-link-content">
                <Icon size={14} />
                <span>{label}</span>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Right side */}
      <div className="navbar-right">
        {/* Help button */}
        <button className="navbar-help-btn" onClick={onHelp} title="How to use this page">
          <HelpCircle size={15} />
          <span>How to Use</span>
        </button>

        {/* Model status */}
        <div className="navbar-status">
          <div className="status-dot" />
          <div>
            <div className="navbar-status-label">Model Online</div>
            <div className="navbar-status-sub">localhost:8000</div>
          </div>
        </div>
      </div>
    </header>
  )
}
