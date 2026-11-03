import { ScanEye } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import ComingSoon from './ComingSoon';

export default function VisualRecognition() {
  return (
    <DashboardLayout role="admin" title="Visual Product Recognition" subtitle="Module 3 — future extension">
      <ComingSoon
        icon={ScanEye}
        eyebrow="Module 3"
        title="Visual Product Recognition"
        description="Upload a product image and automatically classify it using CNN/Transfer Learning."
        steps={['Upload Image', 'Image Processing', 'CNN / ResNet / YOLO', 'Product Classification']}
      />
    </DashboardLayout>
  );
}
