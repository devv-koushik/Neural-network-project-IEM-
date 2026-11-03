import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DashboardLayout } from '../../components/layout/Layout';
import ChartCard from '../../components/dashboard/ChartCard';
import Select from '../../components/common/Select';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getTrainingHistory, getExperimentNames } from '../../services/api';

export default function TrainingAnalytics() {
  const [experimentNames, setExperimentNames] = useState(['Basic ANN']);
  const [experiment, setExperiment] = useState('Basic ANN');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [epochLimit, setEpochLimit] = useState(15);

  useEffect(() => {
    getExperimentNames().then((names) => {
      if (names.length) {
        setExperimentNames(names);
        setExperiment((current) => (names.includes(current) ? current : names[0]));
      }
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    getTrainingHistory(experiment).then((d) => {
      setHistory(d);
      setEpochLimit(Math.max(3, Math.min(15, d.length || 15)));
      setLoading(false);
    });
  }, [experiment]);

  const displayed = useMemo(() => history.filter((h) => h.epoch <= epochLimit), [history, epochLimit]);

  return (
    <DashboardLayout role="admin" title="Training Analytics" subtitle="Per-experiment training curves">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select label="Experiment" value={experiment} onChange={(e) => setExperiment(e.target.value)} options={experimentNames} className="sm:w-56" />
        <div className="sm:w-64">
          <label htmlFor="epochLimit" className="label">Epoch range: 1–{epochLimit}</label>
          <input id="epochLimit" type="range" min={Math.min(3, history.length || 3)} max={history.length || 15} value={epochLimit} onChange={(e) => setEpochLimit(Number(e.target.value))} className="w-full accent-signal-500" />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading training analytics..." className="py-24" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Training Loss" subtitle={experiment}>
            <ResponsiveContainer>
              <LineChart data={displayed}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
                <XAxis dataKey="epoch" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
                <Line type="monotone" dataKey="trainLoss" stroke="#F5566B" strokeWidth={2.5} dot={false} name="Training Loss" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Validation Loss" subtitle={experiment}>
            <ResponsiveContainer>
              <LineChart data={displayed}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
                <XAxis dataKey="epoch" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
                <Line type="monotone" dataKey="valLoss" stroke="#F5A623" strokeWidth={2.5} dot={false} name="Validation Loss" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Training Accuracy" subtitle={experiment}>
            <ResponsiveContainer>
              <LineChart data={displayed}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
                <XAxis dataKey="epoch" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} domain={[0.4, 1]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
                <Line type="monotone" dataKey="trainAcc" stroke="#5B6EF5" strokeWidth={2.5} dot={false} name="Training Accuracy" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Validation Accuracy" subtitle={experiment}>
            <ResponsiveContainer>
              <LineChart data={displayed}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
                <XAxis dataKey="epoch" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} domain={[0.4, 1]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
                <Line type="monotone" dataKey="valAcc" stroke="#2BD9A8" strokeWidth={2.5} dot={false} name="Validation Accuracy" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </DashboardLayout>
  );
}
