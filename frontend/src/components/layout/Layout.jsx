import { useState } from 'react';
import { Menu, Bell, ShoppingCart } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';

export function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function DashboardLayout({ children, role = 'customer', title, subtitle }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { totalCount, openCart } = useCart();

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar role={role} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Dashboard top-bar — paper-white surface with landing-page grain gradient */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-ink-100 dark:border-ink-800 bg-white/90 dark:bg-ink-900/90 backdrop-blur-xl px-4 sm:px-6"
          style={{ boxShadow: '0 1px 0 rgba(15,20,29,.06)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl border border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-300 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-base font-semibold text-ink-800 dark:text-white sm:text-lg" style={{ letterSpacing: '-0.022em' }}>
                {title}
              </h1>
              {subtitle && (
                <p className="hidden text-xs text-ink-400 sm:block truncate" style={{ letterSpacing: '-0.006em' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            {/* Shopping Cart button (customers only) */}
            {role !== 'admin' && (
              <button
                onClick={openCart}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:text-signal-500 hover:border-signal-500/40 transition-colors"
                aria-label={`Shopping cart with ${totalCount} items`}
              >
                <ShoppingCart size={17} />
                {totalCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-signal-500 px-1 text-[10px] font-bold text-white shadow-sm">
                    {totalCount}
                  </span>
                )}
              </button>
            )}

            <button
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={15} />
            </button>
            <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50/60 dark:bg-ink-850/60 pl-1.5 pr-3.5 py-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal-500 text-xs font-bold text-white">
                {user?.name?.[0] || 'U'}
              </div>
              <span className="text-sm font-medium text-ink-700 dark:text-ink-100" style={{ letterSpacing: '-0.008em' }}>
                {user?.name || 'User'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fadeIn overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
