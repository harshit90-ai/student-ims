import { useState } from 'react';
import { Database, Save, ShieldCheck } from 'lucide-react';
import { simsApi } from '../services/api';
import type { AuthUser, InstitutionSettings } from '../types/sims';

interface SettingsPageProps {
  user: AuthUser;
  settings: InstitutionSettings;
  onUpdated: (next: InstitutionSettings) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function SettingsPage({ user, settings, onUpdated, onNotify }: SettingsPageProps) {
  const isAdmin = user.role === 'admin';
  const [form, setForm] = useState<InstitutionSettings>({ ...settings });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await simsApi.updateSettings(form);
      onUpdated(updated);
      onNotify('success', 'Settings Saved', 'Institution configuration persisted to backend.');
    } catch (err) {
      onNotify('error', 'Save Failed', err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Institution Configuration */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Institution & Academic Term Settings
            </h2>
            <p className="text-xs text-slate-500">
              {isAdmin
                ? 'Configure university metadata, passing thresholds, and attendance compliance rules.'
                : 'Read-only institutional configuration (managed by Admin).'}
            </p>
          </div>
          {isAdmin && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Institution Name</label>
            <input
              disabled={!isAdmin}
              value={form.institutionName}
              onChange={(e) => setForm({ ...form, institutionName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">System Code</label>
            <input
              disabled={!isAdmin}
              value={form.shortCode}
              onChange={(e) => setForm({ ...form, shortCode: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
            <input
              disabled={!isAdmin}
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Semester</label>
            <input
              disabled={!isAdmin}
              value={form.currentSemester}
              onChange={(e) => setForm({ ...form, currentSemester: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Registrar Contact Email</label>
            <input
              disabled={!isAdmin}
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Registrar Phone</label>
            <input
              disabled={!isAdmin}
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Passing Percentage (%)</label>
            <input
              type="number"
              disabled={!isAdmin}
              value={form.passingPercentage}
              onChange={(e) => setForm({ ...form, passingPercentage: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Minimum Attendance (%)</label>
            <input
              type="number"
              disabled={!isAdmin}
              value={form.attendanceThreshold}
              onChange={(e) => setForm({ ...form, attendanceThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-50"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Campus Address</label>
            <input
              disabled={!isAdmin}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
            />
          </div>
        </div>
      </form>

      {/* Role-Based Access & Database Architecture Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1D4ED8]" />
            <h3 className="font-display text-sm font-bold text-slate-900">
              Active Session & RBAC Scope
            </h3>
          </div>
          <div className="text-xs text-slate-600 space-y-1.5">
            <p>Signed in as: <strong className="text-slate-900">{user.name}</strong></p>
            <p>Role: <strong className="capitalize text-blue-700">{user.role}</strong></p>
            <p>Department: <strong className="text-slate-900">{user.department || 'University Wide'}</strong></p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#0B1F3A]" />
            <h3 className="font-display text-sm font-bold text-slate-900">
              Backend Persistence & MySQL/MongoDB Guide
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Currently running a live Express REST API backed by persistent storage (<code className="font-mono bg-slate-100 px-1 rounded">data/sims_db.json</code>). Click <strong>Backend Data</strong> in the bottom-right corner at any time to inspect database tables, live API logs, or export JSON.
          </p>
        </div>
      </div>
    </div>
  );
}
