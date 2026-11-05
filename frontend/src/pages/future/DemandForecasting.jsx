import { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  TrendingUp,
  AlertTriangle,
  Package,
  Calendar,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DashboardLayout } from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import StatCard from '../../components/dashboard/StatCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import {
  getForecastingProducts,
  predictDemandForecast,
  getForecastingHistory,
} from '../../services/api';

export default function DemandForecasting() {
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [horizon, setHorizon] = useState(7);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [forecasting, setForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [prodsData, histData] = await Promise.allSettled([
        getForecastingProducts(),
        getForecastingHistory(1, 8),
      ]);
      if (prodsData.status === 'fulfilled' && prodsData.value.length > 0) {
        setProducts(prodsData.value);
        setSelectedProduct(prodsData.value[0].name);
        // Automatically run initial forecast for first product
        runForecast(prodsData.value[0].name, 7);
      }
      if (histData.status === 'fulfilled') {
        setHistory(histData.value.items || []);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoadingProducts(false);
      setLoadingHistory(false);
    }
  }

  async function runForecast(prodName, days) {
    if (!prodName) return;
    setForecasting(true);
    try {
      const result = await predictDemandForecast({
        productName: prodName,
        forecastDays: days,
      });
      setForecastResult(result);
      // Refresh history table
      getForecastingHistory(1, 8).then((h) => setHistory(h.items || []));
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Forecasting model failed. Ensure the Flask server is running.';
      showToast(msg, 'error');
    } finally {
      setForecasting(false);
    }
  }

  function handleForecastSubmit(e) {
    e.preventDefault();
    runForecast(selectedProduct, horizon);
  }

  // Prepare combined timeline dataset for Recharts:
  // last 14 days of actual sales + future days of predicted sales
  const chartData = [];
  if (forecastResult) {
    // 1. Historical actuals
    (forecastResult.actual_history || []).slice(-14).forEach((h) => {
      chartData.push({
        date: h.date.slice(5),
        actual: h.actual_quantity,
        predicted: null,
        lower: null,
        upper: null,
      });
    });

    // 2. Forecast connection point
    if (chartData.length > 0 && (forecastResult.forecast_data || []).length > 0) {
      const lastActual = chartData[chartData.length - 1];
      lastActual.predicted = lastActual.actual;
    }

    // 3. Future predicted
    (forecastResult.forecast_data || []).forEach((f) => {
      chartData.push({
        date: f.date.slice(5),
        actual: null,
        predicted: f.predicted_quantity,
        lower: f.lower_bound,
        upper: f.upper_bound,
      });
    });
  }

  return (
    <DashboardLayout
      role="admin"
      title="Demand & Sales Forecasting"
      subtitle="Recurrent Neural Network (LSTM) multi-step product demand forecasting and inventory optimization"
    >
      {/* Top Banner Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 mb-6 rounded-2xl bg-signal-500/10 border border-signal-500/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-500 text-white shadow-sm">
            <LineChartIcon size={20} />
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-ink-800 dark:text-white">
              LSTM Recurrent Neural Network
            </h4>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Time-series lookback model with chronological train/validation splits, MAE/MAPE validation, and stockout warning triggers.
            </p>
          </div>
        </div>
        <Badge tone="mint">Model Active</Badge>
      </div>

      {/* Control Bar: Product & Horizon Selection */}
      <Card className="p-5 mb-6">
        <form onSubmit={handleForecastSubmit} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1.5">
              Select Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              disabled={loadingProducts || forecasting}
              className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 px-3.5 py-2.5 text-sm text-ink-800 dark:text-white focus:border-signal-500 focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.category}) — Stock: {p.current_stock}
                </option>
              ))}
            </select>
          </div>

          <div className="w-48">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1.5">
              Forecast Horizon
            </label>
            <div className="flex rounded-xl bg-ink-100 dark:bg-ink-800 p-1">
              <button
                type="button"
                onClick={() => setHorizon(7)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  horizon === 7 ? 'bg-white dark:bg-ink-900 shadow-sm text-signal-600' : 'text-ink-400'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setHorizon(30)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  horizon === 30 ? 'bg-white dark:bg-ink-900 shadow-sm text-signal-600' : 'text-ink-400'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            icon={Sparkles}
            loading={forecasting}
            disabled={!selectedProduct}
          >
            Run LSTM Forecast
          </Button>
        </form>
      </Card>

      {/* Warnings & Alerts */}
      {forecastResult?.warnings?.length > 0 && (
        <div className="mb-6 space-y-3">
          {forecastResult.warnings.map((w, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                w.severity === 'high'
                  ? 'bg-coral-500/10 border-coral-500/30 text-coral-600 dark:text-coral-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              }`}
            >
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-xs tracking-wide uppercase">{w.title}</h5>
                <p className="text-xs mt-0.5">{w.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          label={`Projected ${horizon}-Day Demand`}
          value={forecastResult ? `${forecastResult.total_projected_demand} units` : '—'}
          icon={TrendingUp}
          tone="signal"
          trend={`${horizon}-day window`}
          trendDirection="up"
        />
        <StatCard
          label="Estimated Revenue"
          value={forecastResult ? `$${forecastResult.total_projected_revenue?.toLocaleString()}` : '—'}
          icon={Package}
          tone="mint"
          trend="Projected gross"
          trendDirection="up"
        />
        <StatCard
          label="Current Stock"
          value={forecastResult ? `${forecastResult.current_stock} units` : '—'}
          icon={Calendar}
          tone={
            forecastResult && forecastResult.total_projected_demand > forecastResult.current_stock
              ? 'coral'
              : 'amber'
          }
          trend={
            forecastResult && forecastResult.total_projected_demand > forecastResult.current_stock
              ? 'Shortage Alert'
              : 'Inventory Adequate'
          }
          trendDirection="down"
        />
        <StatCard
          label="Model Test MAPE"
          value={forecastResult?.metrics?.mape != null ? `${forecastResult.metrics.mape}%` : '—'}
          icon={LineChartIcon}
          tone="mint"
          trend={forecastResult?.metrics?.mae != null ? `MAE: ${forecastResult.metrics.mae}` : 'Baseline / Pending'}
          trendDirection={forecastResult?.metrics?.mape != null ? 'up' : 'neutral'}
        />
      </div>

      {/* Interactive actual-versus-predicted Chart */}
      <Card className="p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-display text-base font-semibold text-ink-800 dark:text-white">
              Actual Sales vs. LSTM Demand Forecast
            </h3>
            <p className="text-xs text-ink-400 mt-0.5">
              14 days of recorded daily purchases transitioning to future predicted demand with 95% confidence envelope
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-ink-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#5B6EF5]" /> Actual Sales
            </span>
            <span className="flex items-center gap-1.5 text-ink-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2BD9A8]" /> Forecasted Demand
            </span>
          </div>
        </div>

        {forecasting ? (
          <div className="h-72 flex items-center justify-center">
            <LoadingSpinner label="Running LSTM sequence prediction..." />
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2BD9A8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2BD9A8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }}
                  formatter={(value, name) => [
                    `${value} units`,
                    name === 'actual' ? 'Actual Sales' : name === 'predicted' ? 'Predicted Demand' : name,
                  ]}
                />
                <Area type="monotone" dataKey="upper" fill="transparent" stroke="none" />
                <Area type="monotone" dataKey="lower" fill="transparent" stroke="none" />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#5B6EF5"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  name="actual"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#2BD9A8"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 4 }}
                  name="predicted"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-xs text-ink-400">
            Select a product and click Run LSTM Forecast to generate demand curve.
          </div>
        )}
      </Card>

      {/* Recent Forecast History Table */}
      <Card className="p-6">
        <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-4">
          Recent Forecast Runs
        </h3>
        {loadingHistory ? (
          <LoadingSpinner label="Loading past forecasts..." className="py-6" />
        ) : history.length === 0 ? (
          <p className="text-xs text-ink-400 py-6 text-center">No stored forecast records.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800 text-ink-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Horizon</th>
                  <th className="py-3 px-3">Model</th>
                  <th className="py-3 px-3">MAE</th>
                  <th className="py-3 px-3">MAPE</th>
                  <th className="py-3 px-3">Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-850/50">
                    <td className="py-2.5 px-3 font-medium text-ink-800 dark:text-white">
                      {h.product_name}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge tone="signal">{h.forecast_period} Days</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-ink-600 dark:text-ink-300 font-mono">
                      {h.model_type}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-ink-700 dark:text-ink-200">
                      {h.metrics?.mae ?? '—'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-ink-700 dark:text-ink-200">
                      {h.metrics?.mape ? `${h.metrics.mape}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-ink-400">
                      {h.created_at ? new Date(h.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
