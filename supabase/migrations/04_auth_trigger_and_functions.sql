-- =================================================================
-- Migration 04: Supabase Auth trigger + helper SQL functions
-- =================================================================

-- ── Helper: get the current user's role from profiles ────────────
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ── Trigger: auto-create profile on Supabase Auth sign-up ────────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, username, name, role, avatar, linked_entity_id, department, title
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', ''),
    NEW.raw_user_meta_data->>'linked_entity_id',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'title'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ── RPC: append a subject code to teacher's assigned_subjects[] ──
CREATE OR REPLACE FUNCTION public.append_subject_to_teacher(
  p_teacher_id  TEXT,
  p_subject_code TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.teachers
  SET assigned_subjects = array_append(assigned_subjects, p_subject_code)
  WHERE id = p_teacher_id
    AND NOT (p_subject_code = ANY(assigned_subjects));
$$;
