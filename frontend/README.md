# SmartCart AI — E-Commerce Smart Assistant (Frontend)

AI-powered insights for smarter e-commerce decisions.

This is a React + Vite + Tailwind frontend, now connected to a real Flask +
TensorFlow backend (see `../backend`). It still runs standalone on mock data
if the backend isn't running — every function in `src/services/api.js`
falls back to local mock data / `predictionSimulator.js` on network failure,
with a warning logged to the browser console so it's obvious which mode
you're in.

---

## 1. Setup (Windows)

```
npm install
copy .env.example .env
npm run dev
```

`.env` sets `VITE_API_URL=http://localhost:5000/api`, pointing at the Flask
backend. Start the backend first (see `../backend/README.md`) for the full
experience — real trained predictions, real analytics, real model metrics.

The app will be available at **http://localhost:5173**.

To build a production bundle:

```
npm run build
npm run preview
```

---

## 2. Demo accounts

| Role     | Email               | Password    |
|----------|---------------------|-------------|
| Customer | customer@demo.com   | customer123 |
| Admin    | admin@demo.com      | admin123    |

These accounts exist in both the backend's seeded database and as an
offline fallback in `src/services/api.js`, so login works whether or not
the backend is running.

Login state (JWT + user object) is persisted in `localStorage`. Logging in
redirects you automatically: Customer → `/dashboard`, Admin → `/admin`.

---

## 3. All routes

**Public**
- `/` — Landing page
- `/products` — Product listing (search, filter, sort)
- `/products/:id` — Product details
- `/login`, `/register`

**Customer** (protected, role = customer)
- `/dashboard`
- `/predict` — AI prediction form
- `/predict/result` — Prediction result (reached after submitting the form)
- `/predict/history`
- `/profile`

**Admin** (protected, role = admin)
- `/admin` — Admin dashboard
- `/admin/customers` — Customer analytics
- `/admin/purchase-prediction`
- `/admin/churn-prediction`
- `/admin/model-performance`
- `/admin/model-comparison`
- `/admin/hyperparameter-tuning`
- `/admin/training-analytics`
- `/admin/products` — Product management (add/edit/delete)
- `/admin/future-modules` — Hub for Modules 3–5
  - `/admin/future-modules/visual-recognition`
  - `/admin/future-modules/demand-forecasting`
  - `/admin/future-modules/generative-ai`

---

## 4. How predictions work now

`src/utils/predictionSimulator.js` still exists and is used **only as a
fallback** when the backend is unreachable. When the Flask backend is
running, every prediction call in `src/services/api.js`
(`predictPurchase`, `predictChurn`) calls `POST /api/predict/both` on the
real trained TensorFlow models and maps the response into the same shape
the UI already expects — no page component needed to change.

See `../backend/README.md` for the full ML pipeline (dataset generation,
preprocessing, training, evaluation).

---

## 5. Where the mock data lives (fallback only)

`src/data/` still contains the original mock data files. They are no longer
the primary data source — `src/services/api.js` calls the real backend
first — but remain as an offline fallback so the app still demos properly
without the backend running.

---

## 6. Backend connection — what changed in this codebase

See `../backend/README.md` section 11 ("Frontend integration") for the full
list of modified files and why. In short: `src/services/api.js` was
rewritten to call the real API, `AuthContext.jsx` now persists a JWT,
`AdminDashboard.jsx` and `ProductsManagement.jsx` were updated to use real
endpoints instead of local mock imports, and `TrainingAnalytics.jsx` now
fetches the real experiment name list instead of a hardcoded one. Every
other page was untouched — they already went through `api.js`.

---

## 7. Tech stack

React 18 · Vite · Tailwind CSS · React Router v6 · Axios · Recharts · Lucide React
Backend: Flask · TensorFlow/Keras · SQLite · JWT

## 8. Folder structure

```
src/
├── assets/
├── components/
│   ├── common/       Button, Card, Modal, Input, Select, Badge, ProgressRing, ...
│   ├── layout/        Navbar, Sidebar, Footer, Layout, ThemeToggle
│   ├── dashboard/      StatCard, ChartCard, DataTable, AIInsight
│   ├── charts/
│   ├── products/       ProductCard
│   └── prediction/     PredictionCard, HeroPreviewPanel
├── pages/
│   ├── public/          Landing, Products, ProductDetails, Login, Register, NotFound
│   ├── customer/        Dashboard, AIPrediction, PredictionResult, PredictionHistory, Profile
│   ├── admin/            AdminDashboard, CustomerAnalytics, AdminPurchasePrediction,
│   │                      AdminChurnPrediction, ModelPerformance, ModelComparison,
│   │                      HyperparameterTuning, TrainingAnalytics, ProductsManagement
│   └── future/            ComingSoon, FutureModulesHub, VisualRecognition,
│                           DemandForecasting, GenerativeAI
├── data/                 products.js, customers.js, predictions.js, modelMetrics.js,
│                          trainingData.js, experiments.js  (fallback mock data)
├── services/              api.js  — calls the real Flask backend, falls back to mock data
├── utils/                  predictionSimulator.js  (fallback only)
├── hooks/                   useAuth, useTheme, useToast
├── context/                  AuthContext, ThemeContext, ToastContext
├── routes/                    ProtectedRoute.jsx
├── App.jsx
└── main.jsx
```
