import { useMemo, useState } from 'react';
import { Award, FileText, Plus, Printer, Search, Trash2, X } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { simsApi } from '../services/api';
import type { AuthUser, Exam, ExamResult, Student } from '../types/sims';

interface ResultsPageProps {
  user: AuthUser;
  students: Student[];
  exams: Exam[];
  results: ExamResult[];
  onSaved: (res: ExamResult) => void;
  onDeleted: (id: string) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function ResultsPage({
  user,
  students,
  exams,
  results,
  onSaved,
  onDeleted,
  onNotify,
}: ResultsPageProps) {
  const isStudent = user.role === 'student';
  const canEdit = user.role === 'admin' || user.role === 'teacher';

  const [search, setSearch] = useState('');
  const [entryModal, setEntryModal] = useState(false);
  const [marksheetStudent, setMarksheetStudent] = useState<Student | null>(null);

  const [examId, setExamId] = useState(exams[0]?.id || '');
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [marksObtained, setMarksObtained] = useState(85);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const visibleResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    return results.filter((r) => {
      if (isStudent && user.linkedEntityId && r.studentId !== user.linkedEntityId) return false;
      if (
        q &&
        !r.studentName.toLowerCase().includes(q) &&
        !r.registrationNumber.toLowerCase().includes(q) &&
        !r.subjectCode.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [results, isStudent, user.linkedEntityId, search]);

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await simsApi.saveResult({
        examId,
        studentId,
        marksObtained,
        remarks,
        actor: user.name,
        role: user.role,
      });
      onSaved(saved);
      setEntryModal(false);
      setRemarks('');
      onNotify(
        'success',
        'Marks Recorded',
        `${saved.studentName} · ${saved.subjectCode}: ${saved.marksObtained}/${saved.maxMarks} (${saved.grade})`
      );
    } catch (err) {
      onNotify('error', 'Failed', err instanceof Error ? err.message : 'Could not save marks');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await simsApi.deleteResult(id);
      onDeleted(id);
      onNotify('info', 'Result Removed', 'Mark entry deleted.');
    } catch (err) {
      onNotify('error', 'Delete Failed', err instanceof Error ? err.message : 'Error');
    }
  };

  // Marksheet computation
  const marksheetRows = useMemo(() => {
    if (!marksheetStudent) return [];
    return results.filter((r) => r.studentId === marksheetStudent.id);
  }, [marksheetStudent, results]);

  const marksheetTotals = useMemo(() => {
    const totalObtained = marksheetRows.reduce((s, r) => s + r.marksObtained, 0);
    const totalMax = marksheetRows.reduce((s, r) => s + r.maxMarks, 0);
    const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
    const overallGrade =
      pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F';
    return { totalObtained, totalMax, pct, overallGrade };
  }, [marksheetRows]);

  // Student-scoped quick marksheet trigger
  const myStudentObj = isStudent
    ? students.find((s) => s.id === user.linkedEntityId) || students[0]
    : null;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, reg no., or subject..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          {isStudent && myStudentObj && (
            <button
              type="button"
              onClick={() => setMarksheetStudent(myStudentObj)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B1F3A] text-white text-xs font-semibold rounded-lg hover:bg-[#102A43]"
            >
              <FileText className="w-4 h-4" />
              <span>View Official Marksheet</span>
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => setEntryModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add / Update Marks</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Examination</th>
                <th className="px-4 py-3 font-semibold text-right">Marks</th>
                <th className="px-4 py-3 font-semibold text-right">Percentage</th>
                <th className="px-4 py-3 font-semibold">Grade</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleResults.map((r) => {
                const pct = Math.round((r.marksObtained / r.maxMarks) * 100);
                const stuObj = students.find((s) => s.id === r.studentId);
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{r.studentName}</p>
                      <p className="text-[11px] font-mono text-slate-500">{r.registrationNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-blue-700">{r.subjectCode}</p>
                      <p className="text-[11px] text-slate-600">{r.subjectName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.examTitle}</td>
                    <td className="px-4 py-3 font-mono tabular-nums font-semibold text-slate-900 text-right">
                      {r.marksObtained} / {r.maxMarks}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-slate-700 text-right">
                      {pct}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono font-bold ${
                          r.grade === 'F' ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {r.grade}
                      </span>
                      <span className="text-slate-500 ml-1.5">· {r.remarks}</span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {stuObj && (
                          <button
                            type="button"
                            onClick={() => setMarksheetStudent(stuObj)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Marksheet</span>
                          </button>
                        )}
                        {user.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Update Marks Modal */}
      {entryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">Record Student Marks</h3>
              <button type="button" onClick={() => setEntryModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveMarks} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Examination</label>
                <select value={examId} onChange={(e) => setExamId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.subjectCode} · {ex.subjectName} ({ex.title})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Student</label>
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.registrationNumber} · {s.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Marks Obtained (0–100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={marksObtained}
                  onChange={(e) => setMarksObtained(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Auto-calculated if left blank"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setEntryModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg font-semibold">
                  {saving ? 'Saving...' : 'Save Marks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Marksheet Modal */}
      {marksheetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden print-only-container">
            <div className="bg-[#0B1F3A] text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-blue-300" />
                <div>
                  <h3 className="font-display text-lg font-bold">cgc University</h3>
                  <p className="text-xs text-blue-200">Official Academic Statement of Marks</p>
                </div>
              </div>
              <button type="button" onClick={() => setMarksheetStudent(null)} className="text-slate-300 hover:text-white no-print">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Header */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <Avatar src={marksheetStudent.avatar} name={marksheetStudent.fullName} size="lg" />
                  <div>
                    <p className="font-display text-base font-bold text-slate-900">
                      {marksheetStudent.fullName}
                    </p>
                    <p className="text-xs text-slate-600">
                      {marksheetStudent.course} · Semester {marksheetStudent.semester}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="text-slate-500">Registration No.</p>
                  <p className="font-mono font-bold text-slate-900">{marksheetStudent.registrationNumber}</p>
                </div>
              </div>

              {/* Subject-wise Marks */}
              {marksheetRows.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No examination results recorded yet for this student.
                </p>
              ) : (
                <>
                  <table className="w-full text-left border-collapse text-xs border border-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                      <tr>
                        <th className="px-3.5 py-2.5 font-semibold">Code</th>
                        <th className="px-3.5 py-2.5 font-semibold">Subject</th>
                        <th className="px-3.5 py-2.5 font-semibold text-right">Obtained</th>
                        <th className="px-3.5 py-2.5 font-semibold text-right">Max</th>
                        <th className="px-3.5 py-2.5 font-semibold text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {marksheetRows.map((row) => (
                        <tr key={row.id}>
                          <td className="px-3.5 py-2.5 font-mono font-semibold text-blue-700">{row.subjectCode}</td>
                          <td className="px-3.5 py-2.5 font-medium text-slate-900">{row.subjectName}</td>
                          <td className="px-3.5 py-2.5 font-mono tabular-nums text-right font-semibold">{row.marksObtained}</td>
                          <td className="px-3.5 py-2.5 font-mono tabular-nums text-right text-slate-500">{row.maxMarks}</td>
                          <td className="px-3.5 py-2.5 font-mono text-right font-bold text-emerald-700">{row.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <p className="text-slate-500">Total Marks</p>
                      <p className="font-display text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                        {marksheetTotals.totalObtained} / {marksheetTotals.totalMax}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Aggregate Percentage</p>
                      <p className="font-display text-lg font-bold font-mono tabular-nums text-blue-700 mt-0.5">
                        {marksheetTotals.pct}%
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Overall Grade</p>
                      <p className="font-display text-lg font-bold font-mono text-emerald-700 mt-0.5">
                        {marksheetTotals.overallGrade}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg hover:bg-[#1E40AF]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Marksheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMarksheetStudent(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

