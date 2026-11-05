# SmartCart AI — E-Commerce Smart Assistant

A production-grade, full-stack E-Commerce AI platform integrating deep learning, computer vision, time-series forecasting, and generative models with an interactive React dashboard.

---

## Architecture Overview

```
smartcart-ai/
├── backend/
│   ├── app.py                      # Flask factory, blueprint routing, error handlers
│   ├── config.py                   # Configuration, environment variables, model paths
│   ├── utils.py                    # JWT authentication decorators & response helpers
│   ├── requirements.txt            # Python dependencies (Flask, TensorFlow, Scikit-learn, etc.)
│   ├── database/                   # SQLAlchemy DB instance & seeders
│   ├── models/                     # SQLAlchemy Models (User, Customer, Prediction, Forecast, etc.)
│   ├── routes/                     # REST API endpoints (Auth, Customer, Prediction, Vision, etc.)
│   ├── services/                   # Business logic, caching, and model inference managers
│   ├── ml/
│   │   ├── preprocessing/          # Data-leakage-free scalers & encoders
│   │   ├── models/                 # ANN, MobileNetV2, and LSTM architectures
│   │   ├── training/               # Baseline & Hyperparameter tuning training pipelines
│   │   ├── visual/                 # MobileNetV2 transfer learning training pipeline
│   │   ├── forecasting/            # LSTM demand forecasting pipeline & dataset generator
│   │   └── generative/             # Statistical synthetic data & neural copywriter
│   ├── saved_models/               # Serialized .keras models, joblib scalers, feature configs
│   ├── results/                    # Validated evaluation metrics & confusion matrices
│   └── tests/                      # Pytest end-to-end multi-module test suite
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── public/             # Landing, Products, Details, Login, Register
    │   │   ├── customer/           # Customer Dashboard, AIPrediction, History, Profile
    │   │   ├── admin/              # Admin Analytics, Churn, Tuning, Products Management
    │   │   └── future/             # Modules 3, 4, 5 full functional implementations
    │   ├── components/             # Reusable UI cards, tables, charts, navigation
    │   └── services/api.js         # Axios API client for all backend endpoints
    └── package.json
```

---

## The Five Core Modules

### Module 1: Basic Sales & Customer Prediction
- **Neural Architecture:** Multi-layer Perceptron (ANN) with ReLU activations and Sigmoid output probability.
- **Data-Leakage Prevention:** Raw dataset is split chronologically/stratified into Train (70%), Validation (15%), and Test (15%) partitions **before** fitting the `StandardScaler` and `LabelEncoder`.
- **Inference:** Sub-50ms live prediction endpoint calculating Purchase Likelihood and Churn Risk with positive and risk contributing factor breakdowns.
- **Evaluation:** Evaluated on unseen test records reporting Accuracy, Precision, Recall, F1 Score, ROC-AUC, and Confusion Matrix.

### Module 2: Sales Optimization & Hyperparameter Tuning
- **Optimization Architectures:**
  1. Baseline ANN
  2. Dropout Regularization (`rate=0.4`)
  3. L2 Weight Regularization (`lambda=0.001`)
  4. Batch Normalization
  5. Optimized Compound Model (Early Stopping + ReduceLROnPlateau)
- **Ad-Hoc Experiments:** Administrators can launch customized training experiments (learning rate, batch size, dropout, hidden units, initialization) directly from the UI.
- **Monitoring:** Full TensorBoard integration logging epoch loss, validation accuracy, and weight histograms to `backend/logs/`.

### Module 3: Visual Product Recognition
- **Deep Learning Architecture:** Pretrained **MobileNetV2** transfer learning classifier with custom dense classification head.
- **Supported Categories:** `Shoes`, `Shirts`, `Electronics`, `Accessories`, `Bags`, `Other`.
- **Image Pipeline:** Automatic resizing to 224x224 RGB, normalization, file format verification (PNG, JPG, WEBP, GIF), and size validation (<10MB).
- **Inference Output:** Predicted category, confidence score, and top-3 probability rankings saved to SQLite `image_predictions`.

