import { useState } from 'react';
import { Camera, Save, Bell, Shield, User } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export default function Profile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Profile updated.', 'success');
    }, 700);
  }

  return (
    <DashboardLayout role="customer" title="Profile" subtitle="Manage your account details">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-6 flex flex-col items-center text-center lg:col-span-1 h-fit">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-signal-500 text-2xl font-bold text-white">
              {name?.[0] || 'U'}
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-ink-500" aria-label="Change avatar">
              <Camera size={13} />
            </button>
          </div>
          <h2 className="mt-4 font-display text-base font-semibold text-ink-800 dark:text-white">{name}</h2>
          <p className="text-sm text-ink-400">{email}</p>
          <Badge tone="signal" className="mt-3">Customer account</Badge>
          <div className="mt-6 w-full space-y-3 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-400">Member since</span>
              <span className="font-medium text-ink-700 dark:text-ink-200">Mar 2024</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-400">Total predictions</span>
              <span className="font-medium text-ink-700 dark:text-ink-200">14</span>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5"><User size={16} className="text-signal-500" /><h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white">Account details</h3></div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input id="name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" variant="primary" icon={Save} loading={saving}>Save changes</Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5"><Bell size={16} className="text-amber-500" /><h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white">Preferences</h3></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-700 dark:text-ink-100">Prediction notifications</p>
                <p className="text-xs text-ink-400">Get notified when a new prediction is ready</p>
              </div>
              <button
                onClick={() => setNotifications((n) => !n)}
                aria-pressed={notifications}
                aria-label="Toggle prediction notifications"
                className={`relative h-6 w-11 rounded-full transition-colors ${notifications ? 'bg-signal-500' : 'bg-ink-200 dark:bg-ink-700'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2"><Shield size={16} className="text-mint-500" /><h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white">Security</h3></div>
            <p className="text-xs text-ink-400 mb-4">Demo accounts do not support password changes.</p>
            <Button variant="secondary" disabled>Change password</Button>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
