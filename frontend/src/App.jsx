import { useState, useEffect } from 'react'
import './index.css'
import Navbar from './components/Navbar'
import Tutorial from './components/Tutorial'
import DashboardScreen from './screens/DashboardScreen'
import AnalyzerScreen  from './screens/AnalyzerScreen'
import BatchScreen     from './screens/BatchScreen'
import ModelScreen     from './screens/ModelScreen'
import { AnimatePresence, motion } from 'framer-motion'

const screens = {
  dashboard: DashboardScreen,
  analyzer:  AnalyzerScreen,
  batch:     BatchScreen,
  model:     ModelScreen,
}

// Tutorial steps for each screen
const TUTORIALS = {
  dashboard: [
    {
      title: 'Welcome to the Risk Intelligence Dashboard',
      description: 'This dashboard gives you a real-time overview of payment delay risk across 128 Central Public Sector Undertakings (CPSEs) monitored by the MSME Samadhaan portal. Every number here comes from a real XGBoost model trained on actual Samadhaan data.',
      tip: 'The headline stats at the top (accuracy, recall, threshold) are your model\'s verified ground-truth metrics — not marketing figures.',
    },
    {
      title: 'The Core Research Finding',
      description: 'The most important insight from this project: Profit Margin and Debt-to-Equity Ratio have 0.0% predictive weight. The model empirically proved that payment delays in government PSUs are structural and bureaucratic — not driven by financial health. Public Listing Status (48.3%) and Sector Classification (51.7%) are the only real predictors.',
      tip: 'This is counter-intuitive! A PSU can be highly profitable and still delay payments — the research shows it\'s about accountability (listed = publicly accountable) and sector culture.',
    },
    {
      title: 'Sector Risk Breakdown',
      description: 'The bar chart shows risk rates by sector. Energy & Mining (65%) and Other Govt Services (35%) are the highest-risk sectors — this aligns with the model\'s sector feature importances. Defense & Aerospace is the safest sector at just 10%.',
      tip: 'These rates are computed from the real Samadhaan dataset of 128 PSUs — not estimations.',
    },
    {
      title: 'PSU Leaderboard',
      description: 'Scroll down to see a leaderboard of all tracked PSUs with their sector, public status, and risk score. Use the search bar to look up any specific CPSE. The Public Status column is the single most powerful signal — unlisted PSUs are significantly more likely to delay payments.',
      tip: 'You can click any row to jump to the Risk Analyzer pre-filled with that company\'s data.',
    },
  ],
  analyzer: [
    {
      title: 'Company Risk Analyzer',
      description: 'This tool lets you predict payment delay risk for any Central PSU. Enter the company\'s name, its disposed and pending case counts from MSME Samadhaan, and its listing status — then click Predict Risk. The result comes directly from your trained XGBoost model via the FastAPI backend.',
      tip: 'Use the "Quick demo" buttons at the top to pre-fill BSNL (Critical), NTPC (High), or HAL (Low) and see instant examples.',
    },
    {
      title: 'The Most Important Field: Public Listing Status',
      description: 'Public Listing Status carries 48.3% of the model\'s total predictive weight. A listed (stock exchange) CPSE faces public accountability — shareholders, SEBI regulations, and quarterly scrutiny. An unlisted government-owned entity has no such pressure, making it structurally more likely to delay MSME payments.',
      tip: 'If you\'re unsure whether a PSU is listed, search its name on NSE/BSE. Major ones like NTPC, ONGC, HAL are listed; BSNL, AIR INDIA are not.',
    },
    {
      title: 'Why Financials Don\'t Matter Here',
      description: 'You\'ll see a yellow warning box: "Financial Metrics (0.0% Predictive Weight)". This is a key finding — Debt/Equity and Profit Margin are still collected for research completeness, but the XGBoost model assigns them zero importance. A loss-making PSU doesn\'t delay more than a profitable one.',
      tip: 'This finding is the academic novelty of this project. Most B2B credit models rely on financials — this model proves that doesn\'t work for government PSUs.',
    },
    {
      title: 'Reading the Result',
      description: 'After prediction, you\'ll see: (1) A gauge showing the risk score 0–100, (2) A classification banner — HIGH RISK or LOW RISK based on the 0.46 threshold, (3) The actual predicted probability from XGBoost, (4) A feature importance breakdown showing exactly why the model made that decision, and (5) MSME-specific recommendations like advance payment terms or escrow accounts.',
      tip: 'The 0.46 threshold was AI-optimised by Optuna to maximise recall — so the model catches 88% of truly risky PSUs, which is what matters most for protecting MSMEs.',
    },
  ],
  batch: [
    {
      title: 'Batch Risk Analysis',
      description: 'Instead of analyzing one company at a time, this screen lets you analyze multiple CPSEs simultaneously. Click "Run Demo (5 Companies)" to see a live example with NTPC, SAIL, HAL, BSNL, and GAIL — all processed through the real XGBoost model in one API call to /batch.',
      tip: 'In production, you would upload a CSV file with columns: company_name, disposed_cases, pending_cases, debt_to_equity, profit_margin.',
    },
    {
      title: 'Reading the Results Table',
      description: 'The results table shows: Pending % (how many of their Samadhaan cases are still pending), Probability (the exact XGBoost output — probability of high risk), Public status, Risk Score badge, Model Confidence, and Sector. The "🔌 Live Model" badge confirms these are real inferences.',
      tip: 'Sort by Probability to quickly identify which CPSEs pose the highest payment delay risk to your MSMEs.',
    },
    {
      title: 'The Research Note at the Bottom',
      description: 'The research note explains the decision rule: P(high_risk) > 0.46 classifies a company as High Risk. This threshold was chosen over the default 0.50 because it maximises recall — meaning we prefer to flag more companies (some false alarms) rather than miss truly risky ones (costly for MSMEs).',
      tip: 'This is a classic precision-recall trade-off. For MSME protection, missing a risky PSU (false negative) is far more costly than a false alarm.',
    },
  ],
  model: [
    {
      title: 'Model Performance Overview',
      description: 'This screen shows the verified performance metrics of the final XGBoost + Optuna model. The key numbers: 61.29% accuracy on a noisy 150-sample dataset (vs ~50% random baseline), 88.0% recall (catches 88% of truly risky PSUs), 0.46 AI-optimised decision threshold.',
      tip: '61.29% accuracy may sound low, but on a balanced binary classification problem with only 128 samples, this is a hard-won result. The 88% recall is the metric that actually protects MSMEs.',
    },
    {
      title: 'The Confusion Matrix',
      description: 'The confusion matrix shows actual vs predicted labels on the 26-company test set: 16 True Negatives (correctly safe), 3 True Positives (correctly flagged), 4 False Positives (false alarms), 3 False Negatives (missed risks). The model\'s strength is in minimising False Negatives.',
      tip: 'False Negatives (missed risks) are the dangerous ones — an MSME trusts a risky PSU and doesn\'t get paid. The 0.46 threshold was specifically chosen to reduce these.',
    },
    {
      title: 'Feature Importance — The Key Finding',
      description: 'This is the most academically significant panel. Public Listing Status (48.3%) and Sector features (collectively 51.7%) dominate the model. Profit Margin and Debt-to-Equity show 0.0% importance — proving that financial health does NOT predict government payment delays.',
      tip: 'This disproves the hypothesis that B2B payment risk is financial. For CPSEs, it\'s entirely structural and institutional.',
    },
    {
      title: 'Optuna vs GridSearch',
      description: 'The model uses Optuna Bayesian Optimization (150 trials) instead of the traditional GridSearch. Optuna intelligently explores the hyperparameter space, achieving a higher accuracy in fewer trials by learning from previous results — unlike GridSearch which blindly tries every combination.',
      tip: 'This is the engineering novelty of the project: applying state-of-the-art Bayesian hyperparameter optimization to a real-world MSME dataset.',
    },
  ],
}

export default function App() {
  const [screen, setScreen] = useState('dashboard')
  const [showTutorial, setShowTutorial] = useState(false)
  const Screen = screens[screen]

  // Close tutorial on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setShowTutorial(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="app-shell">
      <div className="navbar-wrap">
        <Navbar
          active={screen}
          setActive={(s) => { setScreen(s); setShowTutorial(false) }}
          onHelp={() => setShowTutorial(true)}
        />
      </div>

      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Tutorial overlay */}
      <AnimatePresence>
        {showTutorial && (
          <Tutorial
            steps={TUTORIALS[screen]}
            onClose={() => setShowTutorial(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
