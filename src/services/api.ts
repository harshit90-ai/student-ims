import type {
  ApiRequestLog,
  AttendanceRecord,
  AuthUser,
  Course,
  Department,
  Exam,
  ExamResult,
  FeeRecord,
  InstitutionSettings,
  Notice,
  PaymentTransaction,
  SimsDatabase,
  Student,
  Subject,
  Teacher,
  UserRole,
} from '../types/sims';

type LogListener = (logs: ApiRequestLog[]) => void;

const requestLogs: ApiRequestLog[] = [];
const listeners = new Set<LogListener>();

function emitLog(entry: ApiRequestLog) {
  requestLogs.unshift(entry);
  if (requestLogs.length > 50) requestLogs.pop();
  listeners.forEach((fn) => fn([...requestLogs]));
}

export function subscribeApiLogs(listener: LogListener): () => void {
  listeners.add(listener);
  listener([...requestLogs]);
  return () => {
    listeners.delete(listener);
  };
}

async function apiFetch<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: unknown,
  summary?: string
): Promise<T> {
  const start = performance.now();
  const res = await fetch(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const durationMs = Math.round(performance.now() - start);
  const data = await res.json().catch(() => ({}));

  emitLog({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    method,
    endpoint,
    status: res.status,
    durationMs,
    timestamp: new Date().toLocaleTimeString([], { hour12: false }),
    summary: summary || (res.ok ? 'OK' : data.error || 'Error'),
  });

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export type PublicSimsData = Omit<SimsDatabase, 'users'>;

export interface DbInspectResponse {
  engine: string;
  storageAdapter: string;
  fileSizeBytes: number;
  lastModified: string;
  tableCounts: { name: string; count: number }[];
  collections: Record<string, unknown>;
}

export const simsApi = {
  getPublicCourses: () =>
    apiFetch<{ id: string; code: string; name: string; department: string }[]>(
      'GET',
      '/api/public/courses',
      undefined,
      'Fetch available courses'
    ),

  getPublicCatalog: () =>
    apiFetch<{
      courses: { id: string; code: string; name: string; department: string }[];
      departments: { id: string; code: string; name: string }[];
    }>('GET', '/api/public/catalog', undefined, 'Fetch courses & departments'),

  login: (identifier: string, password: string, role?: UserRole) =>
    apiFetch<{ user: AuthUser }>('POST', '/api/auth/login', { identifier, password, role }, `Auth login (${role || 'any'})`),

  registerStudent: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    course: string;
    semester: number;
  }) =>
    apiFetch<{ user: AuthUser; student: Student }>(
      'POST',
      '/api/auth/register',
      payload,
      `Student registration (${payload.email})`
    ),

  registerTeacher: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    department: string;
    designation: string;
    experienceYears: number;
  }) =>
    apiFetch<{ user: AuthUser; teacher: Teacher }>(
      'POST',
      '/api/auth/register-teacher',
      payload,
      `Teacher registration (${payload.email})`
    ),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>('POST', '/api/auth/forgot-password', { email }, `Password reset (${email})`),

  bootstrap: () => apiFetch<PublicSimsData>('GET', '/api/bootstrap', undefined, 'Load SIMS workspace state'),

  // Students
  createStudent: (student: Partial<Student> & { _actor?: string }) =>
    apiFetch<Student>('POST', '/api/students', student, `Create student ${student.fullName}`),
  updateStudent: (id: string, data: Partial<Student> & { _actor?: string; _role?: UserRole }) =>
    apiFetch<Student>('PUT', `/api/students/${id}`, data, `Update student ${id}`),
  deleteStudent: (id: string) =>
    apiFetch<{ deleted: boolean }>('DELETE', `/api/students/${id}`, undefined, `Delete student ${id}`),

  // Teachers
  createTeacher: (teacher: Partial<Teacher>) =>
    apiFetch<Teacher>('POST', '/api/teachers', teacher, `Add faculty ${teacher.fullName}`),
  updateTeacher: (id: string, data: Partial<Teacher>) =>
    apiFetch<Teacher>('PUT', `/api/teachers/${id}`, data, `Update faculty ${id}`),
  deleteTeacher: (id: string) =>
    apiFetch<{ deleted: boolean }>('DELETE', `/api/teachers/${id}`, undefined, `Delete faculty ${id}`),

  // Attendance
  saveAttendance: (records: Omit<AttendanceRecord, 'id'>[], markedBy: string, role: UserRole) =>
    apiFetch<{ saved: number; records: AttendanceRecord[] }>(
      'POST',
      '/api/attendance',
      { records, markedBy, role },
      `Save ${records.length} attendance marks`
    ),

  // Departments, Courses & Subjects
  createDepartment: (dept: Partial<Department>) =>
    apiFetch<Department>('POST', '/api/departments', dept, `Create dept ${dept.name}`),
  deleteDepartment: (id: string) =>
    apiFetch<{ deleted: boolean }>('DELETE', `/api/departments/${id}`, undefined, `Delete dept ${id}`),

  createCourse: (course: Partial<Course>) =>
    apiFetch<Course>('POST', '/api/courses', course, `Create course ${course.code}`),
  updateCourse: (id: string, data: Partial<Course>) =>
    apiFetch<Course>('PUT', `/api/courses/${id}`, data, `Update course ${id}`),
  deleteCourse: (id: string) =>
    apiFetch<{ deleted: boolean }>('DELETE', `/api/courses/${id}`, undefined, `Delete course ${id}`),

  createSubject: (subject: Partial<Subject>) =>
    apiFetch<Subject>('POST', '/api/subjects', subject, `Create subject ${subject.code}`),
  updateSubject: (id: string, data: Partial<Subject>) =>
    apiFetch<Subject>('PUT', `/api/subjects/${id}`, data, `Update subject ${id}`),
  deleteSubject: (id: string) =>
    apiFetch<{ deleted: boolean }>('DELETE', `/api/subjects/${id}`, undefined, `Delete subject ${id}`),

  // Examinations & Results
  createExam: (exam: Partial<Exam>) =>
    apiFetch<Exam>('POST', '/api/exams', exam, `Schedule exam ${exam.subjectCode}`),
  updateExam: (id: string, data: Partial<Exam>) =>
    apiFetch<Exam>('PUT', `/api/exams/${id}`, data, `Update exam ${id}`),
  deleteExam: (id: string) =>
    apiFetch<{ deleted: boolean }>('DELETE', `/api/exams/${id}`, undefined, `Delete exam ${id}`),

  saveResult: (payload: {
    examId: string;
    studentId: string;
    marksObtained: number;
    remarks?: string;
    actor?: string;
    role?: UserRole;
  }) => apiFetch<ExamResult>('POST', '/api/results', payload, `Save marks for student ${payload.studentId}`),
  deleteResult: (id: string) =>
    apiFetch<{ deleted: boolean }>('DELETE', `/api/results/${id}`, undefined, `Delete result ${id}`),

  // Fees
  payFee: (
    feeId: string,
    payload: { amount: number; method: PaymentTransaction['method']; reference?: string; actor?: string }
  ) =>
    apiFetch<{ fee: FeeRecord; receipt: PaymentTransaction }>(
      'POST',
      `/api/fees/${feeId}/pay`,
      payload,
      `Record fee payment $${payload.amount}`
    ),

  // Notices
  createNotice: (notice: Partial<Notice>) =>
    apiFetch<Notice>('POST', '/api/notices', notice, `Publish notice "${notice.title}"`),
  updateNotice: (id: string, data: Partial<Notice>) =>
    apiFetch<Notice>('PUT', `/api/notices/${id}`, data, `Update notice ${id}`),
  deleteNotice: (id: string) =>
    apiFetch<{ deleted: boolean }>('DELETE', `/api/notices/${id}`, undefined, `Delete notice ${id}`),

  // Settings
  updateSettings: (settings: Partial<InstitutionSettings>) =>
    apiFetch<InstitutionSettings>('PUT', '/api/settings', settings, 'Update institution settings'),

  // Backend Inspector
  inspectDb: () => apiFetch<DbInspectResponse>('GET', '/api/db/inspect', undefined, 'Inspect backend collections'),
  resetDb: () => apiFetch<{ reset: boolean; data: PublicSimsData }>('POST', '/api/db/reset', {}, 'Reset demo database'),
};
