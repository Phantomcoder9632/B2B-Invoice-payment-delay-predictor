# 📊 B2B Invoice Delay Predictor — Frontend

**Predicting MSME Payment Risks through CPSE Financials and Bureaucratic Heuristics**

> *Developed by Bikram Hawladar, 4th Year B.Tech, IIIT Dharwad*

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://www.python.org/)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost-orange?logo=python)](https://xgboost.readthedocs.io/)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-green?logo=fastapi)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](#license)

---

This directory contains the professional, research-backed frontend for the B2B Invoice Payment Delay Predictor. It is designed not just as an interface, but as a **pedagogical tool** that actively explains the novel machine learning findings (specifically, that government payment delays are structural, not financial).

## 🚀 Tech Stack

*   **Core:** React.js + Vite
*   **Styling:** Pure Custom CSS (`index.css`) utilizing CSS Variables, Glassmorphism, and a professional SaaS-level "Navy & Gold" design system.
*   **Animations:** Framer Motion (for physics-based pill navigation, progress bars, and mounting animations)
*   **Charting:** Recharts (for Sector Risk bars)
*   **Icons:** Lucide-React

---

## 🏗️ Architecture & Workflow

The frontend is built as a Single Page Application (SPA) that heavily isolates state and dynamically connects to the Python FastAPI backend for live inference.

```mermaid
graph TD
    subgraph Frontend [React Frontend - Vite:5173]
        App[App.jsx Shell]
        Nav[Floating Glass Navbar]
        Tut[Tutorial Overlay System]
        
        App --> Nav
        App --> Tut
        
        subgraph Screens
            Dash[DashboardScreen]
            Ana[AnalyzerScreen]
            Bat[BatchScreen]
            Mod[ModelScreen]
        end
        
        App --> Dash
        App --> Ana
        App --> Bat
        App --> Mod
    end

    subgraph Backend [FastAPI Backend - :8000]
        API_P[/predict Endpoint]
        API_B[/batch Endpoint]
        XGB[(XGBoost Model .pkl)]
        
        API_P --> XGB
        API_B --> XGB
    end
    
    subgraph Local Data
        Mock[(mockData.js)]
    end

    Ana ==>|Live User Input| API_P
    Bat ==>|Batch Array| API_B
    
    Dash -.->|Ground Truth KPIs| Mock
    Mod -.->|Feature Importances| Mock
```

### 🔁 Execution Workflow
1.  **Shell Mounts:** `App.jsx` handles state routing between the four main screens and controls the global `Tutorial.jsx` pedagogical overlay.
2.  **Dashboard / Model Screens:** These act as research reports. They pull static, verified ground-truth metrics (Accuracy 61.29%, Recall 88%, Feature Importance) from `src/data/mockData.js` to showcase the empirical findings of the study.
3.  **Analyzer / Batch Screens:** These are interactive. When a user inputs PSU data, `api.js` fires a `POST` request to the backend. The backend runs the live XGBoost model, returning risk probabilities and Shapley-based risk reasoning to the UI.

---

## 📂 Directory Structure

```text
frontend/
├── public/                 # Static assets (Favicons, etc.)
└── src/
    ├── assets/             # Images (Hero banner backgrounds)
    ├── components/         # Reusable UI elements
    │   ├── Navbar.jsx      # Top floating glassmorphic navigation
    │   ├── Shared.jsx      # StatCards, RiskGauges, SectorPills, Spinners
    │   └── Tutorial.jsx    # The step-by-step educational overlay
    ├── data/
    │   └── mockData.js     # Hardcoded research ground-truths (128 PSUs)
    ├── screens/            # Main application views
    │   ├── DashboardScreen # Hero banner, ML pipeline, PSU Leaderboard
    │   ├── AnalyzerScreen  # Single-company risk assessment form
    │   ├── BatchScreen     # Multi-company CSV/Array batch processing
    │   └── ModelScreen     # Confusion Matrix, Optuna Hyperparameters
    ├── api.js              # Fetch wrappers for the FastAPI connection
    ├── App.jsx             # Main router and shell layout
    ├── helpers.js          # Color mappings, threshold logic, UI formatting
    ├── index.css           # Global design system & tokens
    └── main.jsx            # React mounting point
```

---

## 🎨 Design Philosophy & Features

1.  **Pedagogical UI:** The app features a `? How to Use` tutorial overlay on every page. Because the core finding of the project is counter-intuitive (Financial metrics have 0.0% predictive weight), the UI explicitly highlights this to the user via "warning" blocks and tutorial prompts.
2.  **SaaS-Grade Aesthetics:**
    *   **Floating Navbar:** A `backdrop-filter: blur(16px)` sticky top navigation.
    *   **Typography:** Pairs `Inter` (sans-serif, UI elements) with `Lora` (serif, data points and headers) for an academic yet modern feel.
    *   **Color Theory:** Avoids generic red/green. Uses deep Navy (`#0A1628`), muted Slate (`#94A3B8`), and premium Gold (`#E6B84A`) to denote "Dominant" features or high-value insights.

---

## 🏃‍♂️ How to Run Locally

1.  Ensure the FastAPI backend is running first (so the Analyzer works).
2.  Open a terminal in the `frontend/` directory.
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Start the Vite development server:
    ```bash
    npm run dev
    ```
5.  Open `http://localhost:5173` in your browser.
