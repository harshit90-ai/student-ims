-- =================================================================
-- Migration 06: Seed Data from sims_db.json
-- Safe, idempotent seed script using ON CONFLICT clauses.
-- Does NOT insert plaintext passwords, users, or fake profiles.
-- =================================================================

-- 1. DEPARTMENTS (5 records)
INSERT INTO public.departments (id, code, name, head_of_department, building, established_year) VALUES
  ('dept-cs', 'CSE', 'Computer Science & Engineering', 'Prof. Claire Lin', 'Turing Academic Wing', 1998),
  ('dept-ds', 'DSA', 'Data Science & AI', 'Dr. Marcus Thorne', 'Ada Lovelace Hall', 2018),
  ('dept-ee', 'EEE', 'Electrical & Electronics Engineering', 'Prof. Arvind Krishnan', 'Maxwell Science Block', 1992),
  ('dept-ba', 'BUS', 'Business Administration', 'Dr. Hannah Brooks', 'Keynes Commerce Pavilion', 2001),
  ('dept-me', 'MEC', 'Mechanical Engineering', 'Prof. David Kowalski', 'Newton Workshop Center', 1989)
ON CONFLICT (id) DO NOTHING;

-- 2. COURSES (5 records)
INSERT INTO public.courses (id, code, name, department, duration_years, total_semesters, total_credits, tuition_per_semester, description) VALUES
  ('crs-bscs', 'BS-CS', 'B.S. Computer Science', 'Computer Science & Engineering', 4, 8, 128, 6400, 'Core computing foundations covering algorithms, distributed systems, compilers, and software engineering.'),
  ('crs-bsds', 'BS-DS', 'B.S. Data Science & AI', 'Data Science & AI', 4, 8, 124, 6600, 'Statistical modeling, machine learning architectures, data engineering, and applied ethical AI.'),
  ('crs-beee', 'BE-EE', 'B.Eng. Electrical Engineering', 'Electrical & Electronics Engineering', 4, 8, 132, 6200, 'Embedded systems, power electronics, digital signal processing, and VLSI circuit design.'),
  ('crs-bba', 'BBA-FA', 'BBA Finance & Analytics', 'Business Administration', 3, 6, 96, 5400, 'Corporate finance, quantitative market research, financial accounting, and strategic operations.'),
  ('crs-beme', 'BE-ME', 'B.Eng. Mechanical Engineering', 'Mechanical Engineering', 4, 8, 130, 6100, 'Thermodynamics, structural mechanics, robotics kinematics, and precision manufacturing.')
ON CONFLICT (id) DO NOTHING;

-- 3. TEACHERS (6 records - Note: ME302 removed from tch-6)
INSERT INTO public.teachers (id, teacher_id, full_name, avatar, email, phone, department, designation, experience_years, assigned_subjects, status) VALUES
  ('tch-1', 'FAC-101', 'Prof. Claire Lin', 'avatar_teacher', 'teacher@cgc.edu', '+1 (617) 555-0142', 'Computer Science & Engineering', 'Associate Professor', 11, '{CS301,CS302,CS401}', 'Active'),
  ('tch-2', 'FAC-102', 'Dr. Marcus Thorne', '', 'm.thorne@cgc.edu', '+1 (617) 555-0188', 'Data Science & AI', 'Professor & Chair', 15, '{DS201,DS304}', 'Active'),
  ('tch-3', 'FAC-103', 'Prof. Arvind Krishnan', '', 'a.krishnan@cgc.edu', '+1 (617) 555-0193', 'Electrical & Electronics Engineering', 'Professor', 14, '{EE204,EE301}', 'Active'),
  ('tch-4', 'FAC-104', 'Dr. Hannah Brooks', '', 'h.brooks@cgc.edu', '+1 (617) 555-0117', 'Business Administration', 'Associate Professor', 9, '{BA102,BA205}', 'Active'),
  ('tch-5', 'FAC-105', 'Dr. Samuel Okafor', '', 's.okafor@cgc.edu', '+1 (617) 555-0164', 'Computer Science & Engineering', 'Assistant Professor', 6, '{CS305,CS204}', 'Active'),
  ('tch-6', 'FAC-106', 'Prof. David Kowalski', '', 'd.kowalski@cgc.edu', '+1 (617) 555-0171', 'Mechanical Engineering', 'Senior Professor', 18, '{ME201}', 'Active')
ON CONFLICT (id) DO NOTHING;

