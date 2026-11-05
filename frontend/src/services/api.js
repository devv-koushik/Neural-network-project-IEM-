// ---------------------------------------------------------------------------
// API SERVICE LAYER — connected to the Flask backend.
//
// Every function below calls the real backend first. If the backend is
// unreachable (e.g. you're running the frontend standalone, or the Flask
// server isn't started), each function falls back to the original local
// mock data / predictionSimulator so the UI still works for a quick demo.
// A console.warn is logged whenever a fallback is used so it's obvious in
// devtools which mode you're in.
//
// Base URL comes from VITE_API_URL (see frontend/.env). No component or
// page should ever hardcode an API URL — they all go through this file.
// ---------------------------------------------------------------------------
import axios from 'axios';
import { PRODUCTS, getProductById } from '../data/products';
import { CUSTOMERS, getCustomerStats, AGE_DISTRIBUTION, CHURN_DISTRIBUTION, CUSTOMER_GROWTH } from '../data/customers';
import { PREDICTION_HISTORY } from '../data/predictions';
import { BASIC_ANN_METRICS, TRAIN_VS_VAL_ACCURACY, TRAIN_VS_VAL_LOSS, MODEL_COMPARISON } from '../data/modelMetrics';
import { TRAINING_HISTORY, EXPERIMENT_NAMES } from '../data/trainingData';
import { INITIAL_EXPERIMENT_HISTORY, runExperimentSimulation } from '../data/experiments';
import {
  Headphones, Watch, Shirt, Footprints, Sofa, Sparkles, Smartphone, Camera, Laptop, Backpack, Glasses, Gamepad2, Package,
} from 'lucide-react';

export const TOKEN_STORAGE_KEY = 'sc_auth_token';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// Attach the JWT (if present) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function warnFallback(fnName, error) {
  // eslint-disable-next-line no-console
  console.warn(`[api] ${fnName}: backend unavailable, using local mock data.`, error?.message || error);
}

const DEMO_ACCOUNTS = {
  'customer@demo.com': { password: 'customer123', role: 'customer', name: 'Pritam Customer', id: 'demo_customer' },
  'admin@demo.com': { password: 'admin123', role: 'admin', name: 'Koushik Admin', id: 'demo_admin' },
};

// A category -> icon fallback for products coming from the backend, which
// only stores an image_url string (no bundled Lucide icon reference).
const CATEGORY_ICON = {
  Electronics: Smartphone, Fashion: Shirt, Shoes: Footprints, Accessories: Backpack,
  Home: Sofa, Beauty: Sparkles,
};
const NAME_ICON_HINTS = [
  [/headphone/i, Headphones], [/watch/i, Watch], [/camera/i, Camera], [/laptop|ultrabook/i, Laptop],
  [/sunglasses|glasses/i, Glasses], [/controller|gamepad/i, Gamepad2], [/backpack/i, Backpack],
];

const DATASET_PRODUCT_IMAGES = {
  'Aurora Wireless ANC Headphones': '/dataset/Electronics/electronics_001.jpg',
  'Pulse Fitness Smartwatch': '/dataset/Electronics/electronics_002.jpg',
  'Nimbus Merino Wool Sweater': '/dataset/Shirts/shirts_001.jpg',
  'Strato Trail Running Shoes': '/dataset/Shoes/shoes_001.jpg',
  'Voyage Leather Backpack': '/dataset/Bags/bags_001.jpg',
  'Haven Bouclé Accent Chair': '/dataset/Other/other_001.jpg',
  'Haven Boucle Accent Chair': '/dataset/Other/other_001.jpg',
  'Lumen Vitamin C Serum': '/dataset/Other/other_002.jpg',
  'Halo 5G Smartphone': '/dataset/Electronics/electronics_003.jpg',
  'Aperture Mirrorless Camera': '/dataset/Electronics/electronics_005.jpg',
  'Compile 14" Ultrabook': '/dataset/Electronics/electronics_004.jpg',
  'Meridian Polarized Sunglasses': '/dataset/Accessories/accessories_003.jpg',
  'Sequence Pro Controller': '/dataset/Electronics/electronics_006.jpg',
  'Drift Canvas Sneakers': '/dataset/Shoes/shoes_002.jpg',
  'Solace Weighted Blanket': '/dataset/Other/other_005.jpg',
  'Quartz Mineral Sunscreen': '/dataset/Other/other_004.jpg',
  'Alpine Tailored Wool Coat': '/dataset/Shirts/shirts_002.jpg',
};

