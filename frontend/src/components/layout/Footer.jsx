import { Link } from 'react-router-dom';
import { Sparkles, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-950">
      <div className="section-pad mx-auto max-w-7xl py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-500 text-white">
                <Sparkles size={17} />
              </div>
              <span className="font-display text-[17px] font-bold text-ink-800 dark:text-white">SmartCart <span className="text-signal-500">AI</span></span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-ink-400">AI-powered insights for smarter e-commerce decisions.</p>
            <div className="mt-4 flex gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" aria-label="Social link" className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-300 hover:text-signal-500 transition-colors">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-800 dark:text-ink-100 mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-ink-400">
              <li><Link to="/products" className="hover:text-signal-500">Products</Link></li>
              <li><Link to="/visual-recognition" className="hover:text-signal-500">Visual Recognition</Link></li>
              <li><Link to="/profile" className="hover:text-signal-500">My Account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-800 dark:text-ink-100 mb-3">Modules</h4>
            <ul className="space-y-2 text-sm text-ink-400">
              <li><span>Customer Prediction</span></li>
              <li><span>Model Optimization</span></li>
              <li><span>Visual Recognition · Soon</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-800 dark:text-ink-100 mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-ink-400">
              <li><span>About</span></li>
              <li><span>Careers</span></li>
              <li><span>Contact</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col-reverse items-center justify-between gap-4 border-t border-ink-100 dark:border-ink-800 pt-6 sm:flex-row">
          <p className="text-xs text-ink-400">© {new Date().getFullYear()} SmartCart AI. All rights reserved.</p>
          <p className="text-xs text-ink-400">Built for demonstration · Frontend-only preview</p>
        </div>
      </div>
    </footer>
  );
}
