import { useState } from 'react';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CalendarCheck,
  Clock,
  CreditCard,
  Edit3,
  GraduationCap,
  Users,
  UserCheck,
  UserSquare2,
  X,
} from 'lucide-react';
import { Avatar } from '../components/Avatar';
import {
  AttendanceBarChart,
  DepartmentDonutChart,
  PerformanceLineChart,
} from '../components/Charts';
import { simsApi, type PublicSimsData } from '../services/api';
import type { AuthUser, NavSection, Student } from '../types/sims';

interface DashboardPageProps {
  user: AuthUser;
  data: PublicSimsData;
  onNavigate: (section: NavSection) => void;
  onUpdateStudent: (updated: Student) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const DEPT_COLORS = ['#0B1F3A', '#1D4ED8', '#0EA5E9', '#10B981', '#F59E0B', '#6366F1'];

export function DashboardPage({
  user,
  data,
  onNavigate,
  onUpdateStudent,
  onNotify,
}: DashboardPageProps) {
  // Student Portal state for editing permitted profile details
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const currentStudent =
    user.role === 'student'
      ? data.students.find((s) => s.id === user.linkedEntityId) || data.students[0]
      : null;

  const [phone, setPhone] = useState(currentStudent?.phone || '');
  const [address, setAddress] = useState(currentStudent?.address || '');
  const [guardianContact, setGuardianContact] = useState(currentStudent?.guardianContact || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // If Student role, render dedicated Student Portal Dashboard
  if (user.role === 'student' && currentStudent) {
    const myAttendance = data.attendance.filter((a) => a.studentId === currentStudent.id);
    const presentCount = myAttendance.filter((a) => a.status === 'Present').length;
    const attendancePct =
      myAttendance.length > 0 ? Math.round((presentCount / myAttendance.length) * 100) : 100;

    const myFee = data.fees.find((f) => f.studentId === currentStudent.id);
    const myResults = data.results.filter((r) => r.studentId === currentStudent.id);
    const mySubjects = data.subjects.filter(
      (sub) => sub.course === currentStudent.course && sub.semester === currentStudent.semester
    );
    const upcomingExams = data.exams.filter(
      (ex) => ex.status === 'Upcoming' && ex.course === currentStudent.course
    );

    const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setSavingProfile(true);
      try {
        const updated = await simsApi.updateStudent(currentStudent.id, {
          phone,
          address,
          guardianContact,
          _actor: currentStudent.fullName,
          _role: 'student',
        });
        onUpdateStudent(updated);
        setEditProfileOpen(false);
        onNotify('success', 'Profile Updated', 'Your permitted contact details have been saved.');
      } catch (err) {
        onNotify('error', 'Update Failed', err instanceof Error ? err.message : 'Could not update profile');
      } finally {
        setSavingProfile(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Student Profile Summary Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <Avatar src={currentStudent.avatar} name={currentStudent.fullName} size="xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-semibold text-blue-700">
                  {currentStudent.registrationNumber}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentStudent.course}</span>
                <span aria-hidden="true">·</span>
                <span>Semester {currentStudent.semester}</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900 mt-1">
                {currentStudent.fullName}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                {currentStudent.email} · {currentStudent.phone}
              </p>
              <p className="text-xs text-slate-500 mt-1">{currentStudent.address}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setPhone(currentStudent.phone);
                setAddress(currentStudent.address);
                setGuardianContact(currentStudent.guardianContact);
                setEditProfileOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Update Contact Info</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('results')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              <span>View Marksheet</span>
            </button>
          </div>
        </div>

        {/* Student KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Current GPA</span>
              <GraduationCap className="w-4 h-4 text-[#1D4ED8]" />
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-2">
              {currentStudent.gpa.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 mt-1">4.00 institutional scale</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Attendance Rate</span>
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-2">
              {attendancePct}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {presentCount} of {myAttendance.length} sessions present
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Enrolled Subjects</span>
              <BookOpen className="w-4 h-4 text-[#0B1F3A]" />
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-2">
              {mySubjects.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Semester {currentStudent.semester} curriculum</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Fee Status</span>
              <CreditCard className="w-4 h-4 text-amber-600" />
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-2">
              ${myFee ? myFee.pendingFee.toLocaleString() : 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {myFee ? `${myFee.status} · Due ${myFee.dueDate}` : 'No pending dues'}
            </p>
          </div>
        </div>

        {/* Two-column Enrolled Subjects & Upcoming Exams */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-900">Enrolled Subjects</h3>
              <button
                type="button"
                onClick={() => onNavigate('courses')}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Full Curriculum →
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {mySubjects.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">No subjects mapped to this semester yet.</p>
              ) : (
                mySubjects.map((sub) => (
                  <div key={sub.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-mono font-semibold text-blue-700">{sub.code}</p>
                      <p className="text-sm font-semibold text-slate-900">{sub.name}</p>
                      <p className="text-xs text-slate-500">{sub.teacherName}</p>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-600">
                      {sub.credits} Credits
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Upcoming Examinations
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('examinations')}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                All Schedules →
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingExams.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">No upcoming exams scheduled.</p>
              ) : (
                upcomingExams.map((ex) => (
                  <div key={ex.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-mono font-semibold text-slate-500">
                        {ex.subjectCode} · {ex.room}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">{ex.subjectName}</p>
                      <p className="text-xs text-slate-500">{ex.time}</p>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-semibold text-[#0B1F3A]">
                      {ex.date}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Results & Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-900">Recent Exam Results</h3>
              <button
                type="button"
                onClick={() => onNavigate('results')}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Download Marksheet →
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {myResults.map((r) => (
                <div key={r.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.subjectName}</p>
                    <p className="text-xs text-slate-500">
                      {r.subjectCode} · {r.remarks}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold tabular-nums text-slate-900">
                      {r.marksObtained}/{r.maxMarks}
                    </p>
                    <p className="text-xs font-semibold text-emerald-700">Grade {r.grade}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-900">College Announcements</h3>
              <button
                type="button"
                onClick={() => onNavigate('notices')}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Notice Board →
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {data.notices.slice(0, 4).map((n) => (
                <div key={n.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-blue-700">{n.category}</span>
                    <span className="font-mono tabular-nums">{n.publishDate}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{n.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Permitted Profile Edit Modal */}
        {editProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Update Permitted Profile Information
                </h3>
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guardian Contact Number
                  </label>
                  <input
                    type="text"
                    required
                    value={guardianContact}
                    onChange={(e) => setGuardianContact(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Academic fields (Registration ID, Course, Semester, GPA) are locked by the Registrar.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditProfileOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF]"
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ADMIN & TEACHER DASHBOARD
  const activeStudents = data.students.filter((s) => s.status === 'Active').length;
  const totalAttendance = data.attendance.length || 1;
  const presentAttendance = data.attendance.filter((a) => a.status === 'Present').length;
  const avgAttendancePct = Math.round((presentAttendance / totalAttendance) * 100);

  // Build Attendance Chart Data grouped by recent dates
  const uniqueDates = Array.from(new Set(data.attendance.map((a) => a.date)))
    .sort()
    .slice(-7);

  const attendanceChartData = uniqueDates.map((d) => {
    const dayRows = data.attendance.filter((a) => a.date === d);
    return {
      label: d.slice(5),
      present: dayRows.filter((r) => r.status === 'Present').length,
      leave: dayRows.filter((r) => r.status === 'Leave').length,
      absent: dayRows.filter((r) => r.status === 'Absent').length,
    };
  });

  // Performance trend based on current results average
  const avgExamScore =
    data.results.length > 0
      ? Math.round(
          data.results.reduce((sum, r) => sum + (r.marksObtained / r.maxMarks) * 100, 0) /
            data.results.length
        )
      : 84;

  const performanceData = [
    { label: 'Sem 1', avgScore: 76, passRate: 91 },
    { label: 'Sem 2', avgScore: 79, passRate: 93 },
    { label: 'Sem 3', avgScore: 82, passRate: 94 },
    { label: 'Sem 4', avgScore: 85, passRate: 96 },
    { label: 'Fall 26', avgScore: avgExamScore, passRate: 97 },
  ];

  // Department Donut Slices
  const deptCounts = data.departments.map((dept, idx) => ({
    label: dept.name,
    value: data.students.filter((s) => s.department === dept.name).length,
    color: DEPT_COLORS[idx % DEPT_COLORS.length],
  }));

  const recentAdmissions = [...data.students]
    .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate))
    .slice(0, 5);

  const statCards = [
    {
      label: 'Total Students',
      value: data.students.length,
      sub: `${activeStudents} active enrolled`,
      icon: Users,
      onClick: () => onNavigate('students'),
    },
    {
      label: 'Total Teachers',
      value: data.teachers.length,
      sub: 'Full-time faculty',
      icon: UserSquare2,
      onClick: () => onNavigate('teachers'),
    },
    {
      label: 'Total Courses',
      value: data.courses.length,
      sub: `${data.subjects.length} active subjects`,
      icon: BookOpen,
      onClick: () => onNavigate('courses'),
    },
    {
      label: 'Departments',
      value: data.departments.length,
      sub: 'Academic schools',
      icon: Building2,
      onClick: () => onNavigate('courses'),
    },
    {
      label: 'Active Students',
      value: activeStudents,
      sub: `${Math.round((activeStudents / (data.students.length || 1)) * 100)}% retention`,
      icon: UserCheck,
      onClick: () => onNavigate('students'),
    },
    {
      label: 'Attendance Rate',
      value: `${avgAttendancePct}%`,
      sub: `${data.attendance.length} logged marks`,
      icon: CalendarCheck,
      onClick: () => onNavigate('attendance'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="text-left bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <Icon className="w-4 h-4 text-[#1D4ED8] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-2">
                {card.value}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 truncate">{card.sub}</p>
            </button>
          );
        })}
      </div>

      {/* Charts Row: Attendance Overview & Student Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Attendance Overview
              </h2>
              <p className="text-xs text-slate-500">Daily student presence across recent sessions</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('attendance')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
            >
              <span>Mark Today</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <AttendanceBarChart data={attendanceChartData} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Student Performance Trend
              </h2>
              <p className="text-xs text-slate-500">Mean assessment score and pass progression</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('results')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
            >
              <span>View Results</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <PerformanceLineChart data={performanceData} />
        </div>
      </div>

      {/* Third Row: Department Distribution & Recent Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-display text-base font-bold text-slate-900">
            Enrollment by Department
          </h2>
          <p className="text-xs text-slate-500 mb-5">Active student distribution across schools</p>
          <DepartmentDonutChart slices={deptCounts} />
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Recent Admissions</h2>
              <p className="text-xs text-slate-500">Latest student enrollments verified by Registrar</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('students')}
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              Manage Students →
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Student</th>
                  <th className="px-4 py-2.5 font-semibold">Reg. No.</th>
                  <th className="px-4 py-2.5 font-semibold">Course</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Admission Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAdmissions.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={stu.avatar} name={stu.fullName} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900">{stu.fullName}</p>
                          <p className="text-[11px] text-slate-500">{stu.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-slate-700">
                      {stu.registrationNumber}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{stu.course}</td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-slate-600 text-right">
                      {stu.admissionDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fourth Row: Recent Activities & Upcoming Events/Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h2 className="font-display text-base font-bold text-slate-900">Recent Activities</h2>
            </div>
            <span className="text-xs text-slate-500">Live audit stream</span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.activities.slice(0, 5).map((act) => (
              <div key={act.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-900">{act.actor}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-blue-700 font-medium">{act.action}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">{act.detail}</p>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                  {act.timestamp.slice(0, 10)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h2 className="font-display text-base font-bold text-slate-900">
                Upcoming Events & Notices
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('notices')}
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              All Notices →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {data.notices.slice(0, 4).map((n) => (
              <div key={n.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-blue-700">{n.category}</span>
                  <span className="font-mono tabular-nums">
                    {n.eventDate ? `Event: ${n.eventDate}` : n.publishDate}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{n.title}</p>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
