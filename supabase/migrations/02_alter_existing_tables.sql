-- =================================================================
-- Migration 02: Add missing columns to the 12 existing tables.
-- All additions use IF NOT EXISTS / conditional DO blocks to be safe
-- against re-running. No table is dropped or truncated.
-- =================================================================

-- ── students ─────────────────────────────────────────────────────
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS avatar           TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS date_of_birth    DATE,
  ADD COLUMN IF NOT EXISTS gender           TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  ADD COLUMN IF NOT EXISTS address          TEXT,
  ADD COLUMN IF NOT EXISTS department       TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_year  INT,
  ADD COLUMN IF NOT EXISTS admission_date   DATE,
  ADD COLUMN IF NOT EXISTS guardian_name    TEXT,
  ADD COLUMN IF NOT EXISTS guardian_contact TEXT,
  ADD COLUMN IF NOT EXISTS status           TEXT NOT NULL DEFAULT 'Active'
                                            CHECK (status IN ('Active', 'On Leave', 'Graduated')),
  ADD COLUMN IF NOT EXISTS gpa              NUMERIC(4, 2) DEFAULT 0.0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_registration_number_key'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_registration_number_key UNIQUE (registration_number);
  END IF;
END $$;

-- ── teachers ─────────────────────────────────────────────────────
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS avatar            TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone             TEXT,
  ADD COLUMN IF NOT EXISTS designation       TEXT,
  ADD COLUMN IF NOT EXISTS experience_years  INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_subjects TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status            TEXT NOT NULL DEFAULT 'Active'
                                             CHECK (status IN ('Active', 'Sabbatical'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teachers_teacher_id_key'
  ) THEN
    ALTER TABLE public.teachers ADD CONSTRAINT teachers_teacher_id_key UNIQUE (teacher_id);
  END IF;
END $$;

-- ── departments ──────────────────────────────────────────────────
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS head_of_department TEXT,
  ADD COLUMN IF NOT EXISTS building            TEXT,
  ADD COLUMN IF NOT EXISTS established_year    INT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'departments_code_key'
  ) THEN
    ALTER TABLE public.departments ADD CONSTRAINT departments_code_key UNIQUE (code);
  END IF;
END $$;

-- ── courses ───────────────────────────────────────────────────────
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS duration_years        INT DEFAULT 4,
  ADD COLUMN IF NOT EXISTS total_semesters       INT DEFAULT 8,
  ADD COLUMN IF NOT EXISTS total_credits         INT DEFAULT 120,
  ADD COLUMN IF NOT EXISTS tuition_per_semester  NUMERIC(10, 2) DEFAULT 6000,
  ADD COLUMN IF NOT EXISTS description           TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'courses_code_key'
  ) THEN
    ALTER TABLE public.courses ADD CONSTRAINT courses_code_key UNIQUE (code);
  END IF;
END $$;

-- ── subjects ─────────────────────────────────────────────────────
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS course       TEXT,
  ADD COLUMN IF NOT EXISTS department   TEXT,
  ADD COLUMN IF NOT EXISTS credits      INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS teacher_id   TEXT,
  ADD COLUMN IF NOT EXISTS teacher_name TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subjects_code_key'
  ) THEN
    ALTER TABLE public.subjects ADD CONSTRAINT subjects_code_key UNIQUE (code);
  END IF;
END $$;

