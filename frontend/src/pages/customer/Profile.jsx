import { useEffect, useState } from 'react';
import { Camera, Save, Bell, Shield, User, Lock } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getCurrentUser, updateProfile, changePassword } from '../../services/api';

const GENDER_OPTIONS = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Other', label: 'Other' },
];

function formatMemberSince(isoDate) {
  if (!isoDate) return '—';
  try {
    return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [age, setAge] = useState(user?.age ?? '');
  const [gender, setGender] = useState(user?.gender || 'Female');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);

  // Real user stats fetched from /api/auth/me
  const [memberSince, setMemberSince] = useState(null);
  const [totalPredictions, setTotalPredictions] = useState(null);
  const [latestPrediction, setLatestPrediction] = useState(null);

  // Password change state
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setName(u.name || '');
        setEmail(u.email || '');
        setAge(u.age ?? '');
        setGender(u.gender || 'Female');
        setMemberSince(u.created_at || null);
        setTotalPredictions(u.total_predictions ?? null);
        setLatestPrediction(u.latest_prediction || null);
      })
      .catch(() => {
        // Backend unavailable — keep values from auth context
        setMemberSince(user?.created_at || null);
        setAge(user?.age ?? '');
        setGender(user?.gender || 'Female');
      });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedUser = await updateProfile({
        name: name.trim(),
        email: email.trim(),
        age: age !== '' ? parseInt(age, 10) : null,
        gender,
      });
      if (setUser) {
        setUser((prev) => ({
          ...prev,
          name: updatedUser.name,
          email: updatedUser.email,
          age: updatedUser.age ?? age,
          gender: updatedUser.gender ?? gender,
        }));
      }
      showToast('Profile updated successfully.', 'success');
    } catch (error) {
      const msg = error?.response?.data?.error?.message || 'Failed to update profile.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      showToast('Password changed successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
    } catch (error) {
      const msg = error?.response?.data?.error?.message || 'Failed to change password.';
      showToast(msg, 'error');
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <DashboardLayout role="customer" title="Profile" subtitle="Manage your account details">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Sidebar card ── */}
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
              <span className="text-ink-400">Gender</span>
              <span className="font-medium text-ink-700 dark:text-ink-200">
                {gender || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-400">Age</span>
              <span className="font-medium text-ink-700 dark:text-ink-200">
                {age ? `${age} years` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-400">Member since</span>
              <span className="font-medium text-ink-700 dark:text-ink-200">
                {memberSince ? formatMemberSince(memberSince) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-400">Total predictions</span>
              <span className="font-medium text-ink-700 dark:text-ink-200">
                {totalPredictions !== null ? totalPredictions : '—'}
              </span>
            </div>
            {latestPrediction && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-400">Purchase probability</span>
                  <span className="font-medium text-ink-700 dark:text-ink-200">
                    {(latestPrediction.purchase_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-400">Churn risk</span>
                  <span className="font-medium text-ink-700 dark:text-ink-200">
                    {latestPrediction.churn_risk}
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          {/* ── Account details ── */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5"><User size={16} className="text-signal-500" /><h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white">Account details</h3></div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input id="name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input
                  id="age"
                  label="Age"
                  type="number"
                  min="13"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
                <Select
                  id="gender"
                  label="Gender"
                  options={GENDER_OPTIONS}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                />
              </div>
              <Button type="submit" variant="primary" icon={Save} loading={saving}>Save changes</Button>
            </form>
          </Card>

          {/* ── Preferences ── */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5"><Bell size={16} className="text-amber-500" /><h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white">Preferences</h3></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-700 dark:text-ink-100">Push notifications</p>
                <p className="text-xs text-ink-400">Receive alerts for order status, cart updates, and deals</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications((n) => !n)}
                aria-pressed={notifications}
                aria-label="Toggle push notifications"
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-signal-500 focus:ring-offset-2 ${
                  notifications ? 'bg-signal-500' : 'bg-ink-200 dark:bg-ink-700'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
                    notifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Card>

          {/* ── Security / Change password ── */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Shield size={16} className="text-mint-500" /><h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white">Security</h3></div>
              {!showPassword && (
                <Button variant="secondary" icon={Lock} onClick={() => setShowPassword(true)}>Change password</Button>
              )}
            </div>

            {showPassword ? (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <Input
                  id="current-password"
                  label="Current password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    id="new-password"
                    label="New password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Input
                    id="confirm-password"
                    label="Confirm new password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="primary" loading={changingPassword}>Update password</Button>
                  <Button type="button" variant="secondary" onClick={() => { setShowPassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>Cancel</Button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-ink-400">Keep your account secure with a strong password.</p>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