-- 4. SUBJECTS (12 records)
INSERT INTO public.subjects (id, code, name, course, department, semester, credits, teacher_id, teacher_name) VALUES
  ('sub-1', 'CS301', 'Data Structures & Algorithms', 'B.S. Computer Science', 'Computer Science & Engineering', 5, 4, 'tch-1', 'Prof. Claire Lin'),
  ('sub-2', 'CS302', 'Operating Systems', 'B.S. Computer Science', 'Computer Science & Engineering', 5, 4, 'tch-1', 'Prof. Claire Lin'),
  ('sub-3', 'CS305', 'Database Management Systems', 'B.S. Computer Science', 'Computer Science & Engineering', 5, 4, 'tch-5', 'Dr. Samuel Okafor'),
  ('sub-4', 'CS204', 'Computer Networks', 'B.S. Computer Science', 'Computer Science & Engineering', 3, 3, 'tch-5', 'Dr. Samuel Okafor'),
  ('sub-5', 'CS401', 'Distributed Systems', 'B.S. Computer Science', 'Computer Science & Engineering', 7, 4, 'tch-1', 'Prof. Claire Lin'),
  ('sub-6', 'DS201', 'Statistical Machine Learning', 'B.S. Data Science & AI', 'Data Science & AI', 3, 4, 'tch-2', 'Dr. Marcus Thorne'),
  ('sub-7', 'DS304', 'Deep Learning Architectures', 'B.S. Data Science & AI', 'Data Science & AI', 5, 4, 'tch-2', 'Dr. Marcus Thorne'),
  ('sub-8', 'EE204', 'Digital Signal Processing', 'B.Eng. Electrical Engineering', 'Electrical & Electronics Engineering', 3, 4, 'tch-3', 'Prof. Arvind Krishnan'),
  ('sub-9', 'EE301', 'Embedded Microcontrollers', 'B.Eng. Electrical Engineering', 'Electrical & Electronics Engineering', 5, 4, 'tch-3', 'Prof. Arvind Krishnan'),
  ('sub-10', 'BA102', 'Corporate Finance', 'BBA Finance & Analytics', 'Business Administration', 3, 3, 'tch-4', 'Dr. Hannah Brooks'),
  ('sub-11', 'BA205', 'Business Econometrics', 'BBA Finance & Analytics', 'Business Administration', 5, 3, 'tch-4', 'Dr. Hannah Brooks'),
  ('sub-12', 'ME201', 'Applied Thermodynamics', 'B.Eng. Mechanical Engineering', 'Mechanical Engineering', 3, 4, 'tch-6', 'Prof. David Kowalski')
ON CONFLICT (id) DO NOTHING;

-- 5. STUDENTS (12 records)
INSERT INTO public.students (id, registration_number, full_name, avatar, email, phone, date_of_birth, gender, address, course, department, semester, enrollment_year, admission_date, guardian_name, guardian_contact, status, gpa) VALUES
  ('stu-1', 'STU-2024-001', 'Maya Patel', 'avatar_student_one', 'student@cgc.edu', '+1 (617) 555-0201', '2005-04-12', 'Female', '412 Commonwealth Ave, Apt 4B, Boston, MA', 'B.S. Computer Science', 'Computer Science & Engineering', 5, 2024, '2024-08-26', 'Rajesh Patel', '+1 (617) 555-0911', 'Active', 3.88),
  ('stu-2', 'STU-2024-002', 'Liam Jenkins', 'avatar_student_two', 'liam.jenkins@cgc.edu', '+1 (617) 555-0202', '2005-01-23', 'Male', '89 Newbury St, Boston, MA', 'B.Eng. Electrical Engineering', 'Electrical & Electronics Engineering', 5, 2024, '2024-08-26', 'Catherine Jenkins', '+1 (617) 555-0912', 'Active', 3.74),
  ('stu-3', 'STU-2024-003', 'Sofia Rodriguez', '', 'sofia.rodriguez@cgc.edu', '+1 (617) 555-0203', '2004-11-08', 'Female', '215 Beacon St, Cambridge, MA', 'B.S. Computer Science', 'Computer Science & Engineering', 5, 2024, '2024-08-26', 'Carlos Rodriguez', '+1 (617) 555-0913', 'Active', 3.92),
  ('stu-4', 'STU-2024-004', 'Ethan Chen', '', 'ethan.chen@cgc.edu', '+1 (617) 555-0204', '2005-06-19', 'Male', '74 Mount Auburn St, Cambridge, MA', 'B.S. Data Science & AI', 'Data Science & AI', 5, 2024, '2024-08-26', 'Wei Chen', '+1 (617) 555-0914', 'Active', 3.81),
  ('stu-5', 'STU-2025-005', 'Amara Nwosu', '', 'amara.nwosu@cgc.edu', '+1 (617) 555-0205', '2006-02-14', 'Female', '158 Huntington Ave, Boston, MA', 'B.S. Computer Science', 'Computer Science & Engineering', 3, 2025, '2025-08-25', 'Chidi Nwosu', '+1 (617) 555-0915', 'Active', 3.69),
  ('stu-6', 'STU-2025-006', 'Noah Lindqvist', '', 'noah.lindqvist@cgc.edu', '+1 (617) 555-0206', '2005-09-30', 'Male', '302 Boylston St, Brookline, MA', 'BBA Finance & Analytics', 'Business Administration', 3, 2025, '2025-08-25', 'Henrik Lindqvist', '+1 (617) 555-0916', 'Active', 3.55),
  ('stu-7', 'STU-2024-007', 'Chloe Bennett', '', 'chloe.bennett@cgc.edu', '+1 (617) 555-0207', '2004-07-04', 'Female', '65 Harvard Ave, Allston, MA', 'B.S. Data Science & AI', 'Data Science & AI', 5, 2024, '2024-08-27', 'Arthur Bennett', '+1 (617) 555-0917', 'Active', 3.95),
  ('stu-8', 'STU-2023-008', 'Daniel Park', '', 'daniel.park@cgc.edu', '+1 (617) 555-0208', '2003-12-11', 'Male', '118 Mass Ave, Boston, MA', 'B.S. Computer Science', 'Computer Science & Engineering', 7, 2023, '2023-08-28', 'Jisoo Park', '+1 (617) 555-0918', 'Active', 3.79),
  ('stu-9', 'STU-2025-009', 'Zara Al-Mansoor', '', 'zara.almansoor@cgc.edu', '+1 (617) 555-0209', '2006-03-27', 'Female', '44 Brookline Ave, Boston, MA', 'B.Eng. Mechanical Engineering', 'Mechanical Engineering', 3, 2025, '2025-08-25', 'Tariq Al-Mansoor', '+1 (617) 555-0919', 'Active', 3.63),
  ('stu-10', 'STU-2024-010', 'Lucas Moretti', '', 'lucas.moretti@cgc.edu', '+1 (617) 555-0210', '2004-08-15', 'Male', '290 Hanover St, Boston, MA', 'BBA Finance & Analytics', 'Business Administration', 5, 2024, '2024-08-26', 'Marco Moretti', '+1 (617) 555-0920', 'On Leave', 3.38),
  ('stu-11', 'STU-2026-011', 'Hannah Sato', '', 'hannah.sato@cgc.edu', '+1 (617) 555-0211', '2007-05-09', 'Female', '92 Marlborough St, Boston, MA', 'B.S. Computer Science', 'Computer Science & Engineering', 1, 2026, '2026-08-24', 'Kenji Sato', '+1 (617) 555-0921', 'Active', 3.85),
  ('stu-12', 'STU-2026-012', 'Owen Gallagher', '', 'owen.gallagher@cgc.edu', '+1 (617) 555-0212', '2007-01-18', 'Male', '140 Tremont St, Boston, MA', 'B.Eng. Electrical Engineering', 'Electrical & Electronics Engineering', 1, 2026, '2026-08-24', 'Patrick Gallagher', '+1 (617) 555-0922', 'Active', 3.71)
