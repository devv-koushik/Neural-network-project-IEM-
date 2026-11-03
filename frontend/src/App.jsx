import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';

// Public pages
import Landing from './pages/public/Landing';
import Products from './pages/public/Products';
import ProductDetails from './pages/public/ProductDetails';
import Login from './pages/public/Login';
import Register from './pages/public/Register';

// Customer pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerProducts from './pages/customer/CustomerProducts';
import AIPrediction from './pages/customer/AIPrediction';
import PredictionResult from './pages/customer/PredictionResult';
import PredictionHistory from './pages/customer/PredictionHistory';
import Profile from './pages/customer/Profile';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomerAnalytics from './pages/admin/CustomerAnalytics';
import AdminPurchasePrediction from './pages/admin/AdminPurchasePrediction';
import AdminChurnPrediction from './pages/admin/AdminChurnPrediction';
import ModelPerformance from './pages/admin/ModelPerformance';
import ModelComparison from './pages/admin/ModelComparison';
import HyperparameterTuning from './pages/admin/HyperparameterTuning';
import TrainingAnalytics from './pages/admin/TrainingAnalytics';
import ProductsManagement from './pages/admin/ProductsManagement';

// Future modules
import FutureModulesHub from './pages/future/FutureModulesHub';
import VisualRecognition from './pages/future/VisualRecognition';
import DemandForecasting from './pages/future/DemandForecasting';
import GenerativeAI from './pages/future/GenerativeAI';

import NotFound from './pages/public/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Customer */}
      <Route path="/dashboard" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/customer/products" element={<ProtectedRoute role="customer"><CustomerProducts /></ProtectedRoute>} />
      <Route path="/predict" element={<ProtectedRoute role="customer"><AIPrediction /></ProtectedRoute>} />
      <Route path="/predict/result" element={<ProtectedRoute role="customer"><PredictionResult /></ProtectedRoute>} />
      <Route path="/predict/history" element={<ProtectedRoute role="customer"><PredictionHistory /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute role="customer"><Profile /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/customers" element={<ProtectedRoute role="admin"><CustomerAnalytics /></ProtectedRoute>} />
      <Route path="/admin/purchase-prediction" element={<ProtectedRoute role="admin"><AdminPurchasePrediction /></ProtectedRoute>} />
      <Route path="/admin/churn-prediction" element={<ProtectedRoute role="admin"><AdminChurnPrediction /></ProtectedRoute>} />
      <Route path="/admin/model-performance" element={<ProtectedRoute role="admin"><ModelPerformance /></ProtectedRoute>} />
      <Route path="/admin/model-comparison" element={<ProtectedRoute role="admin"><ModelComparison /></ProtectedRoute>} />
      <Route path="/admin/hyperparameter-tuning" element={<ProtectedRoute role="admin"><HyperparameterTuning /></ProtectedRoute>} />
      <Route path="/admin/training-analytics" element={<ProtectedRoute role="admin"><TrainingAnalytics /></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute role="admin"><ProductsManagement /></ProtectedRoute>} />
      <Route path="/admin/future-modules" element={<ProtectedRoute role="admin"><FutureModulesHub /></ProtectedRoute>} />
      <Route path="/admin/future-modules/visual-recognition" element={<ProtectedRoute role="admin"><VisualRecognition /></ProtectedRoute>} />
      <Route path="/admin/future-modules/demand-forecasting" element={<ProtectedRoute role="admin"><DemandForecasting /></ProtectedRoute>} />
      <Route path="/admin/future-modules/generative-ai" element={<ProtectedRoute role="admin"><GenerativeAI /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
