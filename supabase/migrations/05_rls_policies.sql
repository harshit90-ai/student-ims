-- =================================================================
-- Migration 05: Row Level Security policies for all 14 tables.
-- Three roles: admin (full access), teacher, student (own data only)
-- =================================================================

-- ── profiles ─────────────────────────────────────────────────────
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.current_user_role() = 'admin'
  );

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    public.current_user_role() = 'admin' OR auth.uid() = id
  );

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.current_user_role() = 'admin'
  );

-- ── students ─────────────────────────────────────────────────────
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_select" ON public.students FOR SELECT USING (
  public.current_user_role() IN ('admin', 'teacher')
  OR (
    public.current_user_role() = 'student'
    AND id = (SELECT linked_entity_id FROM public.profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "students_insert" ON public.students FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "students_update" ON public.students FOR UPDATE USING (
  public.current_user_role() = 'admin'
  OR (
    public.current_user_role() = 'student'
    AND id = (SELECT linked_entity_id FROM public.profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "students_delete" ON public.students FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ── teachers ─────────────────────────────────────────────────────
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_select" ON public.teachers FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "teachers_insert" ON public.teachers FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "teachers_update" ON public.teachers FOR UPDATE USING (
  public.current_user_role() = 'admin'
  OR (
    public.current_user_role() = 'teacher'
    AND id = (SELECT linked_entity_id FROM public.profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "teachers_delete" ON public.teachers FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ── departments ──────────────────────────────────────────────────
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_select" ON public.departments FOR SELECT
  USING (true);  -- also serves unauthenticated /api/public/catalog
CREATE POLICY "departments_insert" ON public.departments FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "departments_delete" ON public.departments FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ── courses ───────────────────────────────────────────────────────
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select" ON public.courses FOR SELECT USING (true);
CREATE POLICY "courses_insert" ON public.courses FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "courses_update" ON public.courses FOR UPDATE
  USING (public.current_user_role() = 'admin');
CREATE POLICY "courses_delete" ON public.courses FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ── subjects ─────────────────────────────────────────────────────
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subjects_select" ON public.subjects FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "subjects_insert" ON public.subjects FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "subjects_update" ON public.subjects FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'teacher'));
CREATE POLICY "subjects_delete" ON public.subjects FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ── attendance ───────────────────────────────────────────────────
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select" ON public.attendance FOR SELECT USING (
  public.current_user_role() IN ('admin', 'teacher')
  OR (
    public.current_user_role() = 'student'
    AND student_id = (SELECT linked_entity_id FROM public.profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "attendance_insert" ON public.attendance FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'teacher'));
CREATE POLICY "attendance_update" ON public.attendance FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'teacher'));
CREATE POLICY "attendance_delete" ON public.attendance FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ── exams ────────────────────────────────────────────────────────
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exams_select" ON public.exams FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "exams_insert" ON public.exams FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'teacher'));
CREATE POLICY "exams_update" ON public.exams FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'teacher'));
CREATE POLICY "exams_delete" ON public.exams FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ── exam_results ─────────────────────────────────────────────────
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exam_results_select" ON public.exam_results FOR SELECT USING (
  public.current_user_role() IN ('admin', 'teacher')
  OR (
    public.current_user_role() = 'student'
    AND student_id = (SELECT linked_entity_id FROM public.profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "exam_results_insert" ON public.exam_results FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'teacher'));
CREATE POLICY "exam_results_update" ON public.exam_results FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'teacher'));
CREATE POLICY "exam_results_delete" ON public.exam_results FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ── fees ─────────────────────────────────────────────────────────
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fees_select" ON public.fees FOR SELECT USING (
  public.current_user_role() IN ('admin', 'teacher')
  OR (
    public.current_user_role() = 'student'
    AND student_id = (SELECT linked_entity_id FROM public.profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "fees_insert" ON public.fees FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "fees_update" ON public.fees FOR UPDATE
  USING (public.current_user_role() = 'admin');
CREATE POLICY "fees_delete" ON public.fees FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ── payment_transactions ─────────────────────────────────────────
CREATE POLICY "payment_transactions_select" ON public.payment_transactions
  FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR (
      public.current_user_role() = 'student'
      AND fee_id IN (
        SELECT id FROM public.fees
        WHERE student_id = (SELECT linked_entity_id FROM public.profiles WHERE id = auth.uid())
      )
    )
  );
CREATE POLICY "payment_transactions_insert" ON public.payment_transactions
  FOR INSERT WITH CHECK (public.current_user_role() = 'admin');

-- ── notices ──────────────────────────────────────────────────────
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notices_select" ON public.notices FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "notices_insert" ON public.notices FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "notices_update" ON public.notices FOR UPDATE
  USING (public.current_user_role() = 'admin');
CREATE POLICY "notices_delete" ON public.notices FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ── activity_logs ────────────────────────────────────────────────
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select" ON public.activity_logs FOR SELECT
  USING (public.current_user_role() = 'admin');
CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "activity_logs_delete" ON public.activity_logs FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ── institution_settings ─────────────────────────────────────────
ALTER TABLE public.institution_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "institution_settings_select" ON public.institution_settings FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "institution_settings_update" ON public.institution_settings FOR UPDATE
  USING (public.current_user_role() = 'admin');