const CATEGORY_DATASET_DEFAULTS = {
  Electronics: '/dataset/Electronics/electronics_001.jpg',
  Shoes: '/dataset/Shoes/shoes_001.jpg',
  Fashion: '/dataset/Shirts/shirts_001.jpg',
  Accessories: '/dataset/Accessories/accessories_003.jpg',
  Home: '/dataset/Other/other_001.jpg',
  Beauty: '/dataset/Other/other_002.jpg',
};

function iconForProduct(p) {
  const hint = NAME_ICON_HINTS.find(([re]) => re.test(p.name || ''));
  if (hint) return hint[1];
  return CATEGORY_ICON[p.category] || Package;
}

function mapProduct(p) {
  const resolvedImage =
    p.image_url ||
    p.imageUrl ||
    DATASET_PRODUCT_IMAGES[p.name] ||
    CATEGORY_DATASET_DEFAULTS[p.category] ||
    null;

  return {
    id: String(p.id),
    name: p.name,
    category: p.category,
    price: p.price,
    rating: p.rating,
    reviews: p.reviews,
    stock: p.stock,
    image: iconForProduct(p),
    imageUrl: resolvedImage,
    color: p.color || '#5B6EF5',
    description: p.description,
    featured: !!p.featured,
    tags: p.tags || [],
  };
}

// ----------------------------- AUTH -----------------------------
export async function loginUser({ email, password }) {
  try {
    const { data } = await apiClient.post('/auth/login', { email, password });
    setAuthToken(data.data.token);
    return data.data.user;
  } catch (error) {
    warnFallback('loginUser', error);
    await delay(400);
    const account = DEMO_ACCOUNTS[email?.toLowerCase()];
    if (!account || account.password !== password) {
      const err = new Error('Invalid email or password.');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }
    setAuthToken(null); // no real JWT available offline; requests needing auth will also fall back
    return { id: account.id, email, name: account.name, role: account.role };
  }
}

export async function registerUser({ name, email, password }) {
  try {
    const { data } = await apiClient.post('/auth/register', { name, email, password });
    setAuthToken(data.data.token);
    return data.data.user;
  } catch (error) {
    warnFallback('registerUser', error);
    await delay(400);
    setAuthToken(null);
    return { id: `u_${Date.now()}`, name, email, role: 'customer' };
  }
}

export async function logoutUser() {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // stateless JWT - nothing to do server-side even if this fails
  } finally {
    setAuthToken(null);
  }
}

export async function getCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data.data.user;
}

export async function updateProfile({ name, email }) {
  const { data } = await apiClient.put('/auth/profile', { name, email });
  return data.data.user;
}

export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await apiClient.put('/auth/password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data.data;
}

// ----------------------------- PRODUCTS -----------------------------
export async function getProducts() {
  try {
    const { data } = await apiClient.get('/products');
    return data.data.map(mapProduct);
  } catch (error) {
    warnFallback('getProducts', error);
    await delay(300);
    return PRODUCTS;
  }
}

export async function getProduct(id) {
  try {
    const { data } = await apiClient.get(`/products/${id}`);
    return mapProduct(data.data);
  } catch (error) {
    warnFallback('getProduct', error);
    await delay(250);
    return getProductById(id);
  }
}

export async function createProduct(product) {
  const { data } = await apiClient.post('/products', {
    name: product.name, category: product.category, price: Number(product.price),
    stock: Number(product.stock) || 0, rating: Number(product.rating) || 4.5,
    description: product.description, featured: !!product.featured,
  });
  return mapProduct(data.data);
}

export async function updateProduct(id, product) {
  const { data } = await apiClient.put(`/products/${id}`, {
    name: product.name, category: product.category, price: Number(product.price),
    stock: Number(product.stock), rating: Number(product.rating), description: product.description,
  });
  return mapProduct(data.data);
}

export async function deleteProduct(id) {
  await apiClient.delete(`/products/${id}`);
  return true;
}

