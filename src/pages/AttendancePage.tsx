import { useMemo, useState } from 'react';
import { CalendarCheck, Check, Search } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { AttendanceBarChart } from '../components/Charts';
import { simsApi } from '../services/api';
import type {
  AttendanceRecord,
  AttendanceStatus,
  AuthUser,
  Course,
  Student,
  Subject,
} from '../types/sims';

interface AttendancePageProps {
  user: AuthUser;
  students: Student[];
  courses: Course[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  onSaved: (records: AttendanceRecord[]) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function AttendancePage({
  user,
  students,
  courses,
  subjects,
  attendance,
  onSaved,
  onNotify,
}: AttendancePageProps) {
  const isStudent = user.role === 'student';
  const [tab, setTab] = useState<'mark' | 'records' | 'report'>(isStudent ? 'records' : 'mark');

  // Marking Controls
  const [markDate, setMarkDate] = useState('2026-11-14');
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.name || 'B.S. Computer Science');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.code || 'CS301');
  const [draftMarks, setDraftMarks] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  // Records Search
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const courseStudents = useMemo(
    () => students.filter((s) => s.course === selectedCourse && s.status === 'Active'),
    [students, selectedCourse]
  );

  const courseSubjects = useMemo(
    () => subjects.filter((s) => s.course === selectedCourse),
    [subjects, selectedCourse]
  );

  const getStatusForStudent = (studentId: string): AttendanceStatus => {
    if (draftMarks[studentId]) return draftMarks[studentId];
    const existing = attendance.find(
      (a) => a.date === markDate && a.studentId === studentId && a.subjectCode === selectedSubject
    );
    return existing?.status || 'Present';
  };

  const handleMarkAllPresent = () => {
    const next: Record<string, AttendanceStatus> = { ...draftMarks };
    courseStudents.forEach((s) => {
      next[s.id] = 'Present';
    });
    setDraftMarks(next);
  };

  const handleSaveAttendance = async () => {
    if (courseStudents.length === 0) return;
    setSaving(true);
    try {
      const payload = courseStudents.map((stu) => ({
        date: markDate,
        studentId: stu.id,
        studentName: stu.fullName,
        registrationNumber: stu.registrationNumber,
        course: stu.course,
        semester: stu.semester,
        subjectCode: selectedSubject,
        status: getStatusForStudent(stu.id),
        markedBy: user.name,
      }));
      const res = await simsApi.saveAttendance(payload, user.name, user.role);
      onSaved(res.records);
      setDraftMarks({});
      onNotify(
        'success',
        'Attendance Saved',
        `Recorded ${res.saved} attendance entries for ${markDate} (${selectedSubject}).`
      );
    } catch (err) {
      onNotify('error', 'Save Failed', err instanceof Error ? err.message : 'Could not save attendance');
    } finally {
      setSaving(false);
    }
  };

