import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, UserPlus } from 'lucide-react';
import { PublicLayout } from '../../components/layout/Layout';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const GENDER_OPTIONS = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Other', label: 'Other' },
];

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    age: '',
    gender: 'Female',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    if (!form.age) {
      next.age = 'Age is required.';
    } else {
      const ageNum = parseInt(form.age, 10);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        next.age = 'Age must be between 13 and 120.';
      }
    }
    if (!form.gender) next.gender = 'Gender is required.';
    if (!form.password || form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        age: parseInt(form.age, 10),
        gender: form.gender,
      });
      showToast('Account created. Welcome to SmartCart AI!', 'success');
      navigate('/customer/products');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Something went wrong. Please try again.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout>
      <div className="section-pad mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center py-12">
        <Link to="/" className="mx-auto flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal-500 text-white"><Sparkles size={18} /></div>
        </Link>
        <h1 className="mt-5 text-center font-display text-2xl font-bold text-ink-800 dark:text-white">Create your account</h1>
        <p className="mt-1.5 text-center text-sm text-ink-400">Start exploring AI-powered e-commerce insights</p>

        <form onSubmit={handleSubmit} className="mt-8 card p-6 space-y-4" noValidate>
          <Input id="name" label="Full name" placeholder="Pritam Sharma" value={form.name} onChange={(e) => update('name', e.target.value)} error={errors.name} autoComplete="name" />
          <Input id="email" label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} autoComplete="email" />

          {/* Age and Gender row */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="age"
              label="Age"
              type="number"
              min="13"
              max="120"
              placeholder="e.g. 25"
              value={form.age}
              onChange={(e) => update('age', e.target.value)}
              error={errors.age}
            />
            <Select
              id="gender"
              label="Gender"
              options={GENDER_OPTIONS}
              value={form.gender}
              onChange={(e) => update('gender', e.target.value)}
            />
          </div>

          <Input id="password" label="Password" type="password" placeholder="At least 6 characters" value={form.password} onChange={(e) => update('password', e.target.value)} error={errors.password} autoComplete="new-password" />
          <Input id="confirm" label="Confirm password" type="password" placeholder="Re-enter your password" value={form.confirm} onChange={(e) => update('confirm', e.target.value)} error={errors.confirm} autoComplete="new-password" />
          <Button type="submit" variant="primary" icon={UserPlus} loading={submitting} className="w-full">Create account</Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          Already have an account? <Link to="/login" className="font-semibold text-signal-500">Log in</Link>
        </p>
      </div>
    </PublicLayout>
  );
}
