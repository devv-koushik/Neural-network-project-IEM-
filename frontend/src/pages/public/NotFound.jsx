import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { PublicLayout } from '../../components/layout/Layout';
import Button from '../../components/common/Button';

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="section-pad mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col items-center justify-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-signal-500/10 text-signal-500">
          <Compass size={26} />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold text-ink-800 dark:text-white">404</h1>
        <p className="mt-2 text-sm text-ink-400">The page you're looking for doesn't exist or has moved.</p>
        <Link to="/" className="mt-6"><Button variant="primary">Back to home</Button></Link>
      </div>
    </PublicLayout>
  );
}