export async function checkoutOrder(orderData) {
  try {
    const { data } = await apiClient.post('/products/checkout', orderData);
    return data.data;
  } catch (error) {
    warnFallback('checkoutOrder', error);
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return {
      order_id: orderId,
      status: 'confirmed',
      items: orderData.items,
      total_amount: orderData.items.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0),
      shipping: orderData.shipping || {},
      payment_method: orderData.payment_method || 'Credit Card',
      estimated_delivery: '3-4 business days',
      created_at: new Date().toISOString(),
      message: 'Order successfully placed!',
    };
  }
}

// ----------------------------- CUSTOMER ANALYTICS -----------------------------
export async function getCustomerStatsApi() {
  try {
    const { data } = await apiClient.get('/customers/statistics');
    return {
      totalCustomers: data.data.total_customers,
      avgPurchaseProbability: data.data.avg_purchase_probability,
      highChurnRisk: data.data.high_churn_risk,
    };
  } catch (error) {
    warnFallback('getCustomerStatsApi', error);
    await delay(300);
    return getCustomerStats();
  }
}

export async function getCustomers() {
  try {
    const { data } = await apiClient.get('/customers');
    return data.data.map((c) => ({
      id: String(c.id),
      name: c.name,
      email: c.email,
      age: c.age,
      gender: c.gender,
      device: c.device_type,
      purchases: c.previous_purchases ?? 0,
      sessions: c.number_of_sessions ?? 0,
      browsingMinutes: c.browsing_time ?? 0,
      cartAdds: c.cart_additions ?? 0,
      cartAbandons: c.cart_abandonments ?? 0,
      daysSinceLastPurchase: c.days_since_last_purchase ?? 0,
      clv: c.customer_lifetime_value ?? 0,
      engagement: c.engagement_score ?? 0,
      purchaseProbability: c.purchase_probability ?? 0,
      churnProbability: c.churn_probability ?? 0,
      churnRisk: c.churn_risk ?? 'Low',
      joined: c.created_at,
    }));
  } catch (error) {
    warnFallback('getCustomers', error);
    await delay(350);
    return CUSTOMERS;
  }
}

export async function getCustomerAnalytics() {
  try {
    const { data } = await apiClient.get('/customers/analytics');
    return {
      ageDistribution: data.data.age_distribution,
      churnDistribution: data.data.churn_distribution,
      customerGrowth: data.data.customer_growth,
    };
  } catch (error) {
    warnFallback('getCustomerAnalytics', error);
    await delay(350);
    return { ageDistribution: AGE_DISTRIBUTION, churnDistribution: CHURN_DISTRIBUTION, customerGrowth: CUSTOMER_GROWTH };
  }
}

// New: powers the Admin Dashboard directly (see AdminDashboard.jsx).
export async function getAdminDashboard(period = '30d') {
  try {
    const { data } = await apiClient.get('/analytics/dashboard', { params: { period } });
    const d = data.data;
    return {
      totalCustomers: d.total_customers,
      totalPredictions: d.total_predictions,
      avgPurchaseProbability: d.avg_purchase_probability,
      highChurnRisk: d.high_churn_risk,
      bestModelAccuracy: d.best_model_accuracy,
      activeProducts: d.active_products,
      customerGrowth: d.customer_growth,
      predictionTrend: d.prediction_trend,
      purchaseDistribution: d.purchase_distribution,
      churnDistribution: d.churn_distribution,
    };
  } catch (error) {
    warnFallback('getAdminDashboard', error);
    throw error; // Let AdminDashboard.jsx's .catch(() => setError(true)) handle it
  }
}

// ----------------------------- PREDICTIONS -----------------------------
// Converts the camelCase fields used by the prediction forms into the
// snake_case payload the Flask API expects.
function toBackendPayload(input) {
  return {
    age: input.age,
    gender: input.gender,
    device_type: input.device,
    browsing_time: input.browsingTime,
    pages_viewed: input.pagesViewed,
    previous_purchases: input.previousPurchases,
    average_order_value: input.avgOrderValue,
    number_of_sessions: input.sessions,
    cart_additions: input.cartAdditions,
    cart_abandonments: input.cartAbandonments,
    days_since_last_purchase: input.daysSinceLastPurchase,
    customer_lifetime_value: input.clv,
    discount_usage: input.discountUsage,
    support_interactions: input.supportInteractions,
  };
}

