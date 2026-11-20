import { useMemo, useState } from 'react';
import { BookOpen, Building2, Layers, Plus, Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '../components/Toast';
import { simsApi } from '../services/api';
import type { Course, Department, Subject, Teacher, UserRole } from '../types/sims';

interface CoursesSubjectsPageProps {
  role: UserRole;
  courses: Course[];
  departments: Department[];
  subjects: Subject[];
  teachers: Teacher[];
  onCourseCreated: (c: Course) => void;
  onCourseDeleted: (id: string) => void;
  onDeptCreated: (d: Department) => void;
  onDeptDeleted: (id: string) => void;
  onSubjectCreated: (s: Subject) => void;
  onSubjectDeleted: (id: string) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function CoursesSubjectsPage({
  role,
  courses,
  departments,
  subjects,
  teachers,
  onCourseCreated,
  onCourseDeleted,
  onDeptCreated,
  onDeptDeleted,
  onSubjectCreated,
  onSubjectDeleted,
  onNotify,
}: CoursesSubjectsPageProps) {
  const canEdit = role === 'admin';
  const [tab, setTab] = useState<'courses' | 'subjects' | 'departments'>('courses');
  const [semesterFilter, setSemesterFilter] = useState('All');

  // Modals
  const [courseModal, setCourseModal] = useState(false);
  const [deptModal, setDeptModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    department: departments[0]?.name || '',
    durationYears: 4,
    totalSemesters: 8,
    totalCredits: 128,
    tuitionPerSemester: 6400,
    description: '',
  });

  const [deptForm, setDeptForm] = useState({
    code: '',
    name: '',
    headOfDepartment: teachers[0]?.fullName || '',
    building: '',
    establishedYear: 2020,
  });

  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    course: courses[0]?.name || '',
    department: courses[0]?.department || '',
    semester: 1,
    credits: 4,
    teacherId: teachers[0]?.id || '',
  });

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'course' | 'dept' | 'subject';
    id: string;
    label: string;
  } | null>(null);

  const filteredSubjects = useMemo(
    () =>
      subjects.filter((s) =>
        semesterFilter === 'All' ? true : String(s.semester) === semesterFilter
      ),
    [subjects, semesterFilter]
  );

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await simsApi.createCourse(courseForm);
      onCourseCreated(created);
      setCourseModal(false);
      onNotify('success', 'Course Added', `${created.name} (${created.code}) created.`);
    } catch (err) {
      onNotify('error', 'Failed', err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await simsApi.createDepartment(deptForm);
      onDeptCreated(created);
      setDeptModal(false);
      onNotify('success', 'Department Created', created.name);
    } catch (err) {
      onNotify('error', 'Failed', err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await simsApi.createSubject(subjectForm);
      onSubjectCreated(created);
      setSubjectModal(false);
      onNotify('success', 'Subject Added', `${created.code} · ${created.name}`);
    } catch (err) {
      onNotify('error', 'Failed', err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'course') {
        await simsApi.deleteCourse(deleteTarget.id);
        onCourseDeleted(deleteTarget.id);
      } else if (deleteTarget.type === 'dept') {
        await simsApi.deleteDepartment(deleteTarget.id);
        onDeptDeleted(deleteTarget.id);
      } else {
        await simsApi.deleteSubject(deleteTarget.id);
        onSubjectDeleted(deleteTarget.id);
      }
      onNotify('info', 'Removed', `${deleteTarget.label} deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', 'Delete Failed', err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Segmented Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setTab('courses')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              tab === 'courses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Courses ({courses.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('subjects')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              tab === 'subjects' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subjects ({subjects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('departments')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              tab === 'departments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Departments ({departments.length})</span>
          </button>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => {
              if (tab === 'courses') setCourseModal(true);
              else if (tab === 'subjects') setSubjectModal(true);
              else setDeptModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>
              {tab === 'courses'
                ? 'Add Course'
                : tab === 'subjects'
                ? 'Add Subject'
                : 'Add Department'}
            </span>
          </button>
        )}
      </div>

      {/* Courses Tab */}
      {tab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-blue-700">{c.code}</span>
                  <span className="font-mono tabular-nums text-slate-500">
                    {c.durationYears} Years · {c.totalSemesters} Semesters
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-slate-900 mt-1.5">{c.name}</h3>
                <p className="text-xs font-medium text-slate-600 mt-0.5">{c.department}</p>
                <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">{c.description}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-mono tabular-nums text-slate-700">
                  {c.totalCredits} Credits · ${c.tuitionPerSemester.toLocaleString()}/sem
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: 'course', id: c.id, label: c.name })}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subjects Tab */}
      {tab === 'subjects' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <span className="text-xs font-semibold text-slate-700">Semester-wise Curriculum</span>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="All">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Subject Name</th>
                  <th className="px-4 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold">Semester</th>
                  <th className="px-4 py-3 font-semibold">Assigned Teacher</th>
                  <th className="px-4 py-3 font-semibold text-right">Credits</th>
                  {canEdit && <th className="px-4 py-3 font-semibold text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-700">{s.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-slate-700">{s.course}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">Sem {s.semester}</td>
                    <td className="px-4 py-3 text-slate-700">{s.teacherName}</td>
                    <td className="px-4 py-3 font-mono tabular-nums text-right text-slate-900">{s.credits}</td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'subject', id: s.id, label: s.name })}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {tab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-blue-700">{d.code}</span>
                  <span className="font-mono text-slate-500">Est. {d.establishedYear}</span>
                </div>
                <h3 className="font-display text-base font-bold text-slate-900 mt-1">{d.name}</h3>
                <p className="text-xs text-slate-600 mt-2">
                  Chair: <strong className="text-slate-900">{d.headOfDepartment}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Location: {d.building}</p>
              </div>
              {canEdit && (
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: 'dept', id: d.id, label: d.name })}
                    className="text-xs font-medium text-rose-600 hover:underline"
                  >
                    Remove Department
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      {courseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">Add New Course</h3>
              <button type="button" onClick={() => setCourseModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course Code *</label>
                  <input required value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} placeholder="BS-SE" className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Years)</label>
                  <input type="number" min={1} value={courseForm.durationYears} onChange={(e) => setCourseForm({ ...courseForm, durationYears: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Name *</label>
                <input required value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} placeholder="B.S. Software Engineering" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <select value={courseForm.department} onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semesters</label>
                  <input type="number" min={2} value={courseForm.totalSemesters} onChange={(e) => setCourseForm({ ...courseForm, totalSemesters: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tuition / Semester ($)</label>
                  <input type="number" min={500} value={courseForm.tuitionPerSemester} onChange={(e) => setCourseForm({ ...courseForm, tuitionPerSemester: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea rows={2} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setCourseModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg font-semibold">Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {subjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">Add Semester Subject</h3>
              <button type="button" onClick={() => setSubjectModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateSubject} className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject Code *</label>
                  <input required value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} placeholder="CS410" className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credits</label>
                  <input type="number" min={1} max={6} value={subjectForm.credits} onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Name *</label>
                <input required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Cloud Architecture" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course</label>
                  <select value={subjectForm.course} onChange={(e) => setSubjectForm({ ...subjectForm, course: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                    {courses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <select value={subjectForm.semester} onChange={(e) => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Teacher</label>
                <select value={subjectForm.teacherId} onChange={(e) => setSubjectForm({ ...subjectForm, teacherId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName} ({t.department})</option>)}
                </select>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setSubjectModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg font-semibold">Add Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {deptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">Add Department</h3>
              <button type="button" onClick={() => setDeptModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateDept} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code *</label>
                <input required value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} placeholder="BIO" className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
                <input required value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="Biomedical Engineering" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Head of Department</label>
                <input required value={deptForm.headOfDepartment} onChange={(e) => setDeptForm({ ...deptForm, headOfDepartment: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Building</label>
                <input required value={deptForm.building} onChange={(e) => setDeptForm({ ...deptForm, building: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setDeptModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg font-semibold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Confirm Removal"
        description={`Delete "${deleteTarget?.label}" from the academic catalog?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
