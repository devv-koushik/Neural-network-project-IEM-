import { useLocation, useNavigate, Link } from 'react-router-dom';
import { RefreshCcw, History, CheckCircle2, AlertTriangle, Gauge, Activity } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import ProgressRing from '../../components/common/ProgressRing';
import Button from '../../components/common/Button';
import AIInsight from '../../components/dashboard/AIInsight';
import EmptyState from '../../components/common/EmptyState';

export default function PredictionResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result;

  if (!result) {
    return (
      <DashboardLayout role="customer" title="Prediction Result">
        <EmptyState
          title="No prediction to show"
          description="Run a new prediction to see purchase and churn results here."
          action={<Link to="/predict"><Button variant="primary">Run a prediction</Button></Link>}
        />
      </DashboardLayout>
    );
  }

  const purchasePct = result.purchaseProbability * 100;
  const churnPct = result.churnProbability * 100;

  return (
    <DashboardLayout role="customer" title="Prediction Result" subtitle="Generated just now by the customer prediction model">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Purchase Prediction</p>
          <ProgressRing value={purchasePct} color="#2BD9A8" size={180} sublabel={result.purchaseLabel} />
          <span className={`badge ${purchasePct >= 50 ? 'bg-mint-500/10 text-mint-600 dark:text-mint-500' : 'bg-coral-500/10 text-coral-500'}`}>
            {purchasePct >= 50 ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {result.purchaseLabel}
          </span>
        </Card>
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Churn Prediction</p>
          <ProgressRing value={churnPct} color="#F5566B" size={180} sublabel={result.churnRisk} />
          <span className={`badge ${result.churnRisk === 'High Risk' ? 'bg-coral-500/10 text-coral-500' : result.churnRisk === 'Medium Risk' ? 'bg-amber-500/10 text-amber-500' : 'bg-mint-500/10 text-mint-600 dark:text-mint-500'}`}>
            {result.churnRisk}
          </span>
        </Card>
      </div>

      <div className="mt-5">
        <AIInsight text={result.insights} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3"><Gauge size={16} className="text-signal-500" /><h3 className="text-sm font-semibold text-ink-800 dark:text-white">Prediction Confidence</h3></div>
          <p className="font-display text-3xl font-bold text-ink-800 dark:text-white">{result.confidence}%</p>
          <div className="mt-3 h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
            <div className="h-full rounded-full bg-signal-500" style={{ width: `${result.confidence}%` }} />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3"><Activity size={16} className="text-amber-500" /><h3 className="text-sm font-semibold text-ink-800 dark:text-white">Engagement Score</h3></div>
          <p className="font-display text-3xl font-bold text-ink-800 dark:text-white">{result.engagementScore}<span className="text-base text-ink-400"> / 100</span></p>
          <div className="mt-3 h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
            <div className="h-full rounded-full bg-amber-500" style={{ width: `${result.engagementScore}%` }} />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-ink-800 dark:text-white mb-3">Key Factors</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-mint-600 dark:text-mint-500 mb-1">Positive Factors</p>
              <ul className="space-y-1">
                {result.factors.positive.map((f) => <li key={f} className="text-xs text-ink-500 dark:text-ink-300 flex gap-1.5"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-mint-500" />{f}</li>)}
              </ul>
            </div>
            <div className="pt-2">
              <p className="text-xs font-semibold text-coral-500 mb-1">Risk Factors</p>
              <ul className="space-y-1">
                {result.factors.risk.map((f) => <li key={f} className="text-xs text-ink-500 dark:text-ink-300 flex gap-1.5"><AlertTriangle size={12} className="mt-0.5 shrink-0 text-coral-500" />{f}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" icon={RefreshCcw} onClick={() => navigate('/predict')}>Run Another Prediction</Button>
        <Button variant="secondary" icon={History} onClick={() => navigate('/predict/history')}>View Prediction History</Button>
      </div>
    </DashboardLayout>
  );
}