-- ── attendance ───────────────────────────────────────────────────
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS student_name        TEXT,
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS course              TEXT,
  ADD COLUMN IF NOT EXISTS semester            INT,
  ADD COLUMN IF NOT EXISTS marked_by           TEXT,
  ADD COLUMN IF NOT EXISTS status              TEXT NOT NULL DEFAULT 'Present'
                                               CHECK (status IN ('Present', 'Absent', 'Leave'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attendance_date_student_subject_key'
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_date_student_subject_key
      UNIQUE (date, student_id, subject_code);
  END IF;
END $$;

-- ── exams ────────────────────────────────────────────────────────
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS course        TEXT,
  ADD COLUMN IF NOT EXISTS subject_name  TEXT,
  ADD COLUMN IF NOT EXISTS time          TEXT,
  ADD COLUMN IF NOT EXISTS room          TEXT,
  ADD COLUMN IF NOT EXISTS total_marks   INT DEFAULT 100,
  ADD COLUMN IF NOT EXISTS passing_marks INT DEFAULT 40,
  ADD COLUMN IF NOT EXISTS status        TEXT DEFAULT 'Upcoming'
                                         CHECK (status IN ('Upcoming', 'Completed'));

-- ── exam_results ─────────────────────────────────────────────────
ALTER TABLE public.exam_results
  ADD COLUMN IF NOT EXISTS exam_title          TEXT,
  ADD COLUMN IF NOT EXISTS student_name        TEXT,
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS course              TEXT,
  ADD COLUMN IF NOT EXISTS subject_name        TEXT,
  ADD COLUMN IF NOT EXISTS max_marks           INT DEFAULT 100,
  ADD COLUMN IF NOT EXISTS grade               TEXT,
  ADD COLUMN IF NOT EXISTS remarks             TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_results_exam_student_key'
  ) THEN
    ALTER TABLE public.exam_results
      ADD CONSTRAINT exam_results_exam_student_key UNIQUE (exam_id, student_id);
  END IF;
END $$;

-- ── fees ─────────────────────────────────────────────────────────
ALTER TABLE public.fees
  ADD COLUMN IF NOT EXISTS student_name        TEXT,
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS course              TEXT,
  ADD COLUMN IF NOT EXISTS academic_year       TEXT,
  ADD COLUMN IF NOT EXISTS total_fee           NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_fee            NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_fee         NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date            DATE,
  ADD COLUMN IF NOT EXISTS status              TEXT DEFAULT 'Pending'
                                               CHECK (status IN ('Paid', 'Partial', 'Pending'));

-- ── notices ──────────────────────────────────────────────────────
ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS category     TEXT CHECK (category IN ('Academic', 'Examination', 'Holiday', 'Event')),
  ADD COLUMN IF NOT EXISTS content      TEXT,
  ADD COLUMN IF NOT EXISTS publish_date DATE,
  ADD COLUMN IF NOT EXISTS event_date   DATE,
  ADD COLUMN IF NOT EXISTS author       TEXT,
  ADD COLUMN IF NOT EXISTS pinned       BOOLEAN DEFAULT false;

-- ── activity_logs ────────────────────────────────────────────────
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS actor     TEXT,
  ADD COLUMN IF NOT EXISTS role      TEXT CHECK (role IN ('admin', 'teacher', 'student')),
  ADD COLUMN IF NOT EXISTS action    TEXT,
  ADD COLUMN IF NOT EXISTS module    TEXT,
  ADD COLUMN IF NOT EXISTS detail    TEXT;

-- ── institution_settings ─────────────────────────────────────────
ALTER TABLE public.institution_settings
  ADD COLUMN IF NOT EXISTS institution_name     TEXT,
  ADD COLUMN IF NOT EXISTS short_code           TEXT,
  ADD COLUMN IF NOT EXISTS academic_year        TEXT,
  ADD COLUMN IF NOT EXISTS current_semester     TEXT,
  ADD COLUMN IF NOT EXISTS contact_email        TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone        TEXT,
  ADD COLUMN IF NOT EXISTS address              TEXT,
  ADD COLUMN IF NOT EXISTS passing_percentage   NUMERIC(5, 2) DEFAULT 40,
  ADD COLUMN IF NOT EXISTS attendance_threshold NUMERIC(5, 2) DEFAULT 75,
  ADD COLUMN IF NOT EXISTS late_fee_per_day     NUMERIC(10, 2) DEFAULT 25;
