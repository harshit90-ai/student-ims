import { useMemo, useState } from 'react';
import { Edit3, Eye, Mail, Phone, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { ConfirmDialog } from '../components/Toast';
import { simsApi } from '../services/api';
import type { Department, Subject, Teacher, UserRole } from '../types/sims';

interface TeachersPageProps {
  role: UserRole;
  teachers: Teacher[];
  departments: Department[];
  subjects: Subject[];
  onCreated: (t: Teacher) => void;
  onUpdated: (t: Teacher) => void;
  onDeleted: (id: string) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const EMPTY_TEACHER: Partial<Teacher> = {
  teacherId: '',
  fullName: '',
  avatar: '',
  email: '',
  phone: '',
  department: '',
  designation: 'Assistant Professor',
  experienceYears: 4,
  assignedSubjects: [],
  status: 'Active',
};

export function TeachersPage({
  role,
  teachers,
  departments,
  subjects,
  onCreated,
  onUpdated,
  onDeleted,
  onNotify,
}: TeachersPageProps) {
  const canEdit = role === 'admin';
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Teacher>>(EMPTY_TEACHER);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      if (
        q &&
        !t.fullName.toLowerCase().includes(q) &&
        !t.teacherId.toLowerCase().includes(q) &&
        !t.email.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (deptFilter !== 'All' && t.department !== deptFilter) return false;
      return true;
    });
  }, [teachers, search, deptFilter]);

  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_TEACHER,
      teacherId: `FAC-${101 + teachers.length}`,
      department: departments[0]?.name || '',
    });
    setFormOpen(true);
  };

  const openEdit = (t: Teacher) => {
    setEditingId(t.id);
    setForm({ ...t });
    setFormOpen(true);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, avatar: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleSubject = (code: string) => {
    const current = form.assignedSubjects || [];
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    setForm({ ...form, assignedSubjects: next });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const updated = await simsApi.updateTeacher(editingId, form);
        onUpdated(updated);
        onNotify('success', 'Faculty Updated', `Saved changes for ${updated.fullName}.`);
      } else {
        const created = await simsApi.createTeacher(form);
        onCreated(created);
        onNotify('success', 'Faculty Added', `${created.fullName} (${created.teacherId}) added.`);
      }
      setFormOpen(false);
    } catch (err) {
      onNotify('error', 'Save Failed', err instanceof Error ? err.message : 'Could not save teacher');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await simsApi.deleteTeacher(deleteTarget.id);
      onDeleted(deleteTarget.id);
      onNotify('info', 'Faculty Removed', `${deleteTarget.fullName} removed from directory.`);
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', 'Delete Failed', err instanceof Error ? err.message : 'Could not delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty by name, ID, or email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Teacher</span>
          </button>
        )}
      </div>

      {/* Faculty Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-sm font-semibold text-slate-900">No faculty members found</p>
          <p className="text-xs text-slate-500 mt-1">Adjust your search or department filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={t.avatar} name={t.fullName} size="lg" />
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-semibold text-blue-700">{t.teacherId}</p>
                      <h3 className="font-display text-sm font-bold text-slate-900 truncate">
                        {t.fullName}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">{t.designation}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 shrink-0">
                    {t.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <p className="font-medium text-slate-800">{t.department}</p>
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{t.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{t.phone}</span>
                  </p>
                  <p className="text-slate-500 pt-1">
                    Experience: <span className="font-mono font-semibold text-slate-800">{t.experienceYears} yrs</span>
                    <span aria-hidden="true"> · </span>
                    Subjects:{' '}
                    <span className="font-mono text-slate-800">
                      {t.assignedSubjects.length > 0 ? t.assignedSubjects.join(', ') : 'None'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setViewTeacher(t)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(t)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Faculty Modal */}
      {viewTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-[#0B1F3A] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={viewTeacher.avatar} name={viewTeacher.fullName} size="lg" />
                <div>
                  <h3 className="font-display text-base font-bold">{viewTeacher.fullName}</h3>
                  <p className="text-xs text-blue-200">
                    {viewTeacher.teacherId} · {viewTeacher.designation}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewTeacher(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <p><span className="text-slate-500">Department:</span> <strong className="text-slate-900">{viewTeacher.department}</strong></p>
              <p><span className="text-slate-500">Email:</span> <strong className="text-slate-900">{viewTeacher.email}</strong></p>
              <p><span className="text-slate-500">Phone:</span> <strong className="text-slate-900">{viewTeacher.phone}</strong></p>
              <p><span className="text-slate-500">Experience:</span> <strong className="text-slate-900 font-mono">{viewTeacher.experienceYears} Years</strong></p>
              <p><span className="text-slate-500">Assigned Subjects:</span> <strong className="text-slate-900 font-mono">{viewTeacher.assignedSubjects.join(', ') || 'None'}</strong></p>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewTeacher(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Faculty Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">
                {editingId ? 'Edit Faculty Profile' : 'Add Faculty Member'}
              </h3>
              <button type="button" onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center gap-4 pb-3 border-b border-slate-100">
                <Avatar src={form.avatar} name={form.fullName || 'Faculty'} size="lg" />
                <label className="inline-flex items-center gap-2 px-3 py-1.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teacher ID *</label>
                  <input
                    type="text"
                    required
                    value={form.teacherId || ''}
                    onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.fullName || ''}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={form.phone || ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={form.department || ''}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={form.designation || ''}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.experienceYears ?? 1}
                    onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status || 'Active'}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Teacher['status'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Active">Active</option>
                    <option value="Sabbatical">Sabbatical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">Assigned Subjects</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
                  {subjects.map((sub) => {
                    const checked = (form.assignedSubjects || []).includes(sub.code);
                    return (
                      <label key={sub.id} className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSubject(sub.code)}
                          className="rounded border-slate-300 text-blue-600"
                        />
                        <span className="truncate font-mono">{sub.code}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF]"
                >
                  {saving ? 'Saving...' : 'Save Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove Faculty Member"
        description={`Confirm removal of ${deleteTarget?.fullName} (${deleteTarget?.teacherId}) from the faculty registry?`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