function mapCombinedResult(data) {
  return {
    purchaseProbability: data.purchase.probability,
    purchaseLabel: data.purchase.prediction,
    churnProbability: data.churn.probability,
    churnRisk: `${data.churn.risk} Risk`,
    confidence: Math.round(data.confidence * 100),
    engagementScore: data.engagement_score,
    factors: { positive: data.factors.positive, risk: data.factors.negative },
    insights: Array.isArray(data.insights) ? data.insights.join(' ') : data.insights,
  };
}

// Used by AIPrediction.jsx and AdminPurchasePrediction.jsx - returns BOTH
// purchase and churn results in one call, matching the original simulator's
// combined shape (see src/utils/predictionSimulator.js).
export async function predictPurchase(payload) {
  try {
    const { data } = await apiClient.post('/predict/both', toBackendPayload(payload));
    return mapCombinedResult(data.data);
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Prediction service error';
    console.error('[api] predictPurchase error:', message);
    throw new Error(message);
  }
}

export async function predictChurn(payload) {
  try {
    const { data } = await apiClient.post('/predict/both', toBackendPayload(payload));
    return mapCombinedResult(data.data);
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Prediction service error';
    console.error('[api] predictChurn error:', message);
    throw new Error(message);
  }
}

export async function getPredictionHistory() {
  try {
    const { data } = await apiClient.get('/predictions', { params: { limit: 100 } });
    return data.data.data.map((p) => ({
      id: String(p.id),
      customerId: p.customer_id ? String(p.customer_id) : null,
      customerName: p.customer_name,
      date: p.date,
      purchaseProbability: p.purchase_probability,
      purchaseResult: p.purchase_prediction,
      churnProbability: p.churn_probability,
      churnRisk: p.churn_risk,
      confidence: Math.round(p.confidence * 100),
    }));
  } catch (error) {
    warnFallback('getPredictionHistory', error);
    await delay(300);
    return PREDICTION_HISTORY;
  }
}

// ----------------------------- MODELS -----------------------------
export async function getModelMetrics() {
  try {
    const { data } = await apiClient.get('/models/metrics');
    const d = data.data;
    return {
      basicAnn: {
        name: 'Basic ANN', accuracy: d.basic_ann.accuracy, precision: d.basic_ann.precision,
        recall: d.basic_ann.recall, f1: d.basic_ann.f1, auc: d.basic_ann.auc,
      },
      accuracyHistory: d.accuracy_history.map((h) => ({ epoch: h.epoch, trainAcc: h.train_acc, valAcc: h.val_acc })),
      lossHistory: d.loss_history.map((h) => ({ epoch: h.epoch, trainLoss: h.train_loss, valLoss: h.val_loss })),
    };
  } catch (error) {
    warnFallback('getModelMetrics', error);
    await delay(300);
    return { basicAnn: BASIC_ANN_METRICS, accuracyHistory: TRAIN_VS_VAL_ACCURACY, lossHistory: TRAIN_VS_VAL_LOSS };
  }
}

export async function getModelComparison() {
  try {
    const { data } = await apiClient.get('/models/comparison');
    return data.data.map((m) => ({
      model: m.model, accuracy: m.accuracy, valAccuracy: m.val_accuracy,
      precision: m.precision, recall: m.recall, f1: m.f1, auc: m.auc, status: m.status,
    }));
  } catch (error) {
    warnFallback('getModelComparison', error);
    await delay(300);
    return MODEL_COMPARISON;
  }
}

// Real experiment names come from the trained model_experiments table, which
// uses full names ("L2 Regularization", "Batch Normalization", "Optimized
// Model") rather than the short mock keys in data/trainingData.js. Fetching
// this list dynamically (see TrainingAnalytics.jsx) keeps the experiment
// selector in sync with whatever was actually trained.
export async function getExperimentNames() {
  try {
    const { data } = await apiClient.get('/models/experiment-names');
    if (!data.data || data.data.length === 0) throw new Error('empty experiment name list');
    return data.data;
  } catch (error) {
    warnFallback('getExperimentNames', error);
    await delay(200);
    return EXPERIMENT_NAMES;
  }
}