ON CONFLICT (id) DO NOTHING;

-- 6. ATTENDANCE (84 records)
INSERT INTO public.attendance (id, date, student_id, student_name, registration_number, course, semester, subject_code, status, marked_by) VALUES
  ('att-2026-11-05-stu-1', '2026-11-05', 'stu-1', 'Maya Patel', 'STU-2024-001', 'B.S. Computer Science', 5, 'CS301', 'Absent', 'Prof. Claire Lin'),
  ('att-2026-11-05-stu-2', '2026-11-05', 'stu-2', 'Liam Jenkins', 'STU-2024-002', 'B.Eng. Electrical Engineering', 5, 'EE301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-05-stu-3', '2026-11-05', 'stu-3', 'Sofia Rodriguez', 'STU-2024-003', 'B.S. Computer Science', 5, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-05-stu-4', '2026-11-05', 'stu-4', 'Ethan Chen', 'STU-2024-004', 'B.S. Data Science & AI', 5, 'DS304', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-05-stu-5', '2026-11-05', 'stu-5', 'Amara Nwosu', 'STU-2025-005', 'B.S. Computer Science', 3, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-05-stu-6', '2026-11-05', 'stu-6', 'Noah Lindqvist', 'STU-2025-006', 'BBA Finance & Analytics', 3, 'BA102', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-05-stu-7', '2026-11-05', 'stu-7', 'Chloe Bennett', 'STU-2024-007', 'B.S. Data Science & AI', 5, 'DS304', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-05-stu-8', '2026-11-05', 'stu-8', 'Daniel Park', 'STU-2023-008', 'B.S. Computer Science', 7, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-05-stu-9', '2026-11-05', 'stu-9', 'Zara Al-Mansoor', 'STU-2025-009', 'B.Eng. Mechanical Engineering', 3, 'ME201', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-05-stu-10', '2026-11-05', 'stu-10', 'Lucas Moretti', 'STU-2024-010', 'BBA Finance & Analytics', 5, 'BA205', 'Leave', 'Dr. Hannah Brooks'),
  ('att-2026-11-05-stu-11', '2026-11-05', 'stu-11', 'Hannah Sato', 'STU-2026-011', 'B.S. Computer Science', 1, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-05-stu-12', '2026-11-05', 'stu-12', 'Owen Gallagher', 'STU-2026-012', 'B.Eng. Electrical Engineering', 1, 'EE301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-06-stu-1', '2026-11-06', 'stu-1', 'Maya Patel', 'STU-2024-001', 'B.S. Computer Science', 5, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-06-stu-2', '2026-11-06', 'stu-2', 'Liam Jenkins', 'STU-2024-002', 'B.Eng. Electrical Engineering', 5, 'EE301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-06-stu-3', '2026-11-06', 'stu-3', 'Sofia Rodriguez', 'STU-2024-003', 'B.S. Computer Science', 5, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-06-stu-4', '2026-11-06', 'stu-4', 'Ethan Chen', 'STU-2024-004', 'B.S. Data Science & AI', 5, 'DS304', 'Leave', 'Prof. Claire Lin'),
  ('att-2026-11-06-stu-5', '2026-11-06', 'stu-5', 'Amara Nwosu', 'STU-2025-005', 'B.S. Computer Science', 3, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-06-stu-6', '2026-11-06', 'stu-6', 'Noah Lindqvist', 'STU-2025-006', 'BBA Finance & Analytics', 3, 'BA102', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-06-stu-7', '2026-11-06', 'stu-7', 'Chloe Bennett', 'STU-2024-007', 'B.S. Data Science & AI', 5, 'DS304', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-06-stu-8', '2026-11-06', 'stu-8', 'Daniel Park', 'STU-2023-008', 'B.S. Computer Science', 7, 'CS301', 'Absent', 'Prof. Claire Lin'),
  ('att-2026-11-06-stu-9', '2026-11-06', 'stu-9', 'Zara Al-Mansoor', 'STU-2025-009', 'B.Eng. Mechanical Engineering', 3, 'ME201', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-06-stu-10', '2026-11-06', 'stu-10', 'Lucas Moretti', 'STU-2024-010', 'BBA Finance & Analytics', 5, 'BA205', 'Leave', 'Dr. Hannah Brooks'),
  ('att-2026-11-06-stu-11', '2026-11-06', 'stu-11', 'Hannah Sato', 'STU-2026-011', 'B.S. Computer Science', 1, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-06-stu-12', '2026-11-06', 'stu-12', 'Owen Gallagher', 'STU-2026-012', 'B.Eng. Electrical Engineering', 1, 'EE301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-09-stu-1', '2026-11-09', 'stu-1', 'Maya Patel', 'STU-2024-001', 'B.S. Computer Science', 5, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-09-stu-2', '2026-11-09', 'stu-2', 'Liam Jenkins', 'STU-2024-002', 'B.Eng. Electrical Engineering', 5, 'EE301', 'Absent', 'Prof. Claire Lin'),
  ('att-2026-11-09-stu-3', '2026-11-09', 'stu-3', 'Sofia Rodriguez', 'STU-2024-003', 'B.S. Computer Science', 5, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-09-stu-4', '2026-11-09', 'stu-4', 'Ethan Chen', 'STU-2024-004', 'B.S. Data Science & AI', 5, 'DS304', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-09-stu-5', '2026-11-09', 'stu-5', 'Amara Nwosu', 'STU-2025-005', 'B.S. Computer Science', 3, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-09-stu-6', '2026-11-09', 'stu-6', 'Noah Lindqvist', 'STU-2025-006', 'BBA Finance & Analytics', 3, 'BA102', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-09-stu-7', '2026-11-09', 'stu-7', 'Chloe Bennett', 'STU-2024-007', 'B.S. Data Science & AI', 5, 'DS304', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-09-stu-8', '2026-11-09', 'stu-8', 'Daniel Park', 'STU-2023-008', 'B.S. Computer Science', 7, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-09-stu-9', '2026-11-09', 'stu-9', 'Zara Al-Mansoor', 'STU-2025-009', 'B.Eng. Mechanical Engineering', 3, 'ME201', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-09-stu-10', '2026-11-09', 'stu-10', 'Lucas Moretti', 'STU-2024-010', 'BBA Finance & Analytics', 5, 'BA205', 'Leave', 'Dr. Hannah Brooks'),
  ('att-2026-11-09-stu-11', '2026-11-09', 'stu-11', 'Hannah Sato', 'STU-2026-011', 'B.S. Computer Science', 1, 'CS301', 'Leave', 'Prof. Claire Lin'),
  ('att-2026-11-09-stu-12', '2026-11-09', 'stu-12', 'Owen Gallagher', 'STU-2026-012', 'B.Eng. Electrical Engineering', 1, 'EE301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-10-stu-1', '2026-11-10', 'stu-1', 'Maya Patel', 'STU-2024-001', 'B.S. Computer Science', 5, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-10-stu-2', '2026-11-10', 'stu-2', 'Liam Jenkins', 'STU-2024-002', 'B.Eng. Electrical Engineering', 5, 'EE301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-10-stu-3', '2026-11-10', 'stu-3', 'Sofia Rodriguez', 'STU-2024-003', 'B.S. Computer Science', 5, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-10-stu-4', '2026-11-10', 'stu-4', 'Ethan Chen', 'STU-2024-004', 'B.S. Data Science & AI', 5, 'DS304', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-10-stu-5', '2026-11-10', 'stu-5', 'Amara Nwosu', 'STU-2025-005', 'B.S. Computer Science', 3, 'CS301', 'Leave', 'Prof. Claire Lin'),
  ('att-2026-11-10-stu-6', '2026-11-10', 'stu-6', 'Noah Lindqvist', 'STU-2025-006', 'BBA Finance & Analytics', 3, 'BA102', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-10-stu-7', '2026-11-10', 'stu-7', 'Chloe Bennett', 'STU-2024-007', 'B.S. Data Science & AI', 5, 'DS304', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-10-stu-8', '2026-11-10', 'stu-8', 'Daniel Park', 'STU-2023-008', 'B.S. Computer Science', 7, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-10-stu-9', '2026-11-10', 'stu-9', 'Zara Al-Mansoor', 'STU-2025-009', 'B.Eng. Mechanical Engineering', 3, 'ME201', 'Absent', 'Prof. Claire Lin'),
  ('att-2026-11-10-stu-10', '2026-11-10', 'stu-10', 'Lucas Moretti', 'STU-2024-010', 'BBA Finance & Analytics', 5, 'BA205', 'Leave', 'Dr. Hannah Brooks'),
  ('att-2026-11-10-stu-11', '2026-11-10', 'stu-11', 'Hannah Sato', 'STU-2026-011', 'B.S. Computer Science', 1, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-10-stu-12', '2026-11-10', 'stu-12', 'Owen Gallagher', 'STU-2026-012', 'B.Eng. Electrical Engineering', 1, 'EE301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-11-stu-1', '2026-11-11', 'stu-1', 'Maya Patel', 'STU-2024-001', 'B.S. Computer Science', 5, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-11-stu-2', '2026-11-11', 'stu-2', 'Liam Jenkins', 'STU-2024-002', 'B.Eng. Electrical Engineering', 5, 'EE301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-11-stu-3', '2026-11-11', 'stu-3', 'Sofia Rodriguez', 'STU-2024-003', 'B.S. Computer Science', 5, 'CS301', 'Absent', 'Prof. Claire Lin'),
  ('att-2026-11-11-stu-4', '2026-11-11', 'stu-4', 'Ethan Chen', 'STU-2024-004', 'B.S. Data Science & AI', 5, 'DS304', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-11-stu-5', '2026-11-11', 'stu-5', 'Amara Nwosu', 'STU-2025-005', 'B.S. Computer Science', 3, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-11-stu-6', '2026-11-11', 'stu-6', 'Noah Lindqvist', 'STU-2025-006', 'BBA Finance & Analytics', 3, 'BA102', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-11-stu-7', '2026-11-11', 'stu-7', 'Chloe Bennett', 'STU-2024-007', 'B.S. Data Science & AI', 5, 'DS304', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-11-stu-8', '2026-11-11', 'stu-8', 'Daniel Park', 'STU-2023-008', 'B.S. Computer Science', 7, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-11-stu-9', '2026-11-11', 'stu-9', 'Zara Al-Mansoor', 'STU-2025-009', 'B.Eng. Mechanical Engineering', 3, 'ME201', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-11-stu-10', '2026-11-11', 'stu-10', 'Lucas Moretti', 'STU-2024-010', 'BBA Finance & Analytics', 5, 'BA205', 'Leave', 'Dr. Hannah Brooks'),
  ('att-2026-11-11-stu-11', '2026-11-11', 'stu-11', 'Hannah Sato', 'STU-2026-011', 'B.S. Computer Science', 1, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-11-stu-12', '2026-11-11', 'stu-12', 'Owen Gallagher', 'STU-2026-012', 'B.Eng. Electrical Engineering', 1, 'EE301', 'Leave', 'Prof. Claire Lin'),
  ('att-2026-11-12-stu-1', '2026-11-12', 'stu-1', 'Maya Patel', 'STU-2024-001', 'B.S. Computer Science', 5, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-12-stu-2', '2026-11-12', 'stu-2', 'Liam Jenkins', 'STU-2024-002', 'B.Eng. Electrical Engineering', 5, 'EE301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-12-stu-3', '2026-11-12', 'stu-3', 'Sofia Rodriguez', 'STU-2024-003', 'B.S. Computer Science', 5, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-12-stu-4', '2026-11-12', 'stu-4', 'Ethan Chen', 'STU-2024-004', 'B.S. Data Science & AI', 5, 'DS304', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-12-stu-5', '2026-11-12', 'stu-5', 'Amara Nwosu', 'STU-2025-005', 'B.S. Computer Science', 3, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-12-stu-6', '2026-11-12', 'stu-6', 'Noah Lindqvist', 'STU-2025-006', 'BBA Finance & Analytics', 3, 'BA102', 'Leave', 'Prof. Claire Lin'),
  ('att-2026-11-12-stu-7', '2026-11-12', 'stu-7', 'Chloe Bennett', 'STU-2024-007', 'B.S. Data Science & AI', 5, 'DS304', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-12-stu-8', '2026-11-12', 'stu-8', 'Daniel Park', 'STU-2023-008', 'B.S. Computer Science', 7, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-12-stu-9', '2026-11-12', 'stu-9', 'Zara Al-Mansoor', 'STU-2025-009', 'B.Eng. Mechanical Engineering', 3, 'ME201', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-12-stu-10', '2026-11-12', 'stu-10', 'Lucas Moretti', 'STU-2024-010', 'BBA Finance & Analytics', 5, 'BA205', 'Leave', 'Dr. Hannah Brooks'),
  ('att-2026-11-12-stu-11', '2026-11-12', 'stu-11', 'Hannah Sato', 'STU-2026-011', 'B.S. Computer Science', 1, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-12-stu-12', '2026-11-12', 'stu-12', 'Owen Gallagher', 'STU-2026-012', 'B.Eng. Electrical Engineering', 1, 'EE301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-13-stu-1', '2026-11-13', 'stu-1', 'Maya Patel', 'STU-2024-001', 'B.S. Computer Science', 5, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-13-stu-2', '2026-11-13', 'stu-2', 'Liam Jenkins', 'STU-2024-002', 'B.Eng. Electrical Engineering', 5, 'EE301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-13-stu-3', '2026-11-13', 'stu-3', 'Sofia Rodriguez', 'STU-2024-003', 'B.S. Computer Science', 5, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-13-stu-4', '2026-11-13', 'stu-4', 'Ethan Chen', 'STU-2024-004', 'B.S. Data Science & AI', 5, 'DS304', 'Absent', 'Prof. Claire Lin'),
  ('att-2026-11-13-stu-5', '2026-11-13', 'stu-5', 'Amara Nwosu', 'STU-2025-005', 'B.S. Computer Science', 3, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-13-stu-6', '2026-11-13', 'stu-6', 'Noah Lindqvist', 'STU-2025-006', 'BBA Finance & Analytics', 3, 'BA102', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-13-stu-7', '2026-11-13', 'stu-7', 'Chloe Bennett', 'STU-2024-007', 'B.S. Data Science & AI', 5, 'DS304', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-13-stu-8', '2026-11-13', 'stu-8', 'Daniel Park', 'STU-2023-008', 'B.S. Computer Science', 7, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-13-stu-9', '2026-11-13', 'stu-9', 'Zara Al-Mansoor', 'STU-2025-009', 'B.Eng. Mechanical Engineering', 3, 'ME201', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-13-stu-10', '2026-11-13', 'stu-10', 'Lucas Moretti', 'STU-2024-010', 'BBA Finance & Analytics', 5, 'BA205', 'Leave', 'Dr. Hannah Brooks'),
  ('att-2026-11-13-stu-11', '2026-11-13', 'stu-11', 'Hannah Sato', 'STU-2026-011', 'B.S. Computer Science', 1, 'CS301', 'Present', 'Prof. Claire Lin'),
  ('att-2026-11-13-stu-12', '2026-11-13', 'stu-12', 'Owen Gallagher', 'STU-2026-012', 'B.Eng. Electrical Engineering', 1, 'EE301', 'Present', 'Prof. Claire Lin')
ON CONFLICT (id) DO NOTHING;

-- 7. EXAMS (7 records)
INSERT INTO public.exams (id, title, course, semester, subject_code, subject_name, date, time, room, total_marks, passing_marks, status) VALUES
  ('exm-1', 'Midterm Assessment — Fall 2026', 'B.S. Computer Science', 5, 'CS301', 'Data Structures & Algorithms', '2026-10-20', '09:30 AM - 11:30 AM', 'Turing Hall 201', 100, 40, 'Completed'),
  ('exm-2', 'Midterm Assessment — Fall 2026', 'B.S. Computer Science', 5, 'CS302', 'Operating Systems', '2026-10-22', '09:30 AM - 11:30 AM', 'Turing Hall 204', 100, 40, 'Completed'),
  ('exm-3', 'Midterm Assessment — Fall 2026', 'B.S. Computer Science', 5, 'CS305', 'Database Management Systems', '2026-10-24', '01:30 PM - 03:30 PM', 'Turing Hall 108', 100, 40, 'Completed'),
  ('exm-4', 'Midterm Assessment — Fall 2026', 'B.S. Data Science & AI', 5, 'DS304', 'Deep Learning Architectures', '2026-10-23', '10:00 AM - 12:00 PM', 'Lovelace Auditorium', 100, 40, 'Completed'),
  ('exm-5', 'Final Term Examination — Fall 2026', 'B.S. Computer Science', 5, 'CS301', 'Data Structures & Algorithms', '2026-12-08', '09:00 AM - 12:00 PM', 'Main Examination Center A', 100, 40, 'Upcoming'),
  ('exm-6', 'Final Term Examination — Fall 2026', 'B.S. Computer Science', 5, 'CS302', 'Operating Systems', '2026-12-10', '09:00 AM - 12:00 PM', 'Main Examination Center A', 100, 40, 'Upcoming'),
  ('exm-7', 'Final Term Examination — Fall 2026', 'B.Eng. Electrical Engineering', 5, 'EE301', 'Embedded Microcontrollers', '2026-12-11', '01:00 PM - 04:00 PM', 'Maxwell Lab 302', 100, 40, 'Upcoming')
ON CONFLICT (id) DO NOTHING;

-- 8. EXAM RESULTS (8 records)
INSERT INTO public.exam_results (id, exam_id, exam_title, student_id, student_name, registration_number, course, semester, subject_code, subject_name, marks_obtained, max_marks, grade, remarks) VALUES
  ('res-1', 'exm-1', 'Midterm Assessment — Fall 2026', 'stu-1', 'Maya Patel', 'STU-2024-001', 'B.S. Computer Science', 5, 'CS301', 'Data Structures & Algorithms', 94, 100, 'A+', 'Distinction'),
  ('res-2', 'exm-2', 'Midterm Assessment — Fall 2026', 'stu-1', 'Maya Patel', 'STU-2024-001', 'B.S. Computer Science', 5, 'CS302', 'Operating Systems', 89, 100, 'A', 'Excellent analytical work'),
  ('res-3', 'exm-3', 'Midterm Assessment — Fall 2026', 'stu-1', 'Maya Patel', 'STU-2024-001', 'B.S. Computer Science', 5, 'CS305', 'Database Management Systems', 91, 100, 'A+', 'Strong SQL optimization'),
  ('res-4', 'exm-1', 'Midterm Assessment — Fall 2026', 'stu-3', 'Sofia Rodriguez', 'STU-2024-003', 'B.S. Computer Science', 5, 'CS301', 'Data Structures & Algorithms', 96, 100, 'A+', 'Top scorer'),
  ('res-5', 'exm-2', 'Midterm Assessment — Fall 2026', 'stu-3', 'Sofia Rodriguez', 'STU-2024-003', 'B.S. Computer Science', 5, 'CS302', 'Operating Systems', 92, 100, 'A+', 'Distinction'),
  ('res-6', 'exm-3', 'Midterm Assessment — Fall 2026', 'stu-3', 'Sofia Rodriguez', 'STU-2024-003', 'B.S. Computer Science', 5, 'CS305', 'Database Management Systems', 87, 100, 'A', 'Commendable'),
  ('res-7', 'exm-4', 'Midterm Assessment — Fall 2026', 'stu-4', 'Ethan Chen', 'STU-2024-004', 'B.S. Data Science & AI', 5, 'DS304', 'Deep Learning Architectures', 86, 100, 'A', 'Solid neural model design'),
  ('res-8', 'exm-4', 'Midterm Assessment — Fall 2026', 'stu-7', 'Chloe Bennett', 'STU-2024-007', 'B.S. Data Science & AI', 5, 'DS304', 'Deep Learning Architectures', 95, 100, 'A+', 'Outstanding research depth')
ON CONFLICT (id) DO NOTHING;

-- 9. FEES (12 records)
INSERT INTO public.fees (id, student_id, student_name, registration_number, course, semester, academic_year, total_fee, paid_fee, pending_fee, due_date, status) VALUES
  ('fee-stu-1', 'stu-1', 'Maya Patel', 'STU-2024-001', 'B.S. Computer Science', 5, '2026-2027', 6400, 6400, 0, '2026-11-30', 'Paid'),
  ('fee-stu-2', 'stu-2', 'Liam Jenkins', 'STU-2024-002', 'B.Eng. Electrical Engineering', 5, '2026-2027', 6200, 3410, 2790, '2026-11-30', 'Partial'),
  ('fee-stu-3', 'stu-3', 'Sofia Rodriguez', 'STU-2024-003', 'B.S. Computer Science', 5, '2026-2027', 6400, 0, 6400, '2026-11-30', 'Pending'),
  ('fee-stu-4', 'stu-4', 'Ethan Chen', 'STU-2024-004', 'B.S. Data Science & AI', 5, '2026-2027', 6600, 6600, 0, '2026-11-30', 'Paid'),
  ('fee-stu-5', 'stu-5', 'Amara Nwosu', 'STU-2025-005', 'B.S. Computer Science', 3, '2026-2027', 6400, 3520, 2880, '2026-11-30', 'Partial'),
  ('fee-stu-6', 'stu-6', 'Noah Lindqvist', 'STU-2025-006', 'BBA Finance & Analytics', 3, '2026-2027', 5400, 0, 5400, '2026-11-30', 'Pending'),
  ('fee-stu-7', 'stu-7', 'Chloe Bennett', 'STU-2024-007', 'B.S. Data Science & AI', 5, '2026-2027', 6600, 6600, 0, '2026-11-30', 'Paid'),
  ('fee-stu-8', 'stu-8', 'Daniel Park', 'STU-2023-008', 'B.S. Computer Science', 7, '2026-2027', 6400, 3520, 2880, '2026-11-30', 'Partial'),
  ('fee-stu-9', 'stu-9', 'Zara Al-Mansoor', 'STU-2025-009', 'B.Eng. Mechanical Engineering', 3, '2026-2027', 6100, 0, 6100, '2026-11-30', 'Pending'),
  ('fee-stu-10', 'stu-10', 'Lucas Moretti', 'STU-2024-010', 'BBA Finance & Analytics', 5, '2026-2027', 5400, 5400, 0, '2026-11-30', 'Paid'),
  ('fee-stu-11', 'stu-11', 'Hannah Sato', 'STU-2026-011', 'B.S. Computer Science', 1, '2026-2027', 6400, 3520, 2880, '2026-11-30', 'Partial'),
  ('fee-stu-12', 'stu-12', 'Owen Gallagher', 'STU-2026-012', 'B.Eng. Electrical Engineering', 1, '2026-2027', 6200, 0, 6200, '2026-11-30', 'Pending')
ON CONFLICT (id) DO NOTHING;

-- 10. PAYMENT TRANSACTIONS (8 records extracted from paymentHistory)
INSERT INTO public.payment_transactions (fee_id, receipt_no, date, amount, method, reference) VALUES
  ('fee-stu-1', 'RCP-2026-1040', '2026-09-04', 6400, 'Online Portal', 'TXN-894120'),
  ('fee-stu-2', 'RCP-2026-1041', '2026-09-04', 3410, 'Bank Transfer', 'TXN-894137'),
  ('fee-stu-4', 'RCP-2026-1043', '2026-09-04', 6600, 'Bank Transfer', 'TXN-894171'),
  ('fee-stu-5', 'RCP-2026-1044', '2026-09-04', 3520, 'Online Portal', 'TXN-894188'),
  ('fee-stu-7', 'RCP-2026-1046', '2026-09-04', 6600, 'Online Portal', 'TXN-894222'),
  ('fee-stu-8', 'RCP-2026-1047', '2026-09-04', 3520, 'Bank Transfer', 'TXN-894239'),
  ('fee-stu-10', 'RCP-2026-1049', '2026-09-04', 5400, 'Bank Transfer', 'TXN-894273'),
  ('fee-stu-11', 'RCP-2026-1050', '2026-09-04', 3520, 'Online Portal', 'TXN-894290')
ON CONFLICT (receipt_no) DO NOTHING;

-- 11. NOTICES (5 records)
INSERT INTO public.notices (id, title, category, content, publish_date, event_date, author, pinned) VALUES
  ('not-1', 'Fall 2026 Final Examination Schedule Published', 'Examination', 'The official examination timetable for Semester 1, 3, 5, and 7 is now live. Students must verify their hall tickets at least 72 hours prior to their first paper.', '2026-11-12', '2026-12-08', 'Office of the Registrar', true),
  ('not-2', 'Annual cgc Research & Innovation Symposium', 'Event', 'Undergraduate and graduate scholars across Computer Science, AI, and Engineering will present capstone prototypes in Turing Hall Atrium.', '2026-11-10', '2026-11-21', 'Dr. Evelyn Vance', true),
  ('not-3', 'Thanksgiving Academic Recess — Campus Closure Dates', 'Holiday', 'All instructional classes and administrative offices will remain closed from November 26 through November 29. Library reading rooms operate on holiday hours.', '2026-11-08', '2026-11-26', 'University Administration', false),
  ('not-4', 'Semester Tuition Fee Clearance Deadline Reminder', 'Academic', 'Students with partial or pending Fall 2026 tuition balances are advised to settle dues before November 30 to avoid late administrative surcharges.', '2026-11-06', '2026-11-30', 'Bursar & Accounts Office', false),
  ('not-5', 'Faculty Workshop: AI-Assisted Curriculum Assessment', 'Event', 'Mandatory pedagogical seminar for all full-time faculty members covering automated rubric calibration and academic integrity standards.', '2026-11-04', '2026-11-19', 'Academic Senate', false)
ON CONFLICT (id) DO NOTHING;

-- 12. ACTIVITY LOGS (5 records)
INSERT INTO public.activity_logs (id, timestamp, actor, role, action, module, detail) VALUES
  ('act-1', '2026-11-14T08:52:00Z', 'Prof. Claire Lin', 'teacher', 'Marked Attendance', 'Attendance', 'Recorded daily attendance for CS301 (Data Structures & Algorithms)'),
  ('act-2', '2026-11-14T08:15:00Z', 'Dr. Evelyn Vance', 'admin', 'Published Notice', 'Notices', 'Pinned Fall 2026 Final Examination Schedule to campus board'),
  ('act-3', '2026-11-13T16:40:00Z', 'Dr. Evelyn Vance', 'admin', 'Enrolled Student', 'Students', 'Admitted Owen Gallagher (STU-2026-012) to B.Eng. Electrical Engineering'),
  ('act-4', '2026-11-13T14:20:00Z', 'Prof. Claire Lin', 'teacher', 'Updated Grades', 'Results', 'Uploaded Midterm Assessment scores for Semester 5 CS cohort'),
  ('act-5', '2026-11-12T11:05:00Z', 'Dr. Evelyn Vance', 'admin', 'Verified Payment', 'Fees', 'Confirmed full tuition settlement for Maya Patel (RCP-2026-1040)')
ON CONFLICT (id) DO NOTHING;

-- 13. INSTITUTION SETTINGS (1 singleton row)
INSERT INTO public.institution_settings (id, institution_name, short_code, academic_year, current_semester, contact_email, contact_phone, address, passing_percentage, attendance_threshold, late_fee_per_day)
VALUES (1, 'cgc University', 'NBU-SIMS', '2026–2027', 'Fall Semester 2026', 'registrar@cgc.edu', '+1 (617) 555-0100', '100 University Terrace, Boston, MA 02115', 40, 75, 25)
ON CONFLICT (id) DO UPDATE SET
  institution_name     = EXCLUDED.institution_name,
  short_code           = EXCLUDED.short_code,
  academic_year        = EXCLUDED.academic_year,
  current_semester     = EXCLUDED.current_semester,
  contact_email        = EXCLUDED.contact_email,
  contact_phone        = EXCLUDED.contact_phone,
  address              = EXCLUDED.address,
  passing_percentage   = EXCLUDED.passing_percentage,
  attendance_threshold = EXCLUDED.attendance_threshold,
  late_fee_per_day     = EXCLUDED.late_fee_per_day;

