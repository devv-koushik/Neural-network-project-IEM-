# SmartCart AI — E-Commerce Smart Assistant

Full-stack project: React/Vite/Tailwind frontend + Flask/TensorFlow/SQLite
backend, implementing **Module 1** (purchase & churn prediction) and
**Module 2** (model optimization & hyperparameter tuning) end-to-end.

```
smartcart-ai/
├── backend/     Flask API + TensorFlow models + SQLite  → see backend/README.md
└── frontend/    React + Vite + Tailwind UI                → see frontend/README.md
```

## Quick start (Windows)

```bat
:: 1. Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python database\seed.py
python ml\data\generate_dataset.py
python ml\training\train_basic.py
python ml\training\train_optimized.py
python app.py

:: 2. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Demo logins: `customer@demo.com` /
`customer123` and `admin@demo.com` / `admin123`.

This zip already ships with a pre-trained/pre-seeded backend (`smartcart.db`,
`saved_models/`, `results/`, `logs/`) so `python app.py` works immediately
even before you re-run the training steps above — re-run them any time to
retrain from scratch with fresh random weights.

Full docs, API reference, architecture, and a Windows troubleshooting guide
are in `backend/README.md` and `frontend/README.md`.
