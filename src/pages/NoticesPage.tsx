import { useMemo, useState } from 'react';
import { Calendar, Pin, Plus, Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '../components/Toast';
import { simsApi } from '../services/api';
import type { AuthUser, Notice, NoticeCategory } from '../types/sims';

interface NoticesPageProps {
  user: AuthUser;
  notices: Notice[];
  onCreated: (n: Notice) => void;
  onDeleted: (id: string) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function NoticesPage({ user, notices, onCreated, onDeleted, onNotify }: NoticesPageProps) {
  const canPublish = user.role === 'admin' || user.role === 'teacher';
  const [category, setCategory] = useState<'All' | NoticeCategory>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);

  const [form, setForm] = useState({
    title: '',
    category: 'Academic' as NoticeCategory,
    content: '',
    eventDate: '',
    pinned: false,
  });

  const filtered = useMemo(
    () =>
      notices
        .filter((n) => (category === 'All' ? true : n.category === category))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    [notices, category]
  );

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await simsApi.createNotice({
        ...form,
        author: user.name,
      });
      onCreated(created);
      setModalOpen(false);
      setForm({ title: '', category: 'Academic', content: '', eventDate: '', pinned: false });
      onNotify('success', 'Notice Published', `"${created.title}" is now visible campus-wide.`);
    } catch (err) {
      onNotify('error', 'Failed', err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await simsApi.deleteNotice(deleteTarget.id);
      onDeleted(deleteTarget.id);
      onNotify('info', 'Notice Deleted', 'Announcement removed from board.');
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', 'Delete Failed', err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          {(['All', 'Academic', 'Examination', 'Event', 'Holiday'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                category === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {canPublish && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((n) => (
          <div key={n.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-blue-700">{n.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">Published {n.publishDate}</span>
                  <span aria-hidden="true">·</span>
                  <span>By {n.author}</span>
                  {n.pinned && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    </>
                  )}
                </div>
                <h3 className="font-display text-base font-bold text-slate-900">{n.title}</h3>
              </div>

              <div className="flex items-center gap-3">
                {n.eventDate && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                    <Calendar className="w-3.5 h-3.5 text-blue-700" />
                    <span>{n.eventDate}</span>
                  </span>
                )}
                {user.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(n)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">{n.content}</p>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">Publish Announcement</h3>
              <button type="button" onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handlePublish} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Mid-Semester Academic Advisory"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as NoticeCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Examination">Examination</option>
                    <option value="Event">Event</option>
                    <option value="Holiday">Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event / Effective Date</label>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message Content *</label>
                <textarea
                  required
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="font-medium text-slate-700">Pin to top of Notice Board</span>
              </label>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg font-semibold">
                  {saving ? 'Publishing...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Notice"
        description={`Remove "${deleteTarget?.title}" from the university notice board?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