export async function getBestModel() {
  try {
    const { data } = await apiClient.get('/models/best');
    return data.data;
  } catch (error) {
    warnFallback('getBestModel', error);
    return null;
  }
}

export async function getTrainingHistory(experiment) {
  try {
    const { data } = await apiClient.get('/models/training-history', { params: { experiment } });
    if (!data.data || data.data.length === 0) throw new Error('empty training history');
    return data.data;
  } catch (error) {
    warnFallback('getTrainingHistory', error);
    await delay(250);
    return TRAINING_HISTORY[experiment] || TRAINING_HISTORY['Basic ANN'];
  }
}

export async function getExperiments() {
  try {
    const { data } = await apiClient.get('/experiments');
    return data.data.map((e) => ({
      id: e.id, learningRate: e.learning_rate, batchSize: e.batch_size, dropout: e.dropout,
      hiddenUnits: e.hidden_units, initialization: e.initialization, accuracy: e.accuracy,
      valAccuracy: e.val_accuracy, f1: e.f1, loss: e.loss, timestamp: e.timestamp,
    }));
  } catch (error) {
    warnFallback('getExperiments', error);
    await delay(250);
    return INITIAL_EXPERIMENT_HISTORY;
  }
}

export async function runExperiment(params) {
  try {
    const { data } = await apiClient.post('/experiments/run', {
      learning_rate: params.learningRate, batch_size: params.batchSize, dropout: params.dropout,
      hidden_units: params.hiddenUnits, initialization: params.initialization,
    });
    return { accuracy: data.data.accuracy, valAccuracy: data.data.validation_accuracy, f1: data.data.f1, loss: data.data.loss };
  } catch (error) {
    warnFallback('runExperiment', error);
    await delay(900);
    return runExperimentSimulation(params);
  }
}

export async function trainModels(scope = 'basic') {
  const { data } = await apiClient.post('/training/train', { scope });
  return data.data;
}

// ----------------------------- MODULE 3: VISUAL RECOGNITION -----------------------------
export async function predictVisualImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await apiClient.post('/visual-recognition/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function getVisualHistory(page = 1, limit = 10) {
  const { data } = await apiClient.get('/visual-recognition/history', { params: { page, limit } });
  return data.data;
}

export async function getVisualStatus() {
  const { data } = await apiClient.get('/visual-recognition/status');
  return data.data;
}

// ----------------------------- MODULE 4: DEMAND FORECASTING -----------------------------
export async function getForecastingProducts() {
  const { data } = await apiClient.get('/forecasting/products');
  return data.data;
}

export async function predictDemandForecast({ productName, forecastDays = 7 }) {
  const { data } = await apiClient.post('/forecasting/predict', {
    product_name: productName,
    forecast_days: forecastDays,
  });
  return data.data;
}

export async function getForecastingHistory(page = 1, limit = 10) {
  const { data } = await apiClient.get('/forecasting/history', { params: { page, limit } });
  return data.data;
}

export async function trainForecastingModel(epochs = 15) {
  const { data } = await apiClient.post('/forecasting/train', { epochs });
  return data.data;
}

// ----------------------------- MODULE 5: GENERATIVE AI -----------------------------
export async function generateSyntheticData({ source = 'customers', numRecords = 100 }) {
  const { data } = await apiClient.post('/generative/synthetic-data/generate', {
    source,
    num_records: numRecords,
  });
  return data.data;
}

export async function getSyntheticDataHistory(page = 1, limit = 10) {
  const { data } = await apiClient.get('/generative/synthetic-data/history', { params: { page, limit } });
  return data.data;
}

export async function generateProductDescription({ productName, category, price, specifications }) {
  const { data } = await apiClient.post('/generative/product-description', {
    product_name: productName,
    category,
    price: Number(price),
    specifications,
  });
  return data.data;
}

export async function getDescriptionHistory(page = 1, limit = 10) {
  const { data } = await apiClient.get('/generative/product-description/history', { params: { page, limit } });
  return data.data;
}

export async function generateSalesReport() {
  const { data } = await apiClient.post('/generative/sales-report');
  return data.data;
}