  const visibleRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return attendance.filter((a) => {
      if (isStudent && user.linkedEntityId && a.studentId !== user.linkedEntityId) return false;
      if (dateFilter && a.date !== dateFilter) return false;
      if (
        q &&
        !a.studentName.toLowerCase().includes(q) &&
        !a.registrationNumber.toLowerCase().includes(q) &&
        !a.subjectCode.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [attendance, isStudent, user.linkedEntityId, dateFilter, search]);

  const studentSummary = useMemo(() => {
    const targetStudents = isStudent
      ? students.filter((s) => s.id === user.linkedEntityId)
      : students;
    return targetStudents.map((stu) => {
      const rows = attendance.filter((a) => a.studentId === stu.id);
      const present = rows.filter((r) => r.status === 'Present').length;
      const absent = rows.filter((r) => r.status === 'Absent').length;
      const leave = rows.filter((r) => r.status === 'Leave').length;
      const pct = rows.length > 0 ? Math.round((present / rows.length) * 100) : 100;
      return { stu, total: rows.length, present, absent, leave, pct };
    });
  }, [students, attendance, isStudent, user.linkedEntityId]);

  const chartData = useMemo(() => {
    const dates = Array.from(new Set(visibleRecords.map((a) => a.date)))
      .sort()
      .slice(-7);
    return dates.map((d) => {
      const dayRows = visibleRecords.filter((a) => a.date === d);
      return {
        label: d.slice(5),
        present: dayRows.filter((r) => r.status === 'Present').length,
        leave: dayRows.filter((r) => r.status === 'Leave').length,
        absent: dayRows.filter((r) => r.status === 'Absent').length,
      };
    });
  }, [visibleRecords]);

  return (
    <div className="space-y-5">
      {/* Segmented Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          {!isStudent && (
            <button
              type="button"
              onClick={() => setTab('mark')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                tab === 'mark' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mark Daily Attendance
            </button>
          )}
          <button
            type="button"
            onClick={() => setTab('records')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              tab === 'records' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Records
          </button>
          <button
            type="button"
            onClick={() => setTab('report')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              tab === 'report' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Report & Charts
          </button>
        </div>
      </div>

      {/* Tab 1: Mark Daily Attendance */}
      {tab === 'mark' && !isStudent && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-end justify-between gap-4 bg-slate-50/60">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={markDate}
                  onChange={(e) => setMarkDate(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    const nextCourse = e.target.value;
                    setSelectedCourse(nextCourse);
                    const sub = subjects.find((s) => s.course === nextCourse);
                    if (sub) setSelectedSubject(sub.code);
                  }}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {(courseSubjects.length > 0 ? courseSubjects : subjects).map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.code} · {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={saving || courseStudents.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
              </button>
            </div>
          </div>

          {courseStudents.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No active students enrolled in {selectedCourse}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Reg. Number</th>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Semester</th>
                    <th className="px-4 py-3 font-semibold text-right">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courseStudents.map((stu) => {
                    const status = getStatusForStudent(stu.id);
                    return (
                      <tr key={stu.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono text-slate-700">{stu.registrationNumber}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar src={stu.avatar} name={stu.fullName} size="sm" />
                            <span className="font-semibold text-slate-900">{stu.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">Sem {stu.semester}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                            {(['Present', 'Absent', 'Leave'] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  setDraftMarks((prev) => ({ ...prev, [stu.id]: opt }))
                                }
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                                  status === opt
                                    ? opt === 'Present'
                                      ? 'bg-emerald-600 text-white'
                                      : opt === 'Absent'
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-amber-500 text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Records Search */}
      {tab === 'records' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student, reg no., or subject..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  Clear date
                </button>
              )}
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {visibleRecords.length} records
            </span>
          </div>

          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Reg. Number</th>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Marked By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRecords.slice(0, 80).map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono tabular-nums text-slate-700">{rec.date}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">{rec.registrationNumber}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{rec.studentName}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-700">{rec.subjectCode}</td>
                    <td className="px-4 py-2.5 font-semibold">
                      <span
                        className={
                          rec.status === 'Present'
                            ? 'text-emerald-700'
                            : rec.status === 'Absent'
                            ? 'text-rose-600'
                            : 'text-amber-700'
                        }
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{rec.markedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Monthly Report & Charts */}
      {tab === 'report' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CalendarCheck className="w-4 h-4 text-[#1D4ED8]" />
              <h3 className="font-display text-sm font-bold text-slate-900">
                Visual Attendance Breakdown
              </h3>
            </div>
            <AttendanceBarChart data={chartData} />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Student Attendance Percentage Report
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Course</th>
                    <th className="px-4 py-3 font-semibold text-right">Present</th>
                    <th className="px-4 py-3 font-semibold text-right">Leave</th>
                    <th className="px-4 py-3 font-semibold text-right">Absent</th>
                    <th className="px-4 py-3 font-semibold text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentSummary.map(({ stu, present, leave, absent, pct }) => (
                    <tr key={stu.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={stu.avatar} name={stu.fullName} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-900">{stu.fullName}</p>
                            <p className="text-[11px] font-mono text-slate-500">
                              {stu.registrationNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{stu.course}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-right text-emerald-700 font-semibold">
                        {present}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-right text-amber-700">
                        {leave}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-right text-rose-600">
                        {absent}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2.5 justify-end">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct >= 75 ? 'bg-[#1D4ED8]' : 'bg-rose-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono tabular-nums font-bold ${
                              pct >= 75 ? 'text-slate-900' : 'text-rose-600'
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
