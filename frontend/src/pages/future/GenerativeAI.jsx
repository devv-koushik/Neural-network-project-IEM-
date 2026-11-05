import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Wand2,
  Database,
  FileText,
  Download,
  Sparkles,
  BarChart2,
  Copy,
  Check,
  RefreshCw,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import {
  generateSyntheticData,
  getSyntheticDataHistory,
  generateProductDescription,
  getDescriptionHistory,
  generateSalesReport,
} from '../../services/api';

export default function GenerativeAI({ initialTab }) {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const getTargetTab = () => {
    if (initialTab) return initialTab;
    if (location.pathname.includes('content') || location.pathname.includes('report') || location.pathname.includes('description')) {
      return 'content';
    }
    return 'synthetic';
  };

  const [activeTab, setActiveTab] = useState(getTargetTab);

  useEffect(() => {
    setActiveTab(getTargetTab());
  }, [location.pathname, initialTab]);

  // --- Feature A: Synthetic Data State ---
  const [synSource, setSynSource] = useState('customers');
  const [synCount, setSynCount] = useState(100);
  const [generatingSyn, setGeneratingSyn] = useState(false);
  const [synResult, setSynResult] = useState(null);
  const [synHistory, setSynHistory] = useState([]);
  const [loadingSynHistory, setLoadingSynHistory] = useState(true);

  // --- Feature B: AI Content State ---
  const [prodName, setProdName] = useState('Apex Active Wireless Earbuds');
  const [prodCategory, setProdCategory] = useState('Electronics');
  const [prodPrice, setProdPrice] = useState(129.99);
  const [prodSpecs, setProdSpecs] = useState('Bluetooth 5.3, 40hr battery, Active Noise Cancellation, IPX7 waterproof');
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [currentDesc, setCurrentDesc] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // --- Executive Sales Report State ---
  const [generatingReport, setGeneratingReport] = useState(false);
  const [salesReportText, setSalesReportText] = useState(null);

  useEffect(() => {
    loadHistories();
  }, []);

  async function loadHistories() {
    try {
      const data = await getSyntheticDataHistory(1, 10);
      setSynHistory(data.items || []);
    } catch {
      // Ignored
    } finally {
      setLoadingSynHistory(false);
    }
  }

  async function handleGenerateSynthetic(e) {
    e.preventDefault();
    setGeneratingSyn(true);
    try {
      const data = await generateSyntheticData({
        source: synSource,
        numRecords: synCount,
      });
      setSynResult(data);
      showToast(`Successfully generated ${data.job?.num_records} synthetic records (Quality Score: ${(data.quality_score * 100).toFixed(1)}%)`, 'success');
      loadHistories();
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Synthetic data generation failed.';
      showToast(msg, 'error');
    } finally {
      setGeneratingSyn(false);
    }
  }

  async function handleGenerateDescription(e) {
    e.preventDefault();
    setGeneratingDesc(true);
    try {
      const data = await generateProductDescription({
        productName: prodName,
        category: prodCategory,
        price: prodPrice,
        specifications: prodSpecs,
      });
      setCurrentDesc(data);
      showToast('AI product descriptions generated!', 'success');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Content generation failed.';
      showToast(msg, 'error');
    } finally {
      setGeneratingDesc(false);
    }
  }

  async function handleGenerateReport() {
    setGeneratingReport(true);
    try {
      const data = await generateSalesReport();
      setSalesReportText(data.report_markdown);
      showToast('Executive sales report generated from live database metrics.', 'success');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Sales report generation failed.';
      showToast(msg, 'error');
    } finally {
      setGeneratingReport(false);
    }
  }

  function copyToClipboard(text, field) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <DashboardLayout
      role="admin"
      title={activeTab === 'synthetic' ? 'Synthetic Tabular Data Generator' : 'AI Content & Executive Reports'}
      subtitle={
        activeTab === 'synthetic'
          ? 'Module 5A — Tabular Variational Autoencoder (VAE) dataset synthesis with Kolmogorov-Smirnov and correlation evaluation'
          : 'Module 5B — Grounded neural marketing copywriter and live database sales narrative generator'
      }
    >
      {/* Navigation Tabs */}
      <div className="flex border-b border-ink-100 dark:border-ink-800 mb-6 gap-6">
        <button
          onClick={() => {
            setActiveTab('synthetic');
            if (location.pathname.includes('content')) navigate('/admin/synthetic-data');
          }}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'synthetic'
              ? 'border-signal-500 text-signal-600 dark:text-signal-400'
              : 'border-transparent text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'
          }`}
        >
          <Database size={16} />
          <span>Synthetic Tabular Data</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('content');
            if (location.pathname.includes('synthetic')) navigate('/admin/ai-content');
          }}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'content'
              ? 'border-signal-500 text-signal-600 dark:text-signal-400'
              : 'border-transparent text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'
          }`}
        >
          <Wand2 size={16} />
          <span>AI Content & Reports</span>
        </button>
      </div>

      {activeTab === 'synthetic' ? (
        /* ================= PART A: SYNTHETIC DATA ================= */
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-ink-800 dark:text-white">
                  Generate Synthetic Training Records
                </h3>
                <p className="text-xs text-ink-400 mt-0.5">
                  Synthesizes statistically congruent tabular records while preventing privacy leakage. Evaluated with Kolmogorov-Smirnov test.
                </p>
              </div>
              <Badge tone="signal">SDV / Empirical Synthesis</Badge>
            </div>

            <form onSubmit={handleGenerateSynthetic} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1.5">
                  Source Entity
                </label>
                <select
                  value={synSource}
                  onChange={(e) => setSynSource(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 px-3.5 py-2.5 text-sm text-ink-800 dark:text-white focus:border-signal-500 focus:outline-none"
                >
                  <option value="customers">Customer Profiles & Behaviors</option>
                  <option value="products">Catalog Products & Inventory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1.5">
                  Number of Records
                </label>
                <select
                  value={synCount}
                  onChange={(e) => setSynCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 px-3.5 py-2.5 text-sm text-ink-800 dark:text-white focus:border-signal-500 focus:outline-none"
                >
                  <option value={50}>50 Records (Fast Sample)</option>
                  <option value={100}>100 Records (Standard)</option>
                  <option value={250}>250 Records (Extended)</option>
                  <option value={500}>500 Records (Benchmark)</option>
                </select>
              </div>

              <Button
                type="submit"
                variant="primary"
                icon={Sparkles}
                loading={generatingSyn}
              >
                Synthesize Dataset
              </Button>
            </form>
          </Card>

          {/* Synthetic Data Generation Result */}
          {synResult && (
            <div className="space-y-6">
              {/* Distribution Quality Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4">
                  <span className="text-xs text-ink-400 font-medium">KS Distribution Fidelity</span>
                  <p className="text-xl font-bold font-display text-mint-500 mt-1">
                    {(synResult.quality_score * 100).toFixed(1)}%
                  </p>
                  <span className="text-[11px] text-ink-400">Mean 1 - KS Statistic across features</span>
                </Card>
                <Card className="p-4">
                  <span className="text-xs text-ink-400 font-medium">Generated Records</span>
                  <p className="text-xl font-bold font-display text-signal-500 mt-1">
                    {synResult.job?.num_records} Rows
                  </p>
                  <span className="text-[11px] text-ink-400">Tagged with _is_synthetic=True</span>
                </Card>
                <Card className="p-4 flex flex-col justify-between">
                  <span className="text-xs text-ink-400 font-medium">Export Dataset</span>
                  <a
                    href={`/api/generative/synthetic-data/download/${synResult.job?.id}`}
                    download
                    className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-signal-500 text-white hover:bg-signal-600 transition-colors"
                  >
                    <Download size={14} /> Download CSV
                  </a>
                </Card>
              </div>

              {/* Data Preview Table */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-display text-sm font-semibold text-ink-800 dark:text-white">
                    Synthesized Records Sample (First 10 Rows)
                  </h4>
                  <Badge tone="amber">Synthetic Artifact</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-ink-100 dark:border-ink-800 text-ink-400 uppercase tracking-wider">
                        {synResult.preview && synResult.preview.length > 0 &&
                          Object.keys(synResult.preview[0]).slice(0, 7).map((col) => (
                            <th key={col} className="py-2.5 px-3">{col}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                      {synResult.preview?.map((row, idx) => (
                        <tr key={idx} className="hover:bg-ink-50/50 dark:hover:bg-ink-850/50">
                          {Object.keys(row).slice(0, 7).map((col) => (
                            <td key={col} className="py-2 px-3 text-ink-700 dark:text-ink-200">
                              {typeof row[col] === 'boolean'
                                ? (row[col] ? 'True' : 'False')
                                : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Job History */}
          <Card className="p-6">
            <h4 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-4">
              Synthetic Generation History
            </h4>
            {loadingSynHistory ? (
              <LoadingSpinner label="Loading dataset history..." className="py-4" />
            ) : synHistory.length === 0 ? (
              <p className="text-xs text-ink-400 py-4 text-center">No datasets synthesized yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink-100 dark:border-ink-800 text-ink-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Dataset</th>
                      <th className="py-2.5 px-3">Records</th>
                      <th className="py-2.5 px-3">KS Quality</th>
                      <th className="py-2.5 px-3">Generated</th>
                      <th className="py-2.5 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                    {synHistory.map((j) => (
                      <tr key={j.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-850/50">
                        <td className="py-2.5 px-3 font-semibold capitalize text-ink-800 dark:text-white">
                          {j.source_dataset}
                        </td>
                        <td className="py-2.5 px-3">{j.num_records}</td>
                        <td className="py-2.5 px-3 font-semibold text-mint-500">
                          {j.quality_score ? `${(j.quality_score * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-ink-400">
                          {j.created_at ? new Date(j.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <a
                            href={j.download_url}
                            download
                            className="inline-flex items-center gap-1 text-signal-500 font-semibold hover:underline"
                          >
                            <Download size={12} /> CSV
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* ================= PART B: AI CONTENT & REPORTS ================= */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Input Form (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="p-6">
                <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-4">
                  Product Content Parameters
                </h3>
                <form onSubmit={handleGenerateDescription} className="space-y-4">
                  <Input
                    id="prod-name"
                    label="Product Name"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1.5">
                        Category
                      </label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 px-3.5 py-2 text-sm text-ink-800 dark:text-white focus:border-signal-500 focus:outline-none"
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Shoes">Shoes</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Home">Home</option>
                      </select>
                    </div>
                    <Input
                      id="prod-price"
                      label="Price ($)"
                      type="number"
                      step="0.01"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1.5">
                      Features & Specifications
                    </label>
                    <textarea
                      rows={3}
                      value={prodSpecs}
                      onChange={(e) => setProdSpecs(e.target.value)}
                      placeholder="e.g. Ergonomic lumbar support, breathable mesh, 360-degree swivel"
                      className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 p-3 text-xs text-ink-800 dark:text-white focus:border-signal-500 focus:outline-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={Wand2}
                    loading={generatingDesc}
                    className="w-full"
                  >
                    Generate Copy & SEO
                  </Button>
                </form>
              </Card>

              {/* Generate Executive Sales Report Card */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 size={16} className="text-mint-500" />
                  <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white">
                    Executive Analytics Report
                  </h3>
                </div>
                <p className="text-xs text-ink-400 mb-4">
                  Synthesize current customer counts, churn ratios, and model accuracy into an executive brief.
                </p>
                <Button
                  variant="secondary"
                  icon={FileText}
                  loading={generatingReport}
                  onClick={handleGenerateReport}
                  className="w-full"
                >
                  Generate Sales Report
                </Button>
              </Card>
            </div>

            {/* Right: Generated Output (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {currentDesc ? (
                <Card className="p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-ink-100 dark:border-ink-800 pb-3">
                    <Badge tone="signal">{currentDesc.generation_method}</Badge>
                    <span className="text-xs text-ink-400">Marketing & SEO Ready</span>
                  </div>

                  {/* SEO Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">SEO Title</span>
                      <button
                        onClick={() => copyToClipboard(currentDesc.generated_title, 'title')}
                        className="text-xs text-signal-500 flex items-center gap-1 hover:underline"
                      >
                        {copiedField === 'title' ? <Check size={12} /> : <Copy size={12} />}
                        {copiedField === 'title' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="font-display font-semibold text-base text-ink-800 dark:text-white">
                      {currentDesc.generated_title}
                    </p>
                  </div>

                  {/* Short description */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Short Description</span>
                      <button
                        onClick={() => copyToClipboard(currentDesc.generated_short_desc, 'short')}
                        className="text-xs text-signal-500 flex items-center gap-1 hover:underline"
                      >
                        {copiedField === 'short' ? <Check size={12} /> : <Copy size={12} />}
                        {copiedField === 'short' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed text-ink-600 dark:text-ink-300 bg-ink-50 dark:bg-ink-850 p-3 rounded-xl">
                      {currentDesc.generated_short_desc}
                    </p>
                  </div>

                  {/* Long description */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Detailed Description</span>
                      <button
                        onClick={() => copyToClipboard(currentDesc.generated_long_desc, 'long')}
                        className="text-xs text-signal-500 flex items-center gap-1 hover:underline"
                      >
                        {copiedField === 'long' ? <Check size={12} /> : <Copy size={12} />}
                        {copiedField === 'long' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-xs leading-relaxed text-ink-600 dark:text-ink-300 bg-ink-50 dark:bg-ink-850 p-3 rounded-xl whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {currentDesc.generated_long_desc}
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider block mb-2">
                      Suggested Search Keywords
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentDesc.keywords?.map((kw, i) => (
                        <span key={i} className="text-[11px] font-medium px-2 py-1 rounded-lg bg-signal-500/10 text-signal-600 dark:text-signal-400">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-12 text-center text-ink-400">
                  <Wand2 size={40} className="mx-auto mb-3 text-ink-300 dark:text-ink-600" />
                  <p className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                    No Copy Generated Yet
                  </p>
                  <p className="text-xs text-ink-400 mt-1 max-w-sm mx-auto">
                    Fill in your product specifications and click "Generate Copy & SEO" to see high-converting marketing descriptions and search keywords.
                  </p>
                </Card>
              )}

              {/* Sales Report Modal/Card */}
              {salesReportText && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-3 border-b border-ink-100 dark:border-ink-800 pb-3">
                    <h4 className="font-display text-sm font-semibold text-ink-800 dark:text-white flex items-center gap-2">
                      <FileText size={16} className="text-signal-500" />
                      Live Analytics Report
                    </h4>
                    <button
                      onClick={() => copyToClipboard(salesReportText, 'report')}
                      className="text-xs text-signal-500 flex items-center gap-1 hover:underline"
                    >
                      {copiedField === 'report' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedField === 'report' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-xs leading-relaxed text-ink-600 dark:text-ink-300 whitespace-pre-wrap max-h-72 overflow-y-auto bg-ink-50 dark:bg-ink-850 p-4 rounded-xl">
                    {salesReportText}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
