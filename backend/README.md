# SmartCart AI — Backend

Flask + TensorFlow/Keras + SQLite backend for the existing SmartCart AI
React frontend. Implements **Module 1 (Purchase & Churn Prediction)** and
**Module 2 (Model Optimization & Hyperparameter Tuning)** end-to-end with
real trained models — no hardcoded metrics or fake predictions anywhere.

Modules 3–5 (Visual Recognition, Demand Forecasting, Generative AI) are
intentionally NOT implemented; the frontend's existing "Coming Soon" pages
for those stay as-is.

---

## 1. Requirements

- Python 3.11 or 3.12 (tested on 3.12)
- ~2 GB free disk space (mostly for the TensorFlow-CPU wheel)
- Windows, macOS, or Linux — CPU only, no GPU/CUDA required

## 2. Installation (Windows)

```bat
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

`.env` works out of the box for local development. Only edit it if you need
to change the port, CORS origin, or JWT secret.

## 3. Generate data & train the models

Run these once, in order, from the `backend/` folder (same commands on
macOS/Linux, drop `venv\Scripts\activate` for `source venv/bin/activate`):

```bat
python database\seed.py
python ml\data\generate_dataset.py
python ml\training\train_basic.py
python ml\training\train_optimized.py
```

What each step does:

| Command | What it does | Time |
|---|---|---|
| `database\seed.py` | Creates `smartcart.db`, seeds demo users/products/customers. Predictions are skipped at this point since models don't exist yet. | ~2s |
| `ml\data\generate_dataset.py` | Generates `ml/data/ecommerce_customers.csv` — 8,000 synthetic customer rows with realistic, non-trivially-separable purchase/churn labels. | ~2s |
| `ml\training\train_basic.py` | Fits the shared preprocessing (scaler + encoders), trains `purchase_basic.keras` and `churn_basic.keras`, writes real metrics to `results/*.json` and TensorBoard logs to `logs/basic_model/`. | ~30-60s |
| `ml\training\train_optimized.py` | Trains the 5 Module 2 comparison models (Basic ANN, Dropout, L2, BatchNorm, Optimized) on the purchase target, saves each to `saved_models/`, logs to `logs/<name>_model/`, and writes results to the `model_experiments` table. | ~2-4 min |

## 4. Start the server

```bat
python app.py
```

On startup the app:
1. Creates `smartcart.db` and all tables if they don't exist.
2. Seeds demo data if the database is empty.
3. Backfills historical predictions using the now-trained models (if you
   ran the training commands above before this step).
4. Prints a clear warning — but does NOT auto-train — if models are missing.

The API is now running at **http://localhost:5000**. Health check:
`GET http://localhost:5000/api/health`.

## 5. Start the frontend

In a separate terminal:

```bat
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open **http://localhost:5173**. The frontend's `.env` already points
`VITE_API_URL` at `http://localhost:5000/api`.

## 6. TensorBoard (optional)

```bat
cd backend
tensorboard --logdir logs
```

Open **http://localhost:6006**. You'll see 5 runs: `basic_model`,
`dropout_model`, `l2_model`, `batchnorm_model`, `optimized_model`, each with
real training/validation loss and accuracy curves.

---

## 7. Demo credentials

| Role | Email | Password |
|---|---|---|
| Customer | `customer@demo.com` | `customer123` |
| Admin | `admin@demo.com` | `admin123` |

---

## 8. Project structure

```
backend/
├── app.py                     Flask entry point, blueprint registration, startup checks
├── config.py                  Central config (env vars, paths)
├── utils.py                   Response envelope helpers, admin_required decorator
├── requirements.txt
├── .env.example
│
├── database/
│   ├── db.py                  Shared SQLAlchemy instance
│   ├── app_context.py         Lightweight Flask app for standalone scripts
│   └── seed.py                 Demo data + historical prediction seeding
│
├── models/                    SQLAlchemy models ONLY
│   ├── user.py                 User (password hashing via Werkzeug)
│   ├── customer.py             Customer, CustomerBehavior
│   ├── product.py              Product
│   ├── prediction.py           Prediction
│   └── experiment.py           ModelExperiment
│
├── routes/                    Flask blueprints (thin - delegate to services/)
│   ├── auth.py, customers.py, products.py, predictions.py,
│   └── analytics.py, models.py, experiments.py, training.py
│
├── services/                  Business logic
│   ├── auth_service.py
│   ├── prediction_service.py   Loads models + preprocessing, runs inference
│   ├── analytics_service.py    Real DB aggregation for dashboards
│   ├── model_service.py        Reads results/*.json + model_experiments table
│   └── training_service.py     Synchronous training triggers
│
├── ml/                         ML code (NOT Flask, NOT SQLAlchemy)
│   ├── data/generate_dataset.py
│   ├── preprocessing/preprocess.py   Shared scaler/encoder fit+transform
│   ├── models/architectures.py       build_ann() - one function, every variant
│   ├── training/train_basic.py       Module 1 baseline models
│   ├── training/train_optimized.py   Module 2 comparison models (5 variants)
│   ├── evaluation/evaluate.py        accuracy/precision/recall/f1/auc/confusion matrix
│   └── utils/data_loader.py, tensorboard_utils.py
│
├── saved_models/               *.keras, scaler.joblib, encoders.joblib, feature_config.json
├── logs/                        TensorBoard logs (5 run directories)
└── results/                     *_metrics.json, model_comparison.json
```

---

## 9. API documentation

Base URL: `http://localhost:5000/api`

All responses use a consistent envelope:
```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

### Auth
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | - | `{name, email, password}` → `{token, user}` |
| POST | `/auth/login` | - | `{email, password}` → `{token, user}` |
| GET | `/auth/me` | JWT | Current user |
| POST | `/auth/logout` | JWT | Stateless - just tells the client to discard the token |

### Predictions (Module 1)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/predict/purchase` | optional | Purchase-only response shape |
| POST | `/predict/churn` | optional | Churn-only response shape |
| POST | `/predict/both` | optional | Combined - what the frontend actually uses |
| GET | `/predictions` | JWT | `?page=&limit=&search=&risk=&sort=` → paginated |
| GET | `/predictions/:id` | JWT | Single prediction |
| GET | `/customers/:id/predictions` | JWT | Paginated history for one customer |

If a valid customer JWT is supplied, the prediction is linked to (and
auto-creates, if needed) that user's `Customer` row. Admin ad hoc runs with
no customer context are stored with `customer_id = null` ("Guest").

### Customers
| Method | Path | Auth |
|---|---|---|
| GET | `/customers` | JWT |
| GET | `/customers/:id` | JWT |
| POST \| PUT \| DELETE | `/customers[/:id]` | Admin |
| GET | `/customers/statistics` | JWT |
| GET | `/customers/analytics` | JWT |

### Products
| Method | Path | Auth |
|---|---|---|
| GET | `/products` | - | `?search=&category=&max_price=&min_rating=&in_stock=&sort=` |
| GET | `/products/:id` | - |
| POST \| PUT \| DELETE | `/products[/:id]` | Admin |

### Analytics
| Method | Path | Auth |
|---|---|---|
| GET | `/analytics/dashboard?period=today\|7d\|30d\|90d` | JWT |
| GET | `/analytics/customers` | JWT |
| GET | `/analytics/purchases` | JWT |
| GET | `/analytics/churn` | JWT |
| GET | `/analytics/activity` | JWT |

### Models (Module 1 & 2)
| Method | Path | Auth |
|---|---|---|
| GET | `/models/metrics` | - | Basic ANN metrics + accuracy/loss curves |
| GET | `/models/comparison` | - | All 5 comparison models |
| GET | `/models/best` | - | Best model by validation accuracy |
| GET | `/models/training-history?experiment=` | - | Per-epoch curve for one model |
| GET | `/models/experiment-names` | - | Names available for the selector above |
| POST | `/models/train` | Admin | `{scope: "basic"\|"variants"}` - full retrain |
| GET | `/models/tensorboard` | - | Instructions/URL, not embedded |

### Experiments (Module 2 - hyperparameter tuning)
| Method | Path | Auth |
|---|---|---|
| POST | `/experiments/run` | Admin | `{learning_rate, batch_size, dropout, hidden_units, initialization}` |
| GET | `/experiments` | Admin | Ad hoc experiment history |

### Training
| Method | Path | Auth |
|---|---|---|
| POST | `/training/train` | Admin | `{scope: "basic"\|"variants"}` |

Training runs **synchronously**. With the 8,000-row dataset and the epoch
counts used here, even a full 5-model retrain finishes in well under a
minute on a normal CPU, so a background job queue would add real complexity
for no practical benefit in a project this size. The response's `status`
field (`"completed"` or `"failed"`) is what the frontend reads.

---

## 10. Testing examples (curl)

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"testpass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}'

# Get current user (replace $TOKEN)
curl http://localhost:5000/api/auth/me -H "Authorization: Bearer $TOKEN"

# Get products
curl http://localhost:5000/api/products

# Purchase prediction
curl -X POST http://localhost:5000/api/predict/purchase -H "Content-Type: application/json" -d '{
  "age": 22, "gender": "Male", "device_type": "Mobile", "browsing_time": 35, "pages_viewed": 18,
  "previous_purchases": 5, "average_order_value": 1500, "number_of_sessions": 8, "cart_additions": 4,
  "cart_abandonments": 1, "days_since_last_purchase": 8, "customer_lifetime_value": 7500,
  "discount_usage": 2, "support_interactions": 1
}'

# Churn prediction
curl -X POST http://localhost:5000/api/predict/churn -H "Content-Type: application/json" -d '{
  "age": 45, "gender": "Female", "device_type": "Desktop", "browsing_time": 3, "pages_viewed": 2,
  "previous_purchases": 0, "average_order_value": 40, "number_of_sessions": 1, "cart_additions": 1,
  "cart_abandonments": 1, "days_since_last_purchase": 120, "customer_lifetime_value": 40,
  "discount_usage": 0, "support_interactions": 4
}'

# Combined prediction
curl -X POST http://localhost:5000/api/predict/both -H "Content-Type: application/json" -d '{...}'

# Prediction history (admin token)
curl "http://localhost:5000/api/predictions?page=1&limit=10" -H "Authorization: Bearer $ADMIN_TOKEN"

# Customer analytics
curl http://localhost:5000/api/customers/analytics -H "Authorization: Bearer $ADMIN_TOKEN"

# Admin dashboard
curl "http://localhost:5000/api/analytics/dashboard?period=30d" -H "Authorization: Bearer $ADMIN_TOKEN"

# Model metrics / comparison
curl http://localhost:5000/api/models/metrics
curl http://localhost:5000/api/models/comparison

# Run a hyperparameter experiment (admin token)
curl -X POST http://localhost:5000/api/experiments/run -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"learning_rate":0.001,"batch_size":32,"dropout":0.3,"hidden_units":64,"initialization":"he"}'

# Get experiment history
curl http://localhost:5000/api/experiments -H "Authorization: Bearer $ADMIN_TOKEN"
```

A Postman collection isn't included, but every route above maps 1:1 to
these curl examples — import them into Postman manually if preferred.

---

## 11. Frontend integration — what changed and why

The frontend's `src/services/api.js` is the **only** file that talks to the
network. It now calls the real Flask endpoints first, and falls back to the
original mock data / `predictionSimulator.js` if the backend is unreachable
(logged to devtools console as a warning), so the demo still works if you
run the frontend standalone.

Files modified (see the diffs below the file list in this document, or just
diff against your original frontend):

1. **`src/services/api.js`** — full rewrite. Real axios calls to every
   endpoint above, with snake_case ↔ camelCase field mapping so every page
   component's expected data shape is unchanged. Falls back to mock data on
   network failure.
2. **`src/context/AuthContext.jsx`** — now persists the JWT (via
   `setAuthToken` in api.js) alongside the user object, and calls the real
   `/auth/logout` endpoint on logout.
3. **`src/pages/admin/AdminDashboard.jsx`** — previously imported
   `PRODUCTS` and `PREDICTION_HISTORY` directly from the mock data files to
   compute totals. Now calls the new `getAdminDashboard(period)` function,
   which hits `GET /analytics/dashboard` for real aggregated data.
4. **`src/pages/admin/ProductsManagement.jsx`** — previously only wrote to
   `localStorage`. Now calls `createProduct` / `updateProduct` /
   `deleteProduct` (real `POST`/`PUT`/`DELETE /products`), and only falls
   back to a local-only override if the backend call itself fails.
5. **`src/pages/admin/TrainingAnalytics.jsx`** — the mock experiment names
   (`'L2'`, `'BatchNorm'`, `'Optimized'`) don't match the real trained model
   names (`'L2 Regularization'`, `'Batch Normalization'`, `'Optimized
   Model'`). This page now fetches the real name list from the new
   `getExperimentNames()` (→ `GET /models/experiment-names`) instead of the
   static mock array, so the selector always matches what's actually in the
   database.
6. **`.env` / `.env.example`** (new) — `VITE_API_URL=http://localhost:5000/api`.

No other page or component needed changes — every other page already went
through `api.js` and simply started receiving real data once the functions
inside it were rewritten.

---

## 12. Testing checklist

- [ ] `python app.py` starts without errors and prints "Trained models found"
- [ ] `GET /api/health` returns `{"success": true, "data": {"models_trained": true}}`
- [ ] Register a new account via the frontend `/register` page
- [ ] Log in as `customer@demo.com` / `customer123` → redirected to `/dashboard`
- [ ] Log in as `admin@demo.com` / `admin123` → redirected to `/admin`
- [ ] Log out clears the session and redirects to `/`
- [ ] `/products` loads real products from the database, search/filter/sort all work
- [ ] `/predict` submits a real prediction and lands on `/predict/result` with live numbers
- [ ] `/predict/history` shows real historical predictions, search/filter work
- [ ] Admin `/admin` dashboard shows real totals and charts, date filter changes the prediction trend
- [ ] Admin `/admin/customers` shows the real 60 seeded customers with real purchase/churn probabilities
- [ ] Admin `/admin/model-performance` shows real Basic ANN metrics and real accuracy/loss curves
- [ ] Admin `/admin/model-comparison` shows all 5 real trained models, best one highlighted
- [ ] Admin `/admin/hyperparameter-tuning` → "Run Experiment" actually trains a small model (~10-20s) and appends a real row to the history table
- [ ] Admin `/admin/training-analytics` experiment selector matches the model comparison names; changing epoch range updates all 4 charts
- [ ] Admin `/admin/products` → Add/Edit/Delete a product persists after a page refresh (i.e. it hit the real backend, not just localStorage)
- [ ] Stopping the Flask server and reloading the frontend still works (mock-data fallback), with warnings in devtools console

---

## 13. Common Windows errors & fixes

**`'python' is not recognized as an internal or external command`**
Install Python 3.11/3.12 from python.org and make sure "Add python.exe to PATH" was checked during install. Restart the terminal afterward.

**`ModuleNotFoundError: No module named 'tensorflow'` (or any other package)**
The virtual environment isn't activated. Run `venv\Scripts\activate` first — you should see `(venv)` at the start of your prompt.

**`ERROR: Could not find a version that satisfies the requirement tensorflow-cpu==2.16.1`**
Your Python version is too new/old for this TensorFlow build. Use Python 3.11 or 3.12 specifically (TensorFlow 2.16 does not yet support 3.13).

**`OSError: [Errno 48] Address already in use` / `port 5000 already in use`**
Another process is using port 5000 (on macOS this is sometimes AirPlay Receiver). Either stop that process, or change `PORT` in `.env` and update `VITE_API_URL` in the frontend `.env` to match.

**Predictions return `503 MODEL_NOT_TRAINED`**
You started `python app.py` before running the training scripts. Stop the server, run the 4 setup commands from section 3, then restart `python app.py`.

**`sqlite3.OperationalError: no such table: users`**
This means `db.create_all()` ran before the `models` package was imported (every table needs its model class imported first). This is already handled correctly in `app.py` and `database/seed.py` — if you hit this while writing your own script, add `import models` before calling `db.create_all()`.

**Frontend shows data but it looks like the same numbers every time / doesn't change**
Check the browser devtools console for `[api] ... backend unavailable, using local mock data` warnings — this means the Flask server isn't reachable (not running, wrong port, or CORS origin mismatch) and the frontend has silently fallen back to mock data. Confirm `python app.py` is running and `frontend/.env`'s `VITE_API_URL` matches.

**CORS errors in the browser console**
Confirm the Flask server's `.env` has `CORS_ORIGINS=http://localhost:5173` (must match the Vite dev server's actual origin/port exactly, no trailing slash).

**Training scripts are very slow / seem stuck**
The first run of any TensorFlow script pays a one-time ~15-25 second import cost while TensorFlow initializes CPU instructions — this is normal and only happens once per process, not once per epoch.

**`numpy.dtype size changed` / binary incompatibility errors**
Your installed numpy/scipy versions drifted from the pinned versions in `requirements.txt` (likely because another package pulled in a newer version). Run `pip install -r requirements.txt --force-reinstall` inside the activated venv to restore the exact pinned versions.
