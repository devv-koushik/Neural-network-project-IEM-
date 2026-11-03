import { Wand2 } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import ComingSoon from './ComingSoon';

export default function GenerativeAI() {
  return (
    <DashboardLayout role="admin" title="Synthetic Data & AI Content" subtitle="Module 5 — future extension">
      <div className="space-y-5">
        <ComingSoon
          icon={Wand2}
          eyebrow="Module 5 · Synthetic Data"
          title="Synthetic Data Generation"
          description="Generate synthetic training data to augment limited or imbalanced datasets."
          steps={['Existing Data', 'GAN / VAE', 'Synthetic Data']}
        />
        <ComingSoon
          icon={Wand2}
          eyebrow="Module 5 · AI Content"
          title="AI Product Content Generation"
          description="Generate polished product descriptions automatically from structured product information."
          steps={['Product Information', 'Language Model', 'Product Description']}
        />
      </div>
    </DashboardLayout>
  );
}
