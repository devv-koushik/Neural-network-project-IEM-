import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, LogIn, Info } from 'lucide-react';
import { PublicLayout } from '../../components/layout/Layout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function validate() {
    const next = {};
    if (!email) next.email = 'Email is required.';
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const account = await login(email, password);
      showToast('Login successful.', 'success');
      navigate(account.role === 'admin' ? '/admin/customers' : '/customer/products');
    } catch (err) {
      setErrors({ form: err.message });
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(role) {
    if (role === 'customer') { setEmail('customer@demo.com'); setPassword('customer123'); }
    else { setEmail('admin@demo.com'); setPassword('admin123'); }
    setErrors({});
  }

  return (
    <PublicLayout>
      <div className="section-pad mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center py-12">
        <Link to="/" className="mx-auto flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal-500 text-white"><Sparkles size={18} /></div>
        </Link>
        <h1 className="mt-5 text-center font-display text-2xl font-bold text-ink-800 dark:text-white">Welcome back</h1>
        <p className="mt-1.5 text-center text-sm text-ink-400">Log in to your SmartCart AI account</p>

        <form onSubmit={handleSubmit} className="mt-8 card p-6 space-y-4" noValidate>
          {errors.form && <div className="rounded-lg bg-coral-500/10 px-3 py-2 text-xs text-coral-500">{errors.form}</div>}
          <Input id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" />
          <Input id="password" label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoComplete="current-password" />
          <Button type="submit" variant="primary" icon={LogIn} loading={submitting} className="w-full">Log in</Button>

          <div className="rounded-xl bg-signal-500/5 border border-signal-500/15 p-3.5">
            <div className="flex items-start gap-2">
              <Info size={14} className="mt-0.5 shrink-0 text-signal-500" />
              <div className="text-xs text-ink-500 dark:text-ink-300">
                <p className="font-semibold text-ink-700 dark:text-ink-100 mb-1.5">Demo accounts</p>
                <button type="button" onClick={() => fillDemo('customer')} className="block text-left hover:text-signal-500">Customer — customer@demo.com / customer123</button>
                <button type="button" onClick={() => fillDemo('admin')} className="mt-1 block text-left hover:text-signal-500">Admin — admin@demo.com / admin123</button>
              </div>
            </div>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          Don't have an account? <Link to="/register" className="font-semibold text-signal-500">Create one</Link>
        </p>
      </div>
    </PublicLayout>
  );
}
