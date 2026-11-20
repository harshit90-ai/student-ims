-- =================================================================
-- Migration 03: Foreign key constraints between tables.
-- All wrapped in DO blocks to skip if already present.
-- =================================================================

-- attendance.student_id → students.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_student_id_fkey') THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;

-- exam_results.student_id → students.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exam_results_student_id_fkey') THEN
    ALTER TABLE public.exam_results
      ADD CONSTRAINT exam_results_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;

-- exam_results.exam_id → exams.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exam_results_exam_id_fkey') THEN
    ALTER TABLE public.exam_results
      ADD CONSTRAINT exam_results_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;
  END IF;
END $$;

-- fees.student_id → students.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fees_student_id_fkey') THEN
    ALTER TABLE public.fees
      ADD CONSTRAINT fees_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;

-- subjects.teacher_id → teachers.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subjects_teacher_id_fkey') THEN
    ALTER TABLE public.subjects
      ADD CONSTRAINT subjects_teacher_id_fkey
      FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;
  END IF;
END $$;
