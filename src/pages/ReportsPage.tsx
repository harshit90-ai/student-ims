import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { DepartmentDonutChart, PerformanceLineChart } from '../components/Charts';
import type { PublicSimsData } from '../services/api';

interface ReportsPageProps {
  data: PublicSimsData;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const DEPT_COLORS = ['#0B1F3A', '#1D4ED8', '#0EA5E9', '#10B981', '#F59E0B'];

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage({ data, onNotify }: ReportsPageProps) {
  const totalFee = data.fees.reduce((s, f) => s + f.totalFee, 0);
  const collectedFee = data.fees.reduce((s, f) => s + f.paidFee, 0);
  const collectionPct = totalFee > 0 ? Math.round((collectedFee / totalFee) * 100) : 0;

  const presentCount = data.attendance.filter((a) => a.status === 'Present').length;
  const attendancePct =
    data.attendance.length > 0 ? Math.round((presentCount / data.attendance.length) * 100) : 100;

  const avgGpa =
    data.students.length > 0
      ? (data.students.reduce((s, st) => s + st.gpa, 0) / data.students.length).toFixed(2)
      : '0.00';

  const deptSlices = data.departments.map((d, i) => ({
    label: d.name,
    value: data.students.filter((s) => s.department === d.name).length,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  const exportStudentsCsv = () => {
    downloadCsv(
      'cgc-students-report.csv',
      ['Registration #', 'Full Name', 'Email', 'Course', 'Department', 'Semester', 'GPA', 'Status'],
      data.students.map((s) => [
        s.registrationNumber,
        s.fullName,
        s.email,
        s.course,
        s.department,
        s.semester,
        s.gpa,
        s.status,
      ])
    );
    onNotify('success', 'CSV Exported', 'Downloaded cgc-students-report.csv');
  };

  const exportFeesCsv = () => {
    downloadCsv(
      'cgc-fees-report.csv',
      ['Registration #', 'Student', 'Course', 'Total Fee', 'Paid Fee', 'Pending Fee', 'Status'],
      data.fees.map((f) => [
        f.registrationNumber,
        f.studentName,
        f.course,
        f.totalFee,
        f.paidFee,
        f.pendingFee,
        f.status,
      ])
    );
    onNotify('success', 'CSV Exported', 'Downloaded cgc-fees-report.csv');
  };

  const exportResultsCsv = () => {
    downloadCsv(
      'cgc-results-report.csv',
      ['Registration #', 'Student', 'Subject', 'Marks', 'Max Marks', 'Grade', 'Remarks'],
      data.results.map((r) => [
        r.registrationNumber,
        r.studentName,
        `${r.subjectCode} - ${r.subjectName}`,
        r.marksObtained,
        r.maxMarks,
        r.grade,
        r.remarks,
      ])
    );
    onNotify('success', 'CSV Exported', 'Downloaded cgc-results-report.csv');
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Institutional Mean GPA</p>
          <p className="font-display text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {avgGpa}
          </p>
          <p className="text-xs text-slate-500 mt-1">Across {data.students.length} enrolled students</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Overall Attendance</p>
          <p className="font-display text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {attendancePct}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Target threshold: {data.settings.attendanceThreshold}%
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Tuition Collection Rate</p>
          <p className="font-display text-2xl font-bold font-mono tabular-nums text-blue-700 mt-1">
            {collectionPct}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            ${collectedFee.toLocaleString()} of ${totalFee.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-500">Print Institutional Summary</p>
            <p className="text-xs text-slate-600 mt-1">Generate board-ready PDF print view</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#0B1F3A] text-white text-xs font-semibold rounded-lg hover:bg-[#102A43]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Exportable CSV Datasets */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="w-4 h-4 text-[#1D4ED8]" />
          <h2 className="font-display text-base font-bold text-slate-900">
            Export Official CSV Reports
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Student Roster</p>
              <p className="text-xs text-slate-500">{data.students.length} records · GPA & status</p>
            </div>
            <button
              type="button"
              onClick={exportStudentsCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg hover:bg-[#1E40AF] shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>

          <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Tuition Fee Ledger</p>
              <p className="text-xs text-slate-500">{data.fees.length} ledgers · Paid & pending</p>
            </div>
            <button
              type="button"
              onClick={exportFeesCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg hover:bg-[#1E40AF] shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>

          <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Examination Results</p>
              <p className="text-xs text-slate-500">{data.results.length} grade entries</p>
            </div>
            <button
              type="button"
              onClick={exportResultsCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg hover:bg-[#1E40AF] shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-display text-sm font-bold text-slate-900 mb-3">
            Department Enrollment Distribution
          </h3>
          <DepartmentDonutChart slices={deptSlices} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-display text-sm font-bold text-slate-900 mb-3">
            Academic Score Progression
          </h3>
          <PerformanceLineChart
            data={[
              { label: 'Sem 1', avgScore: 76, passRate: 91 },
              { label: 'Sem 2', avgScore: 79, passRate: 93 },
              { label: 'Sem 3', avgScore: 82, passRate: 94 },
              { label: 'Sem 4', avgScore: 85, passRate: 96 },
              { label: 'Fall 26', avgScore: 89, passRate: 97 },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

