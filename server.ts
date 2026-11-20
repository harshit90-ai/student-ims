import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createSeedDatabase } from './server/seedData';
import type {
  ActivityLog,
  AttendanceRecord,
  SimsDatabase,
  UserRole,
} from './src/types/sims';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sims_db.json');

function ensureDatabase(): SimsDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as SimsDatabase;
  } catch {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

function readDb(): SimsDatabase {
  return ensureDatabase();
}

function writeDb(db: SimsDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function appendActivity(
  db: SimsDatabase,
  actor: string,
  role: UserRole,
  action: string,
  module: string,
  detail: string
) {
  const entry: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    actor,
    role,
    action,
    module,
    detail,
  };
  db.activities = [entry, ...db.activities].slice(0, 40);
}

function computeGrade(marks: number, maxMarks: number): { grade: string; remarks: string } {
  const pct = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
  if (pct >= 90) return { grade: 'A+', remarks: 'Distinction' };
  if (pct >= 80) return { grade: 'A', remarks: 'Excellent' };
  if (pct >= 70) return { grade: 'B+', remarks: 'Very Good' };
  if (pct >= 60) return { grade: 'B', remarks: 'Good' };
  if (pct >= 50) return { grade: 'C', remarks: 'Satisfactory' };
  if (pct >= 40) return { grade: 'D', remarks: 'Pass' };
  return { grade: 'F', remarks: 'Needs Reassessment' };
}

async function startServer() {
  ensureDatabase();
  const app = express();

  app.use(express.json({ limit: '8mb' }));

  // Health & DB Inspect
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', engine: 'Express + Persistent JSON Store', port: PORT });
  });

  // Public course & department catalog for registration
  app.get('/api/public/courses', (_req, res) => {
    const db = readDb();
    res.json(db.courses.map((c) => ({ id: c.id, code: c.code, name: c.name, department: c.department })));
  });

  app.get('/api/public/catalog', (_req, res) => {
    const db = readDb();
    res.json({
      courses: db.courses.map((c) => ({ id: c.id, code: c.code, name: c.name, department: c.department })),
      departments: db.departments.map((d) => ({ id: d.id, code: d.code, name: d.name })),
    });
  });

  // Authentication
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password, role } = req.body as {
      identifier?: string;
      password?: string;
      role?: UserRole;
    };
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email, username, or mobile number and password are required.' });
    }
    const db = readDb();
    const normalized = identifier.trim().toLowerCase();
    const digitsOnly = identifier.replace(/\D/g, '');

    const matched = db.users.find((u) => {
      if (role && u.role !== role) return false;
      if (u.password !== password) return false;
      if (u.email.toLowerCase() === normalized || u.username.toLowerCase() === normalized) {
        return true;
      }
      if (digitsOnly.length >= 7 && u.linkedEntityId) {
        const linkedEntity =
          db.students.find((s) => s.id === u.linkedEntityId) ||
          db.teachers.find((t) => t.id === u.linkedEntityId);
        if (linkedEntity) {
          const storedDigits = linkedEntity.phone.replace(/\D/g, '');
          if (
            storedDigits === digitsOnly ||
            (storedDigits.length >= 10 &&
              digitsOnly.length >= 10 &&
              storedDigits.slice(-10) === digitsOnly.slice(-10))
          ) {
            return true;
          }
        }
      }
      return false;
    });

    if (!matched) {
      return res.status(401).json({
        error: 'Invalid credentials or selected role mismatch. Try the quick demo credentials below.',
      });
    }

    const { password: _pwd, ...safeUser } = matched;
    return res.json({ user: safeUser });
  });

  // Student Self-Registration (by email + mobile number + create password)
  app.post('/api/auth/register', (req, res) => {
    const { fullName, email, phone, password, course, semester } = req.body as {
      fullName?: string;
      email?: string;
      phone?: string;
      password?: string;
      course?: string;
      semester?: number;
    };

    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({
        error: 'Full Name, Email Address, Mobile Number, and Password are all required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      return res.status(400).json({ error: 'Please enter a valid mobile number (at least 7 digits).' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const db = readDb();

    const emailExists =
      db.users.some((u) => u.email.toLowerCase() === cleanEmail) ||
      db.students.some((s) => s.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const phoneExists = db.students.some((s) => s.phone.replace(/\D/g, '') === phoneDigits);
    if (phoneExists) {
      return res.status(409).json({ error: 'A student account with this mobile number already exists.' });
    }

    const matchedCourse =
      db.courses.find((c) => c.name === course) || db.courses[0];
    const courseName = matchedCourse ? matchedCourse.name : 'B.S. Computer Science';
    const deptName = matchedCourse ? matchedCourse.department : 'Computer Science & Engineering';
    const semNum = Number(semester) || 1;
    const year = new Date().getFullYear();
    const nextNum = String(db.students.length + 1).padStart(3, '0');
    const registrationNumber = `STU-${year}-${nextNum}`;
    const studentId = `stu-${Date.now()}`;

    const newStudent = {
      id: studentId,
      registrationNumber,
      fullName: fullName.trim(),
      avatar: '',
      email: cleanEmail,
      phone: phone.trim(),
      dateOfBirth: '2006-01-01',
      gender: 'Other' as const,
      address: 'Campus Student Housing (Pending Update)',
      course: courseName,
      department: deptName,
      semester: semNum,
      enrollmentYear: year,
      admissionDate: new Date().toISOString().slice(0, 10),
      guardianName: 'Pending Guardian Details',
      guardianContact: phone.trim(),
      status: 'Active' as const,
      gpa: 0.0,
    };

    db.students = [newStudent, ...db.students];

    const totalFee = matchedCourse ? matchedCourse.tuitionPerSemester : 6400;
    db.fees.unshift({
      id: `fee-${studentId}`,
      studentId,
      studentName: newStudent.fullName,
      registrationNumber,
      course: courseName,
      semester: semNum,
      academicYear: db.settings.academicYear,
      totalFee,
      paidFee: 0,
      pendingFee: totalFee,
      dueDate: '2026-11-30',
      status: 'Pending',
      paymentHistory: [],
    });

    const newUser = {
      id: `usr-${Date.now()}`,
      username: cleanEmail.split('@')[0],
      email: cleanEmail,
      password,
      name: newStudent.fullName,
      role: 'student' as const,
      avatar: '',
      linkedEntityId: studentId,
      department: deptName,
      title: `${courseName} · Sem ${semNum}`,
    };

    db.users.push(newUser);

    appendActivity(
      db,
      newStudent.fullName,
      'student',
      'Registered Account',
      'Students',
      `${newStudent.fullName} (${registrationNumber}) registered via Student Portal`
    );

    writeDb(db);

    const { password: _pwd, ...safeUser } = newUser;
    return res.status(201).json({ user: safeUser, student: newStudent });
  });

  // Teacher Self-Registration (by email + mobile number + create password)
  app.post('/api/auth/register-teacher', (req, res) => {
    const { fullName, email, phone, password, department, designation, experienceYears } =
      req.body as {
        fullName?: string;
        email?: string;
        phone?: string;
        password?: string;
        department?: string;
        designation?: string;
        experienceYears?: number;
      };

    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({
        error: 'Full Name, Email Address, Mobile Number, and Password are all required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      return res.status(400).json({ error: 'Please enter a valid mobile number (at least 7 digits).' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const db = readDb();

    const emailExists =
      db.users.some((u) => u.email.toLowerCase() === cleanEmail) ||
      db.teachers.some((t) => t.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const phoneExists = db.teachers.some((t) => t.phone.replace(/\D/g, '') === phoneDigits);
    if (phoneExists) {
      return res.status(409).json({ error: 'A faculty account with this mobile number already exists.' });
    }

    const matchedDept =
      db.departments.find((d) => d.name === department) || db.departments[0];
    const deptName = matchedDept ? matchedDept.name : 'Computer Science & Engineering';
    const teacherId = `tch-${Date.now()}`;
    const facultyCode = `FAC-${101 + db.teachers.length}`;
    const titleStr = designation?.trim() || 'Assistant Professor';

    const newTeacher = {
      id: teacherId,
      teacherId: facultyCode,
      fullName: fullName.trim(),
      avatar: '',
      email: cleanEmail,
      phone: phone.trim(),
      department: deptName,
      designation: titleStr,
      experienceYears: Math.max(0, Number(experienceYears) || 1),
      assignedSubjects: [] as string[],
      status: 'Active' as const,
    };

    db.teachers = [newTeacher, ...db.teachers];

    const newUser = {
      id: `usr-${Date.now()}`,
      username: cleanEmail.split('@')[0],
      email: cleanEmail,
      password,
      name: newTeacher.fullName,
      role: 'teacher' as const,
      avatar: '',
      linkedEntityId: teacherId,
      department: deptName,
      title: titleStr,
    };

    db.users.push(newUser);

    appendActivity(
      db,
      newTeacher.fullName,
      'teacher',
      'Registered Faculty Account',
      'Teachers',
      `${newTeacher.fullName} (${facultyCode}) registered to ${deptName}`
    );

    writeDb(db);

    const { password: _pwd, ...safeUser } = newUser;
    return res.status(201).json({ user: safeUser, teacher: newTeacher });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body as { email?: string };
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid institutional email address.' });
    }
    return res.json({
      message: `Password recovery instructions dispatched to ${email}.`,
    });
  });

  // Bootstrap all data
  app.get('/api/bootstrap', (_req, res) => {
    const db = readDb();
    const { users: _users, ...publicDb } = db;
    res.json(publicDb);
  });

  // Students CRUD
  app.get('/api/students', (_req, res) => {
    const db = readDb();
    res.json(db.students);
  });

  app.post('/api/students', (req, res) => {
    const db = readDb();
    const payload = req.body;
    if (!payload.fullName || !payload.email || !payload.course) {
      return res.status(400).json({ error: 'Full Name, Email, and Course are required.' });
    }
    const nextNum = String(db.students.length + 1).padStart(3, '0');
    const year = Number(payload.enrollmentYear) || 2026;
    const newStudent = {
      ...payload,
      id: `stu-${Date.now()}`,
      registrationNumber: payload.registrationNumber || `STU-${year}-${nextNum}`,
      semester: Number(payload.semester) || 1,
      enrollmentYear: year,
      gpa: Number(payload.gpa) || 3.5,
      status: payload.status || 'Active',
    };
    db.students = [newStudent, ...db.students];

    // Also create corresponding fee ledger entry
    const matchedCourse = db.courses.find((c) => c.name === newStudent.course);
    const totalFee = matchedCourse ? matchedCourse.tuitionPerSemester : 6200;
    db.fees.unshift({
      id: `fee-${newStudent.id}`,
      studentId: newStudent.id,
      studentName: newStudent.fullName,
      registrationNumber: newStudent.registrationNumber,
      course: newStudent.course,
      semester: newStudent.semester,
      academicYear: db.settings.academicYear,
      totalFee,
      paidFee: 0,
      pendingFee: totalFee,
      dueDate: '2026-11-30',
      status: 'Pending',
      paymentHistory: [],
    });

    appendActivity(
      db,
      payload._actor || 'Dr. Evelyn Vance',
      'admin',
      'Enrolled Student',
      'Students',
      `Added ${newStudent.fullName} (${newStudent.registrationNumber}) to ${newStudent.course}`
    );
    writeDb(db);
    res.status(201).json(newStudent);
  });

  app.put('/api/students/:id', (req, res) => {
    const db = readDb();
    const idx = db.students.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Student not found.' });

    const updated = { ...db.students[idx], ...req.body };
    delete updated._actor;
    db.students[idx] = updated;

    // Sync student name across fees
    db.fees = db.fees.map((f) =>
      f.studentId === updated.id
        ? { ...f, studentName: updated.fullName, course: updated.course, semester: updated.semester }
        : f
    );

    appendActivity(
      db,
      req.body._actor || 'Dr. Evelyn Vance',
      req.body._role || 'admin',
      'Updated Student',
      'Students',
      `Updated profile record for ${updated.fullName} (${updated.registrationNumber})`
    );
    writeDb(db);
    res.json(updated);
  });

  app.delete('/api/students/:id', (req, res) => {
    const db = readDb();
    const target = db.students.find((s) => s.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'Student not found.' });

    db.students = db.students.filter((s) => s.id !== req.params.id);
    db.fees = db.fees.filter((f) => f.studentId !== req.params.id);
    db.attendance = db.attendance.filter((a) => a.studentId !== req.params.id);
    db.results = db.results.filter((r) => r.studentId !== req.params.id);

    appendActivity(
      db,
      'Dr. Evelyn Vance',
      'admin',
      'Deleted Student',
      'Students',
      `Removed student record ${target.fullName} (${target.registrationNumber})`
    );
    writeDb(db);
    res.json({ deleted: true, id: req.params.id });
  });

  // Teachers CRUD
  app.get('/api/teachers', (_req, res) => {
    res.json(readDb().teachers);
  });

  app.post('/api/teachers', (req, res) => {
    const db = readDb();
    const payload = req.body;
    if (!payload.fullName || !payload.email || !payload.department) {
      return res.status(400).json({ error: 'Full Name, Email, and Department are required.' });
    }
    const newTeacher = {
      ...payload,
      id: `tch-${Date.now()}`,
      teacherId: payload.teacherId || `FAC-${101 + db.teachers.length}`,
      experienceYears: Number(payload.experienceYears) || 1,
      assignedSubjects: Array.isArray(payload.assignedSubjects) ? payload.assignedSubjects : [],
      status: payload.status || 'Active',
    };
    db.teachers = [newTeacher, ...db.teachers];
    appendActivity(
      db,
      'Dr. Evelyn Vance',
      'admin',
      'Added Faculty',
      'Teachers',
      `Onboarded ${newTeacher.fullName} (${newTeacher.teacherId}) to ${newTeacher.department}`
    );
    writeDb(db);
    res.status(201).json(newTeacher);
  });

  app.put('/api/teachers/:id', (req, res) => {
    const db = readDb();
    const idx = db.teachers.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Teacher not found.' });
    db.teachers[idx] = { ...db.teachers[idx], ...req.body };
    appendActivity(
      db,
      'Dr. Evelyn Vance',
      'admin',
      'Updated Faculty',
      'Teachers',
      `Updated faculty record for ${db.teachers[idx].fullName}`
    );
    writeDb(db);
    res.json(db.teachers[idx]);
  });

  app.delete('/api/teachers/:id', (req, res) => {
    const db = readDb();
    const target = db.teachers.find((t) => t.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'Teacher not found.' });
    db.teachers = db.teachers.filter((t) => t.id !== req.params.id);
    appendActivity(
      db,
      'Dr. Evelyn Vance',
      'admin',
      'Removed Faculty',
      'Teachers',
      `Removed faculty profile ${target.fullName} (${target.teacherId})`
    );
    writeDb(db);
    res.json({ deleted: true, id: req.params.id });
  });

  // Attendance bulk mark
  app.post('/api/attendance', (req, res) => {
    const db = readDb();
    const { records, markedBy, role } = req.body as {
      records: Omit<AttendanceRecord, 'id'>[];
      markedBy?: string;
      role?: UserRole;
    };
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Attendance records array is required.' });
    }

    const updatedRecords: AttendanceRecord[] = [];
    records.forEach((rec) => {
      const existingIdx = db.attendance.findIndex(
        (a) =>
          a.date === rec.date &&
          a.studentId === rec.studentId &&
          a.subjectCode === rec.subjectCode
      );
      if (existingIdx >= 0) {
        db.attendance[existingIdx] = {
          ...db.attendance[existingIdx],
          status: rec.status,
          markedBy: markedBy || rec.markedBy,
        };
        updatedRecords.push(db.attendance[existingIdx]);
      } else {
        const created: AttendanceRecord = {
          ...rec,
          id: `att-${rec.date}-${rec.studentId}-${rec.subjectCode}-${Math.random().toString(36).slice(2, 5)}`,
          markedBy: markedBy || rec.markedBy || 'Faculty',
        };
        db.attendance.unshift(created);
        updatedRecords.push(created);
      }
    });

    appendActivity(
      db,
      markedBy || 'Faculty',
      role || 'teacher',
      'Marked Attendance',
      'Attendance',
      `Saved ${records.length} attendance entries for ${records[0].date} (${records[0].subjectCode})`
    );
    writeDb(db);
    res.json({ saved: updatedRecords.length, records: db.attendance });
  });

  // Departments, Courses & Subjects
  app.post('/api/departments', (req, res) => {
    const db = readDb();
    const dept = { ...req.body, id: `dept-${Date.now()}` };
    db.departments.push(dept);
    appendActivity(db, 'Dr. Evelyn Vance', 'admin', 'Added Department', 'Courses', `Created department ${dept.name}`);
    writeDb(db);
    res.status(201).json(dept);
  });

  app.delete('/api/departments/:id', (req, res) => {
    const db = readDb();
    db.departments = db.departments.filter((d) => d.id !== req.params.id);
    writeDb(db);
    res.json({ deleted: true });
  });

  app.post('/api/courses', (req, res) => {
    const db = readDb();
    const course = {
      ...req.body,
      id: `crs-${Date.now()}`,
      durationYears: Number(req.body.durationYears) || 4,
      totalSemesters: Number(req.body.totalSemesters) || 8,
      totalCredits: Number(req.body.totalCredits) || 120,
      tuitionPerSemester: Number(req.body.tuitionPerSemester) || 6000,
    };
    db.courses.unshift(course);
    appendActivity(db, 'Dr. Evelyn Vance', 'admin', 'Created Course', 'Courses', `Added course ${course.name} (${course.code})`);
    writeDb(db);
    res.status(201).json(course);
  });

  app.put('/api/courses/:id', (req, res) => {
    const db = readDb();
    const idx = db.courses.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Course not found' });
    db.courses[idx] = { ...db.courses[idx], ...req.body };
    writeDb(db);
    res.json(db.courses[idx]);
  });

  app.delete('/api/courses/:id', (req, res) => {
    const db = readDb();
    db.courses = db.courses.filter((c) => c.id !== req.params.id);
    writeDb(db);
    res.json({ deleted: true });
  });

  app.post('/api/subjects', (req, res) => {
    const db = readDb();
    const teacher = db.teachers.find((t) => t.id === req.body.teacherId);
    const subject = {
      ...req.body,
      id: `sub-${Date.now()}`,
      semester: Number(req.body.semester) || 1,
      credits: Number(req.body.credits) || 3,
      teacherName: teacher ? teacher.fullName : req.body.teacherName || 'Unassigned',
    };
    if (teacher && !teacher.assignedSubjects.includes(subject.code)) {
      teacher.assignedSubjects.push(subject.code);
    }
    db.subjects.unshift(subject);
    appendActivity(
      db,
      'Dr. Evelyn Vance',
      'admin',
      'Added Subject',
      'Courses',
      `Added ${subject.code} ${subject.name} (Sem ${subject.semester}) assigned to ${subject.teacherName}`
    );
    writeDb(db);
    res.status(201).json(subject);
  });

  app.put('/api/subjects/:id', (req, res) => {
    const db = readDb();
    const idx = db.subjects.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Subject not found' });
    const teacher = db.teachers.find((t) => t.id === req.body.teacherId);
    db.subjects[idx] = {
      ...db.subjects[idx],
      ...req.body,
      teacherName: teacher ? teacher.fullName : db.subjects[idx].teacherName,
    };
    writeDb(db);
    res.json(db.subjects[idx]);
  });

  app.delete('/api/subjects/:id', (req, res) => {
    const db = readDb();
    db.subjects = db.subjects.filter((s) => s.id !== req.params.id);
    writeDb(db);
    res.json({ deleted: true });
  });

  // Examinations CRUD
  app.post('/api/exams', (req, res) => {
    const db = readDb();
    const exam = {
      ...req.body,
      id: `exm-${Date.now()}`,
      semester: Number(req.body.semester) || 1,
      totalMarks: Number(req.body.totalMarks) || 100,
      passingMarks: Number(req.body.passingMarks) || 40,
    };
    db.exams.unshift(exam);
    appendActivity(db, 'Dr. Evelyn Vance', 'admin', 'Scheduled Exam', 'Examinations', `Scheduled ${exam.subjectCode} (${exam.date})`);
    writeDb(db);
    res.status(201).json(exam);
  });

  app.put('/api/exams/:id', (req, res) => {
    const db = readDb();
    const idx = db.exams.findIndex((e) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Exam not found' });
    db.exams[idx] = { ...db.exams[idx], ...req.body };
    writeDb(db);
    res.json(db.exams[idx]);
  });

  app.delete('/api/exams/:id', (req, res) => {
    const db = readDb();
    db.exams = db.exams.filter((e) => e.id !== req.params.id);
    writeDb(db);
    res.json({ deleted: true });
  });

  // Results CRUD
  app.post('/api/results', (req, res) => {
    const db = readDb();
    const { examId, studentId, marksObtained, remarks, actor, role } = req.body;
    const exam = db.exams.find((e) => e.id === examId);
    const student = db.students.find((s) => s.id === studentId);
    if (!exam || !student) {
      return res.status(400).json({ error: 'Valid examination and student are required.' });
    }
    const marks = Math.max(0, Math.min(Number(marksObtained) || 0, exam.totalMarks));
    const computed = computeGrade(marks, exam.totalMarks);

    const existingIdx = db.results.findIndex(
      (r) => r.examId === examId && r.studentId === studentId
    );
    const record = {
      id: existingIdx >= 0 ? db.results[existingIdx].id : `res-${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      studentId: student.id,
      studentName: student.fullName,
      registrationNumber: student.registrationNumber,
      course: student.course,
      semester: exam.semester,
      subjectCode: exam.subjectCode,
      subjectName: exam.subjectName,
      marksObtained: marks,
      maxMarks: exam.totalMarks,
      grade: computed.grade,
      remarks: remarks || computed.remarks,
    };

    if (existingIdx >= 0) {
      db.results[existingIdx] = record;
    } else {
      db.results.unshift(record);
    }

    appendActivity(
      db,
      actor || 'Prof. Claire Lin',
      role || 'teacher',
      'Recorded Marks',
      'Results',
      `Saved ${marks}/${exam.totalMarks} (${computed.grade}) for ${student.fullName} in ${exam.subjectCode}`
    );
    writeDb(db);
    res.status(201).json(record);
  });

  app.delete('/api/results/:id', (req, res) => {
    const db = readDb();
    db.results = db.results.filter((r) => r.id !== req.params.id);
    writeDb(db);
    res.json({ deleted: true });
  });

  // Fees Payment
  app.post('/api/fees/:id/pay', (req, res) => {
    const db = readDb();
    const idx = db.fees.findIndex((f) => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Fee record not found.' });

    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
    }

    const ledger = db.fees[idx];
    const applied = Math.min(amount, ledger.pendingFee);
    const receiptNo = `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const tx = {
      receiptNo,
      date: new Date().toISOString().slice(0, 10),
      amount: applied,
      method: req.body.method || 'Online Portal',
      reference: req.body.reference || `TXN-${Date.now().toString().slice(-6)}`,
    };

    ledger.paidFee += applied;
    ledger.pendingFee = Math.max(0, ledger.totalFee - ledger.paidFee);
    ledger.status = ledger.pendingFee === 0 ? 'Paid' : ledger.paidFee > 0 ? 'Partial' : 'Pending';
    ledger.paymentHistory = [tx, ...ledger.paymentHistory];
    db.fees[idx] = ledger;

    appendActivity(
      db,
      req.body.actor || 'Dr. Evelyn Vance',
      'admin',
      'Recorded Fee Payment',
      'Fees',
      `Received $${applied.toLocaleString()} from ${ledger.studentName} (${receiptNo})`
    );
    writeDb(db);
    res.json({ fee: ledger, receipt: tx });
  });

  // Notices CRUD
  app.post('/api/notices', (req, res) => {
    const db = readDb();
    const notice = {
      ...req.body,
      id: `not-${Date.now()}`,
      publishDate: req.body.publishDate || new Date().toISOString().slice(0, 10),
      pinned: Boolean(req.body.pinned),
    };
    db.notices.unshift(notice);
    appendActivity(
      db,
      notice.author || 'Dr. Evelyn Vance',
      'admin',
      'Published Notice',
      'Notices',
      `Published "${notice.title}" (${notice.category})`
    );
    writeDb(db);
    res.status(201).json(notice);
  });

  app.put('/api/notices/:id', (req, res) => {
    const db = readDb();
    const idx = db.notices.findIndex((n) => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Notice not found' });
    db.notices[idx] = { ...db.notices[idx], ...req.body };
    writeDb(db);
    res.json(db.notices[idx]);
  });

  app.delete('/api/notices/:id', (req, res) => {
    const db = readDb();
    db.notices = db.notices.filter((n) => n.id !== req.params.id);
    writeDb(db);
    res.json({ deleted: true });
  });

  // Settings
  app.put('/api/settings', (req, res) => {
    const db = readDb();
    db.settings = { ...db.settings, ...req.body };
    appendActivity(
      db,
      'Dr. Evelyn Vance',
      'admin',
      'Updated Settings',
      'Settings',
      `Updated institutional configuration (${db.settings.academicYear})`
    );
    writeDb(db);
    res.json(db.settings);
  });

  // Backend Data Inspector & Reset
  app.get('/api/db/inspect', (_req, res) => {
    const db = readDb();
    const { users: _users, ...collections } = db;
    const stats = fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE) : null;
    const tableCounts = Object.entries(collections).map(([name, data]) => ({
      name,
      count: Array.isArray(data) ? data.length : 1,
    }));

    res.json({
      engine: 'Node.js + Express REST API',
      storageAdapter: 'Persistent JSON Store (data/sims_db.json)',
      fileSizeBytes: stats ? stats.size : 0,
      lastModified: stats ? stats.mtime.toISOString() : new Date().toISOString(),
      tableCounts,
      collections,
    });
  });

  app.post('/api/db/reset', (_req, res) => {
    const seed = createSeedDatabase();
    writeDb(seed);
    const { users: _users, ...publicDb } = seed;
    res.json({ reset: true, data: publicDb });
  });

  // Vite middleware in dev or static build in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`cgc SIMS server listening on http://localhost:${PORT}`);
  });
}

startServer();

