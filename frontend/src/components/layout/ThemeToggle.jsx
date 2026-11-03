import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 text-ink-500 dark:text-ink-300 hover:text-signal-500 hover:border-signal-500/40 transition-all ${className}`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
