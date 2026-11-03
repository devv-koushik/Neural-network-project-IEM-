import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Products' },
  { to: '/#modules', label: 'AI Modules' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    showToast('Logged out successfully.', 'success');
    navigate('/');
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-ink-100 dark:border-ink-800 bg-white/92 dark:bg-ink-950/92 backdrop-blur-xl"
      style={{ boxShadow: '0 1px 0 rgba(15,20,29,.06)' }}
    >
      <div className="section-pad mx-auto flex h-16 max-w-7xl items-center justify-between">

        {/* Wordmark — matches landing page .sc-mark style */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <img
            src="/logo.jpg"
            alt="SmartCart AI"
            className="transition-transform duration-300 group-hover:-rotate-6"
            style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover' }}
          />
          <span
            className="font-display text-[17px] font-semibold text-ink-800 dark:text-white"
            style={{ letterSpacing: '-0.022em' }}
          >
            SmartCart <span className="text-signal-500">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-signal-500 bg-signal-500/8'
                    : 'text-ink-500 dark:text-ink-300 hover:text-ink-800 dark:hover:text-white hover:bg-ink-100/70 dark:hover:bg-ink-800/60'
                }`
              }
              style={{ letterSpacing: '-0.008em' }}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <>
              <Button variant="secondary" icon={LayoutDashboard} onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" icon={LogOut} onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
              {/* Pill-style CTA matching the landing page accent pill */}
              <button
                onClick={() => navigate('/register')}
                className="pill"
                style={{ height: 38, padding: '0 18px', fontSize: 14 }}
              >
                Get started
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-200"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[95] md:hidden">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-ink-900 shadow-soft-lg p-5 animate-slideInRight flex flex-col gap-1">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-semibold text-ink-800 dark:text-white" style={{ letterSpacing: '-0.022em' }}>Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="h-8 w-8 flex items-center justify-center rounded-xl border border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-300">
                <X size={18} />
              </button>
            </div>
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800"
                style={{ letterSpacing: '-0.008em' }}
              >
                {l.label}
              </NavLink>
            ))}
            <div className="my-3 h-px bg-ink-100 dark:bg-ink-800" />
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-ink-500 dark:text-ink-300">Theme</span>
              <ThemeToggle />
            </div>
            {user ? (
              <>
                <Button variant="secondary" className="mt-2 w-full" onClick={() => { setOpen(false); navigate(user.role === 'admin' ? '/admin' : '/dashboard'); }}>Dashboard</Button>
                <Button variant="ghost" className="w-full" onClick={() => { setOpen(false); handleLogout(); }}>Logout</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="mt-2 w-full" onClick={() => { setOpen(false); navigate('/login'); }}>Log in</Button>
                <Button variant="primary" className="w-full" onClick={() => { setOpen(false); navigate('/register'); }}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
