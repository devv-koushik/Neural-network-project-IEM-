import { LineChart } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import ComingSoon from './ComingSoon';

export default function DemandForecasting() {
  return (
    <DashboardLayout role="admin" title="Demand & Sales Forecasting" subtitle="Module 4 — future extension">
      <ComingSoon
        icon={LineChart}
        eyebrow="Module 4"
        title="Demand & Sales Forecasting"
        description="Forecast future product demand from historical sales data using time-series deep learning."
        steps={['Historical Sales', 'Time Series Processing', 'LSTM / GRU', 'Future Demand']}
      />
    </DashboardLayout>
  );
}
