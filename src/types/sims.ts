export type UserRole = 'admin' | 'teacher' | 'student';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  linkedEntityId?: string; // teacherId or studentId
  department?: string;
  title?: string;
}

export interface Student {
  id: string;
  registrationNumber: string;
  fullName: string;
  avatar: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  course: string;
  department: string;
  semester: number;
  enrollmentYear: number;
  admissionDate: string;
  guardianName: string;
  guardianContact: string;
  status: 'Active' | 'On Leave' | 'Graduated';
  gpa: number;
}

export interface Teacher {
  id: string;
  teacherId: string;
  fullName: string;
  avatar: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  experienceYears: number;
  assignedSubjects: string[]; // subject codes
  status: 'Active' | 'Sabbatical';
}

export interface Department {
  id: string;
  code: string;
  name: string;
  headOfDepartment: string;
  building: string;
  establishedYear: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  durationYears: number;
  totalSemesters: number;
  totalCredits: number;
  tuitionPerSemester: number;
  description: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  course: string;
  department: string;
  semester: number;
  credits: number;
  teacherId: string;
  teacherName: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  registrationNumber: string;
  course: string;
  semester: number;
  subjectCode: string;
  status: AttendanceStatus;
  markedBy: string;
}

export interface Exam {
  id: string;
  title: string;
  course: string;
  semester: number;
  subjectCode: string;
  subjectName: string;
  date: string;
  time: string;
  room: string;
  totalMarks: number;
  passingMarks: number;
  status: 'Upcoming' | 'Completed';
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  registrationNumber: string;
  course: string;
  semester: number;
  subjectCode: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  remarks: string;
}

export interface PaymentTransaction {
  receiptNo: string;
  date: string;
  amount: number;
  method: 'Bank Transfer' | 'Card' | 'Online Portal' | 'Check';
  reference: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  registrationNumber: string;
  course: string;
  semester: number;
  academicYear: string;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  dueDate: string;
  status: 'Paid' | 'Partial' | 'Pending';
  paymentHistory: PaymentTransaction[];
}

export type NoticeCategory = 'Academic' | 'Examination' | 'Holiday' | 'Event';

export interface Notice {
  id: string;
  title: string;
  category: NoticeCategory;
  content: string;
  publishDate: string;
  eventDate?: string;
  author: string;
  pinned: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: string;
  module: string;
  detail: string;
}

export interface InstitutionSettings {
  institutionName: string;
  shortCode: string;
  academicYear: string;
  currentSemester: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  passingPercentage: number;
  attendanceThreshold: number;
  lateFeePerDay: number;
}

export interface SimsDatabase {
  users: (AuthUser & { password: string })[];
  students: Student[];
  teachers: Teacher[];
  departments: Department[];
  courses: Course[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  exams: Exam[];
  results: ExamResult[];
  fees: FeeRecord[];
  notices: Notice[];
  activities: ActivityLog[];
  settings: InstitutionSettings;
}

export interface ApiRequestLog {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: number;
  durationMs: number;
  timestamp: string;
  summary: string;
}

export type NavSection =
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'attendance'
  | 'courses'
  | 'examinations'
  | 'results'
  | 'fees'
  | 'notices'
  | 'reports'
  | 'settings';
