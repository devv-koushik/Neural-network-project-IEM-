import { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, ScanEye, CheckCircle2, AlertCircle, History, Sparkles, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ProgressRing from '../../components/common/ProgressRing';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import { predictVisualImage, getVisualHistory, getVisualStatus } from '../../services/api';

const CATEGORY_COLORS = {
  Shoes: 'coral',
  Shirts: 'signal',
  Electronics: 'mint',
  Accessories: 'amber',
  Bags: 'coral',
  Other: 'neutral',
};

export default function VisualRecognition() {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [modelStatus, setModelStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [histData, statusData] = await Promise.allSettled([
        getVisualHistory(1, 10),
        getVisualStatus(),
      ]);
      if (histData.status === 'fulfilled') setHistory(histData.value.items || []);
      if (statusData.status === 'fulfilled') setModelStatus(statusData.value);
    } catch {
      // Silently handle
    } finally {
      setLoadingHistory(false);
    }
  }

  function handleFileSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (PNG, JPG, WEBP, GIF).', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size exceeds 10MB limit.', 'error');
      return;
    }

    setSelectedFile(file);
    setCurrentResult(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  async function handleClassify() {
    if (!selectedFile) return;
    setAnalyzing(true);
    try {
      const data = await predictVisualImage(selectedFile);
      setCurrentResult(data);
      showToast(`Classified as ${data.predicted_category} (${(data.confidence * 100).toFixed(1)}% confidence)`, 'success');
      loadData(); // Refresh history table
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Image classification failed. Please verify the backend is running.';
      showToast(msg, 'error');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <DashboardLayout
      role="admin"
      title="Visual Product Recognition"
      subtitle="Classify uploaded product images in real-time using MobileNetV2 Deep Learning"
    >
      {/* Top Banner Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 mb-6 rounded-2xl bg-signal-500/10 border border-signal-500/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-500 text-white shadow-sm">
            <ScanEye size={20} />
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-ink-800 dark:text-white">
              MobileNetV2 CNN Engine Active
            </h4>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Transfer learning architecture supporting Shoes, Shirts, Electronics, Accessories, Bags, and Other categories.
            </p>
          </div>
        </div>
        <Badge tone="mint" icon={CheckCircle2}>Real-time CNN</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Upload & Control (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6">
            <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-2">
              Upload Product Image
            </h3>
            <p className="text-xs text-ink-400 mb-4">
              Select or drop a photo of the product. Supports JPG, PNG, WEBP up to 10MB.
            </p>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                dragActive
                  ? 'border-signal-500 bg-signal-500/5'
                  : 'border-ink-200 dark:border-ink-700 hover:border-signal-500/60 bg-ink-50/50 dark:bg-ink-850/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />

              {previewUrl ? (
                <div className="flex flex-col items-center">
                  <div className="relative mb-3 h-48 w-full max-w-[240px] overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700 shadow-sm bg-white dark:bg-ink-900">
                    <img src={previewUrl} alt="Upload preview" className="h-full w-full object-contain" />
                  </div>
                  <span className="text-xs font-medium text-signal-500 hover:underline">
                    Click or drop to replace image
                  </span>
                  <span className="text-[11px] text-ink-400 mt-0.5">{selectedFile?.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-signal-500/10 text-signal-500 mb-3">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                    Click to browse or drop an image
                  </p>
                  <p className="text-xs text-ink-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              icon={Sparkles}
              loading={analyzing}
              disabled={!selectedFile}
              onClick={handleClassify}
              className="mt-5 w-full"
            >
              {analyzing ? 'Analyzing Image...' : 'Classify Product'}
            </Button>
          </Card>
        </div>

        {/* Right Column: Classification Results (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6">
            <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-4">
              Classification Intelligence
            </h3>

            {analyzing ? (
              <div className="py-16 text-center">
                <LoadingSpinner label="Running MobileNetV2 neural forward pass..." />
                <p className="text-xs text-ink-400 mt-2">Extracting high-level convolutional features</p>
              </div>
            ) : currentResult ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-ink-50 dark:bg-ink-850">
                  <ProgressRing
                    value={currentResult.confidence * 100}
                    color="#5B6EF5"
                    size={110}
                    sublabel="Confidence"
                  />
                  <div className="text-center sm:text-left flex-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Predicted Category</span>
                    <h2 className="text-2xl font-display font-bold text-ink-800 dark:text-white mt-1">
                      {currentResult.predicted_category}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone={CATEGORY_COLORS[currentResult.predicted_category] || 'signal'}>
                        Primary Class
                      </Badge>
                      <Badge tone="mint">Verified Inference</Badge>
                    </div>
                  </div>
                </div>

                {/* Top 3 Probabilities */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">
                    Top 3 Category Probabilities
                  </h4>
                  <div className="space-y-2.5">
                    {currentResult.top3?.map((item) => (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-ink-700 dark:text-ink-200">
                          <span>{item.category}</span>
                          <span className="font-semibold">{(item.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-700">
                          <div
                            className="h-full rounded-full bg-signal-500 transition-all duration-700"
                            style={{ width: `${item.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-ink-400">
                <ImageIcon size={44} className="mx-auto mb-3 text-ink-300 dark:text-ink-600" />
                <p className="text-sm font-medium text-ink-600 dark:text-ink-300">No Image Classified Yet</p>
                <p className="text-xs text-ink-400 mt-1 max-w-sm mx-auto">
                  Upload an image on the left and click "Classify Product" to view category predictions and confidence rankings.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom: History Table */}
      <div className="mt-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History size={16} className="text-signal-500" />
              <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white">
                Recent Image Classifications
              </h3>
            </div>
            <button
              onClick={loadData}
              className="text-xs flex items-center gap-1 font-medium text-ink-400 hover:text-signal-500"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loadingHistory ? (
            <LoadingSpinner label="Loading classification history..." className="py-8" />
          ) : history.length === 0 ? (
            <p className="text-xs text-ink-400 py-6 text-center">No images uploaded or classified yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink-100 dark:border-ink-800 text-ink-400 uppercase tracking-wider">
                    <th className="py-3 px-3">File</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Confidence</th>
                    <th className="py-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-850/50">
                      <td className="py-2.5 px-3 font-medium text-ink-800 dark:text-white flex items-center gap-2">
                        <ImageIcon size={14} className="text-ink-400" />
                        <span className="truncate max-w-[200px]">{h.original_filename || h.filename}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge tone={CATEGORY_COLORS[h.predicted_category] || 'signal'}>
                          {h.predicted_category}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-ink-700 dark:text-ink-200">
                        {(h.confidence * 100).toFixed(1)}%
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
      </div>
    </DashboardLayout>
  );
}