### Module 4: Demand & Sales Forecasting
- **Time-Series Architecture:** 2-layer **LSTM** network (64 units -> Dropout(0.2) -> 32 units -> Dense(16) -> Dense(1)).
- **Historical Sales Data:** 730 days (2 years) of daily records capturing weekly cycles, seasonal holiday surges, and payday trends.
- **Forecasting Horizons:** 7-day and 30-day forward-looking autoregressive projections with 95% confidence intervals.
- **Inventory Intelligence:** Automatic stock shortage warnings and overstock risk detections compared against live warehouse inventory.
- **Metrics:** Evaluated on held-out test periods reporting MAE, RMSE, and MAPE.

### Module 5: Synthetic Data & Generative AI Copy
- **Feature A (Synthetic Tabular Data):** Generates privacy-preserving customer and catalog records using empirical distribution sampling and constraint checking. Evaluates distribution similarity using the **Kolmogorov-Smirnov (KS) two-sample test** and provides one-click CSV export.
- **Feature B (AI Product Content & Sales Reports):** Generates SEO-optimized titles, elevator pitches, detailed multi-paragraph descriptions, and search keyword tags. Generates comprehensive executive sales reports synthesized directly from live database metrics.

---

## Quick Start (Windows)

### 1. Backend Setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# (Optional: Retrain models from scratch)
python ml/training/train_basic.py
python ml/training/train_optimized.py
python ml/visual/train_visual.py
python ml/forecasting/train_forecasting.py

# Launch Flask Server (Port 5000)
python app.py
```

### 2. Frontend Setup

In a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Demo Accounts

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@demo.com` | `admin123` | Full Admin Console, Model Tuning, Modules 3, 4, 5 |
| **Customer** | `customer@demo.com` | `customer123` | Customer Dashboard, Live AI Prediction, History, Profile |

---

## REST API Reference

### Auth & User (`/api/auth`)
- `POST /api/auth/register` — Create customer account
- `POST /api/auth/login` — Authenticate and receive JWT
- `GET  /api/auth/me` — Authenticated user profile and prediction stats
- `PUT  /api/auth/profile` — Update user name and email
- `PUT  /api/auth/password` — Change password

### Predictions (`/api`)
- `POST /api/predict/purchase` — ANN purchase likelihood inference
- `POST /api/predict/churn` — ANN churn risk inference
- `POST /api/predict/both` — Simultaneous purchase & churn inference with factors
- `GET  /api/predictions` — Paginated prediction history

### Visual Recognition (`/api/visual-recognition`)
- `POST /api/visual-recognition/predict` — Multipart image upload & MobileNetV2 classification
- `GET  /api/visual-recognition/history` — Stored visual prediction history
- `GET  /api/visual-recognition/status` — CNN engine status and supported categories

### Demand Forecasting (`/api/forecasting`)
- `GET  /api/forecasting/products` — Catalog products with sales history
- `POST /api/forecasting/predict` — Run 7-day or 30-day LSTM forecast
- `GET  /api/forecasting/history` — Stored forecast run history
- `POST /api/forecasting/train` — Launch LSTM model retraining

### Generative AI (`/api/generative`)
- `POST /api/generative/synthetic-data/generate` — Synthesize tabular dataset with KS testing
- `GET  /api/generative/synthetic-data/history` — Synthetic dataset history
- `GET  /api/generative/synthetic-data/download/<id>` — Download generated dataset CSV
- `POST /api/generative/product-description` — Generate SEO title, description, and keywords
- `POST /api/generative/sales-report` — Generate executive narrative report

---

## Verification & Testing

Run the automated backend test suite:

```powershell
cd backend
.\venv\Scripts\pytest tests\test_all_modules.py -v
```

Run the production frontend build:

```powershell
cd frontend
npm run build
```
