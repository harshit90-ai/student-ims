import { useMemo, useState } from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '../components/Toast';
import { simsApi } from '../services/api';
import type { Course, Exam, Subject, UserRole } from '../types/sims';

interface ExaminationsPageProps {
  role: UserRole;
  exams: Exam[];
  courses: Course[];
  subjects: Subject[];
  onCreated: (e: Exam) => void;
  onDeleted: (id: string) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function ExaminationsPage({
  role,
  exams,
  courses,
  subjects,
  onCreated,
  onDeleted,
  onNotify,
}: ExaminationsPageProps) {
  const canManage = role === 'admin' || role === 'teacher';
  const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Completed'>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);

  const [form, setForm] = useState({
    title: 'Final Term Examination — Fall 2026',
    course: courses[0]?.name || '',
    semester: 5,
    subjectCode: subjects[0]?.code || 'CS301',
    subjectName: subjects[0]?.name || 'Data Structures & Algorithms',
    date: '2026-12-15',
    time: '09:00 AM - 12:00 PM',
    room: 'Main Examination Hall A',
    totalMarks: 100,
    passingMarks: 40,
    status: 'Upcoming' as Exam['status'],
  });

  const filtered = useMemo(
    () =>
      exams.filter((e) => (statusFilter === 'All' ? true : e.status === statusFilter)),
    [exams, statusFilter]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await simsApi.createExam(form);
      onCreated(created);
      setModalOpen(false);
      onNotify('success', 'Exam Scheduled', `${created.subjectCode} on ${created.date}`);
    } catch (err) {
      onNotify('error', 'Failed', err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await simsApi.deleteExam(deleteTarget.id);
      onDeleted(deleteTarget.id);
      onNotify('info', 'Examination Deleted', `${deleteTarget.subjectCode} removed from schedule.`);
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', 'Delete Failed', err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          {(['All', 'Upcoming', 'Completed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Exam</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((ex) => (
          <div key={ex.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-blue-700">{ex.subjectCode}</span>
                <span
                  className={`font-semibold ${
                    ex.status === 'Upcoming' ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {ex.status}
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 mt-1.5">
                {ex.subjectName}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">{ex.title}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{ex.date}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ex.time}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ex.room}</span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Max: <strong className="font-mono text-slate-900">{ex.totalMarks}</strong> · Pass:{' '}
                <strong className="font-mono text-slate-900">{ex.passingMarks}</strong>
              </span>
              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(ex)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">Schedule Examination</h3>
              <button type="button" onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Examination Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={form.subjectCode}
                    onChange={(e) => {
                      const sub = subjects.find((s) => s.code === e.target.value);
                      setForm({
                        ...form,
                        subjectCode: e.target.value,
                        subjectName: sub?.name || form.subjectName,
                        course: sub?.course || form.course,
                        semester: sub?.semester || form.semester,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.code} · {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                  <input required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room / Venue</label>
                  <input required value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Marks</label>
                  <input type="number" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Passing</label>
                  <input type="number" value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Exam['status'] })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg font-semibold">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Examination"
        description={`Remove ${deleteTarget?.subjectCode} (${deleteTarget?.subjectName}) scheduled on ${deleteTarget?.date}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
