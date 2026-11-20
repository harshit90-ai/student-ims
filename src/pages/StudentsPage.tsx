import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Edit3,
  Eye,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { ConfirmDialog } from '../components/Toast';
import { simsApi } from '../services/api';
import type { Course, Department, Student, UserRole } from '../types/sims';

interface StudentsPageProps {
  role: UserRole;
  actorName: string;
  students: Student[];
  courses: Course[];
  departments: Department[];
  onCreated: (stu: Student) => void;
  onUpdated: (stu: Student) => void;
  onDeleted: (id: string) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const EMPTY_FORM: Partial<Student> = {
  registrationNumber: '',
  fullName: '',
  avatar: '',
  email: '',
  phone: '',
  dateOfBirth: '2005-06-15',
  gender: 'Female',
  address: '',
  course: '',
  department: '',
  semester: 1,
  enrollmentYear: 2026,
  admissionDate: new Date().toISOString().slice(0, 10),
  guardianName: '',
  guardianContact: '',
  status: 'Active',
  gpa: 3.6,
};

export function StudentsPage({
  role,
  actorName,
  students,
  courses,
  departments,
  onCreated,
  onUpdated,
  onDeleted,
  onNotify,
}: StudentsPageProps) {
  const canEdit = role === 'admin';

  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [semFilter, setSemFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'reg' | 'semester' | 'gpa'>('reg');
  const [sortAsc, setSortAsc] = useState(true);

  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Student>>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const years = useMemo(
    () => Array.from(new Set(students.map((s) => s.enrollmentYear))).sort((a, b) => b - a),
    [students]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => {
        if (
          q &&
          !s.fullName.toLowerCase().includes(q) &&
          !s.registrationNumber.toLowerCase().includes(q) &&
          !s.email.toLowerCase().includes(q)
        ) {
          return false;
        }
        if (courseFilter !== 'All' && s.course !== courseFilter) return false;
        if (deptFilter !== 'All' && s.department !== deptFilter) return false;
        if (semFilter !== 'All' && String(s.semester) !== semFilter) return false;
        if (yearFilter !== 'All' && String(s.enrollmentYear) !== yearFilter) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'name') cmp = a.fullName.localeCompare(b.fullName);
        else if (sortBy === 'reg') cmp = a.registrationNumber.localeCompare(b.registrationNumber);
        else if (sortBy === 'semester') cmp = a.semester - b.semester;
        else cmp = a.gpa - b.gpa;
        return sortAsc ? cmp : -cmp;
      });
  }, [students, search, courseFilter, deptFilter, semFilter, yearFilter, sortBy, sortAsc]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else {
      setSortBy(col);
      setSortAsc(true);
    }
  };

  const openAdd = () => {
    const defaultCourse = courses[0];
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      registrationNumber: `STU-2026-${String(students.length + 1).padStart(3, '0')}`,
      course: defaultCourse?.name || '',
      department: defaultCourse?.department || departments[0]?.name || '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (stu: Student) => {
    setEditingId(stu.id);
    setForm({ ...stu });
    setFormError('');
    setFormOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Profile picture must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, avatar: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.fullName?.trim() || !form.email?.trim() || !form.course || !form.guardianName?.trim()) {
      setFormError('Please fill in Full Name, Email, Course, and Guardian Name.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await simsApi.updateStudent(editingId, { ...form, _actor: actorName });
        onUpdated(updated);
        onNotify('success', 'Student Updated', `${updated.fullName}'s profile has been updated.`);
      } else {
        const created = await simsApi.createStudent({ ...form, _actor: actorName });
        onCreated(created);
        onNotify('success', 'Student Enrolled', `${created.fullName} (${created.registrationNumber}) added.`);
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save student record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await simsApi.deleteStudent(deleteTarget.id);
      onDeleted(deleteTarget.id);
      onNotify('info', 'Student Deleted', `Removed ${deleteTarget.fullName} from directory.`);
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', 'Delete Failed', err instanceof Error ? err.message : 'Could not delete student');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, registration ID, or email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {filtered.length} of {students.length} students
            </span>
            {canEdit && (
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-slate-100">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={semFilter}
            onChange={(e) => setSemFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={String(s)}>
                Semester {s}
              </option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Enrollment Years</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                Class of {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-900">No students match your filters</p>
            <p className="text-xs text-slate-500 mt-1">
              Try clearing your search query or adjusting course and semester filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('reg')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>Reg. Number</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('name')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>Student</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold">Course & Department</th>
                  <th className="px-4 py-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('semester')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>Semester</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('gpa')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>GPA</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono tabular-nums font-medium text-[#0B1F3A] whitespace-nowrap">
                      {stu.registrationNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={stu.avatar} name={stu.fullName} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{stu.fullName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{stu.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{stu.course}</p>
                      <p className="text-[11px] text-slate-500">{stu.department}</p>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      Sem {stu.semester} · {stu.enrollmentYear}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums font-semibold text-slate-900 text-right">
                      {stu.gpa.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          stu.status === 'Active'
                            ? 'text-emerald-700'
                            : stu.status === 'On Leave'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {stu.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewStudent(stu)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(stu)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Edit Student"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(stu)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Student Details Modal */}
      {viewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-[#0B1F3A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Avatar src={viewStudent.avatar} name={viewStudent.fullName} size="lg" />
                <div>
                  <h3 className="font-display text-base font-bold">{viewStudent.fullName}</h3>
                  <p className="text-xs text-blue-200 font-mono">
                    {viewStudent.registrationNumber} · {viewStudent.course}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewStudent(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500">Email Address</p>
                <p className="font-semibold text-slate-900 mt-0.5">{viewStudent.email}</p>
              </div>
              <div>
                <p className="text-slate-500">Phone Number</p>
                <p className="font-semibold text-slate-900 mt-0.5">{viewStudent.phone}</p>
              </div>
              <div>
                <p className="text-slate-500">Date of Birth</p>
                <p className="font-semibold font-mono text-slate-900 mt-0.5">{viewStudent.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-slate-500">Gender</p>
                <p className="font-semibold text-slate-900 mt-0.5">{viewStudent.gender}</p>
              </div>
              <div>
                <p className="text-slate-500">Department</p>
                <p className="font-semibold text-slate-900 mt-0.5">{viewStudent.department}</p>
              </div>
              <div>
                <p className="text-slate-500">Semester & Year</p>
                <p className="font-semibold font-mono text-slate-900 mt-0.5">
                  Semester {viewStudent.semester} · Enrolled {viewStudent.enrollmentYear}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Admission Date</p>
                <p className="font-semibold font-mono text-slate-900 mt-0.5">{viewStudent.admissionDate}</p>
              </div>
              <div>
                <p className="text-slate-500">Cumulative GPA / Status</p>
                <p className="font-semibold font-mono text-slate-900 mt-0.5">
                  {viewStudent.gpa.toFixed(2)} · {viewStudent.status}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-500">Residential Address</p>
                <p className="font-semibold text-slate-900 mt-0.5">{viewStudent.address}</p>
              </div>
              <div>
                <p className="text-slate-500">Guardian Name</p>
                <p className="font-semibold text-slate-900 mt-0.5">{viewStudent.guardianName}</p>
              </div>
              <div>
                <p className="text-slate-500">Guardian Contact</p>
                <p className="font-semibold text-slate-900 mt-0.5">{viewStudent.guardianContact}</p>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewStudent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="font-display text-base font-bold text-slate-900">
                {editingId ? 'Edit Student Record' : 'Enroll New Student'}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}

              {/* Profile Picture Upload */}
              <div className="flex items-center gap-4 pb-3 border-b border-slate-100">
                <Avatar src={form.avatar} name={form.fullName || 'Student'} size="lg" />
                <div>
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Profile Picture</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">PNG or JPG up to 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registration Number *</label>
                  <input
                    type="text"
                    required
                    value={form.registrationNumber || ''}
                    onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
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
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth || ''}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={form.gender || 'Female'}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as Student['gender'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course *</label>
                  <select
                    value={form.course || ''}
                    onChange={(e) => {
                      const c = courses.find((item) => item.name === e.target.value);
                      setForm({
                        ...form,
                        course: e.target.value,
                        department: c?.department || form.department,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
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
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={form.semester || 1}
                    onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admission Date</label>
                  <input
                    type="date"
                    value={form.admissionDate || ''}
                    onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Enrollment Year</label>
                  <input
                    type="number"
                    value={form.enrollmentYear || 2026}
                    onChange={(e) => setForm({ ...form, enrollmentYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status || 'Active'}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Student['status'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={form.address || ''}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guardian Name *</label>
                  <input
                    type="text"
                    required
                    value={form.guardianName || ''}
                    onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guardian Contact *</label>
                  <input
                    type="text"
                    required
                    value={form.guardianContact || ''}
                    onChange={(e) => setForm({ ...form, guardianContact: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Student' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Student Record"
        description={`Are you sure you want to permanently remove ${deleteTarget?.fullName} (${deleteTarget?.registrationNumber})? Associated attendance, fee ledgers, and results will also be removed.`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
