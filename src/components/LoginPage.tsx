import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { CAMPUS_HERO_IMAGE } from '../assets/media';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import type { AuthUser, UserRole } from '../types/sims';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, remember: boolean) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string; label: string }> = {
  admin: { email: 'admin@cgc.edu', password: 'admin123', label: 'Admin Panel' },
  teacher: { email: 'teacher@cgc.edu', password: 'teacher123', label: 'Faculty Portal' },
  student: { email: 'student@cgc.edu', password: 'student123', label: 'Student Portal' },
};

const FALLBACK_COURSES = [
  'B.S. Computer Science',
  'B.S. Data Science & AI',
  'B.Eng. Electrical Engineering',
  'BBA Finance & Analytics',
  'B.Eng. Mechanical Engineering',
];

const FALLBACK_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Data Science & AI',
  'Electrical & Electronics Engineering',
  'Business Administration',
  'Mechanical Engineering',
];

export function LoginPage({ onLoginSuccess, onNotify }: LoginPageProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [registerRole, setRegisterRole] = useState<'student' | 'teacher'>('student');

  // Login state
  const [role, setRole] = useState<UserRole>('admin');
  const [identifier, setIdentifier] = useState(DEMO_CREDENTIALS.admin.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.admin.password);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Shared Registration state (Student & Teacher)
  const [courses, setCourses] = useState<string[]>(FALLBACK_COURSES);
  const [departments, setDepartments] = useState<string[]>(FALLBACK_DEPARTMENTS);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCourse, setRegCourse] = useState(FALLBACK_COURSES[0]);
  const [regSemester, setRegSemester] = useState(1);
  const [regDepartment, setRegDepartment] = useState(FALLBACK_DEPARTMENTS[0]);
  const [regDesignation, setRegDesignation] = useState('Assistant Professor');
  const [regExperience, setRegExperience] = useState(3);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    simsApi
      .getPublicCatalog()
      .then((catalog) => {
        if (catalog.courses.length > 0) {
          const names = catalog.courses.map((c) => c.name);
          setCourses(names);
          setRegCourse(names[0]);
        }
        if (catalog.departments.length > 0) {
          const deptNames = catalog.departments.map((d) => d.name);
          setDepartments(deptNames);
          setRegDepartment(deptNames[0]);
        }
      })
      .catch(() => {
        // Keep fallback lists
      });
  }, []);

  const handleRoleSwitch = (nextRole: UserRole) => {
    setRole(nextRole);
    setErrorMsg('');
    setIdentifier(DEMO_CREDENTIALS[nextRole].email);
    setPassword(DEMO_CREDENTIALS[nextRole].password);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Please enter your email, username, or mobile number and password.');
      return;
    }
    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase is not connected. Please provide SUPABASE_URL and SUPABASE_ANON_KEY in your environment.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: identifier, password });
      if (error) {
        throw error;
      }
      const supabaseUser = data.user;
      const authUser: AuthUser = {
        id: supabaseUser.id,
        username: supabaseUser.email,
        email: supabaseUser.email,
        name: (supabaseUser.user_metadata?.full_name as string) ?? supabaseUser.email,
        role: role,
        avatar: supabaseUser.user_metadata?.avatar_url as string | undefined,
      };
      onNotify('success', `Welcome back, ${authUser.name}`, `Signed in to ${DEMO_CREDENTIALS[authUser.role].label}`);
      onLoginSuccess(authUser, rememberMe);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword) {
      setRegError('Full name, email address, mobile number, and password are required.');
      return;
    }
    if (regPhone.replace(/\D/g, '').length < 7) {
      setRegError('Please enter a valid mobile number with at least 7 digits.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setRegLoading(true);
    try {
      if (registerRole === 'student') {
        const res = await simsApi.registerStudent({
          fullName: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          password: regPassword,
          course: regCourse,
          semester: regSemester,
        });
        onNotify(
          'success',
          'Student Account Created',
          `Registered as ${res.student.registrationNumber}. Welcome to cgc SIMS!`
        );
        onLoginSuccess(res.user, true);
      } else {
        const res = await simsApi.registerTeacher({
          fullName: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          password: regPassword,
          department: regDepartment,
          designation: regDesignation,
          experienceYears: regExperience,
        });
        onNotify(
          'success',
          'Teacher Account Created',
          `Registered as ${res.teacher.teacherId}. Welcome to Faculty Portal!`
        );
        onLoginSuccess(res.user, true);
      }
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await simsApi.forgotPassword(forgotEmail);
      onNotify('success', 'Recovery Email Sent', res.message);
      setForgotOpen(false);
      setForgotEmail('');
    } catch (err) {
      onNotify('error', 'Reset Failed', err instanceof Error ? err.message : 'Invalid email address');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Institutional Visual Column */}
      <div className="relative lg:w-[48%] xl:w-[50%] min-h-[260px] lg:min-h-screen bg-[#0B1F3A] overflow-hidden flex flex-col justify-between p-8 lg:p-12 text-white">
        <img
          src={CAMPUS_HERO_IMAGE}
          alt="cgc University Campus"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-[#0B1F3A]/75 to-[#0B1F3A]/45" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-white">cgc University</p>
            <p className="text-xs text-blue-200">Student Information Management System</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg my-8 lg:my-0">
          <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight [text-wrap:balance]">
            Unified academic records, faculty operations, and student services.
          </h1>
          <p className="mt-4 text-sm lg:text-base text-slate-200 leading-relaxed">
            Manage admissions, daily attendance, semester examinations, fee ledgers, and official transcripts from one cohesive institutional platform.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
            <div>
              <p className="font-display text-2xl font-bold tabular-nums text-white">5</p>
              <p className="text-xs text-slate-300 mt-0.5">Academic Departments</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold tabular-nums text-white">100%</p>
              <p className="text-xs text-slate-300 mt-0.5">Live Express API</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold tabular-nums text-white">3</p>
              <p className="text-xs text-slate-300 mt-0.5">Role-Scoped Portals</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-300 flex items-center justify-between">
          <span>Academic Year 2026–2027</span>
          <span>Boston Campus · Registrar Office</span>
        </div>
      </div>

      {/* Right Authentication Form Column */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-white">
        <div className="w-full max-w-md">
          {/* Sign In vs Register Mode Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                authMode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setRegError('');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                authMode === 'register'
                  ? 'bg-[#0B1F3A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>Register</span>
            </button>
          </div>

          {authMode === 'login' ? (
            <>
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
                  Sign in to SIMS Portal
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Select your institutional role and enter your credentials.
                </p>
              </div>

              {/* Role Selector Segmented Control */}
              {!isSupabaseConfigured && (
                <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <span className="font-bold">⚠️ Warning:</span>
                  <span>Database not connected. Please set your Supabase URL and Anon Key in Vercel environment variables.</span>
                </div>
              )}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Portal Role
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  {(
                    [
                      { id: 'admin', label: 'Admin', icon: ShieldCheck },
                      { id: 'teacher', label: 'Teacher', icon: Building2 },
                      { id: 'student', label: 'Student', icon: UserCheck },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const active = role === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleRoleSwitch(item.id)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                          active
                            ? 'bg-[#0B1F3A] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label htmlFor="sims-identifier" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email, Username, or Mobile Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="sims-identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="name@cgc.edu or mobile number"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="sims-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="sims-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    <span>Remember me on this device</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(identifier.includes('@') ? identifier : '');
                      setForgotOpen(true);
                    }}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span>{loading ? 'Authenticating...' : `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Demo Credentials Panel */}
              <div className="mt-7 pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-700">Quick Demo Access</span>
                  <span className="text-xs text-slate-500">Click to auto-fill credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['admin', 'teacher', 'student'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleSwitch(r)}
                      className={`text-left p-2.5 rounded-lg border transition-colors ${
                        role === r
                          ? 'border-blue-600 bg-blue-50/70'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-900 capitalize">{r}</p>
                      <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                        {DEMO_CREDENTIALS[r].email.split('@')[0]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* STUDENT & TEACHER SELF-REGISTRATION FORM */
            <>
              <div className="mb-4">
                <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
                  Create Account
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Register with your email address, mobile number, and password.
                </p>
              </div>

              {/* Student vs Teacher Register Role Toggle */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterRole('student');
                    setRegError('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    registerRole === 'student'
                      ? 'bg-[#0B1F3A] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegisterRole('teacher');
                    setRegError('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    registerRole === 'teacher'
                      ? 'bg-[#0B1F3A] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Teacher</span>
                </button>
              </div>

              {regError && (
                <div className="mb-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
                  {regError}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder={registerRole === 'student' ? 'Alex Rivera' : 'Dr. Elena Rostova'}
                      className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="name@cgc.edu"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-phone"
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+1 (617) 555-0199"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {registerRole === 'student' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label htmlFor="reg-course" className="block text-xs font-semibold text-slate-700 mb-1">
                        Program / Course
                      </label>
                      <select
                        id="reg-course"
                        value={regCourse}
                        onChange={(e) => setRegCourse(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                      >
                        {courses.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="reg-sem" className="block text-xs font-semibold text-slate-700 mb-1">
                        Semester
                      </label>
                      <select
                        id="reg-sem"
                        value={regSemester}
                        onChange={(e) => setRegSemester(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Sem {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label htmlFor="reg-dept" className="block text-xs font-semibold text-slate-700 mb-1">
                        Department
                      </label>
                      <select
                        id="reg-dept"
                        value={regDepartment}
                        onChange={(e) => setRegDepartment(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                      >
                        {departments.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="reg-exp" className="block text-xs font-semibold text-slate-700 mb-1">
                        Exp. (Years)
                      </label>
                      <input
                        id="reg-exp"
                        type="number"
                        min={0}
                        max={50}
                        value={regExperience}
                        onChange={(e) => setRegExperience(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="reg-desig" className="block text-xs font-semibold text-slate-700 mb-1">
                        Academic Designation
                      </label>
                      <select
                        id="reg-desig"
                        value={regDesignation}
                        onChange={(e) => setRegDesignation(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                      >
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Visiting Faculty">Visiting Faculty</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 mb-1">
                    Create Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-11 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded"
                      aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-confirm" className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-confirm"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full mt-2 py-2.5 px-4 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span>
                    {regLoading
                      ? 'Creating Account...'
                      : registerRole === 'student'
                      ? 'Create Student Account'
                      : 'Create Teacher Account'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-600">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    handleRoleSwitch(registerRole);
                  }}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  Sign in to {registerRole === 'student' ? 'Student' : 'Faculty'} Portal
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Reset Password</h3>
                  <p className="text-xs text-slate-500">Enter your institutional email address</p>
                </div>
              </div>
              <form onSubmit={handleForgotSubmit} className="space-y-4 mt-4">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@cgc.edu"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 text-sm font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] disabled:opacity-60"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

