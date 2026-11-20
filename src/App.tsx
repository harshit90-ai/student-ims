import { useCallback, useEffect, useState } from 'react';
import { BackendInspector } from './components/BackendInspector';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { TopBar } from './components/TopBar';
import { AttendancePage } from './pages/AttendancePage';
import { CoursesSubjectsPage } from './pages/CoursesSubjectsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExaminationsPage } from './pages/ExaminationsPage';
import { FeesPage } from './pages/FeesPage';
import { NoticesPage } from './pages/NoticesPage';
import { ReportsPage } from './pages/ReportsPage';
import { ResultsPage } from './pages/ResultsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentsPage } from './pages/StudentsPage';
import { TeachersPage } from './pages/TeachersPage';
import { simsApi, type PublicSimsData } from './services/api';
import type { AuthUser, NavSection } from './types/sims';

const SESSION_KEY = 'cgc_sims_user';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      return saved ? (JSON.parse(saved) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [data, setData] = useState<PublicSimsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback(
    (type: 'success' | 'error' | 'info', title: string, message?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const payload = await simsApi.bootstrap();
      setData(payload);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to connect to SIMS backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadWorkspace();
    }
  }, [user, loadWorkspace]);

  const handleLoginSuccess = (authUser: AuthUser, remember: boolean) => {
    setUser(authUser);
    setActiveSection('dashboard');
    try {
      if (remember) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      }
    } catch {
      // Ignore storage quota issues
    }
  };

  const handleLogout = () => {
    setUser(null);
    setData(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    notify('info', 'Signed Out', 'You have safely logged out of cgc SIMS.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {!user ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} onNotify={notify} />
      ) : (
        <div className="flex min-h-screen">
          <Sidebar
            role={user.role}
            activeSection={activeSection}
            collapsed={sidebarCollapsed}
            mobileOpen={mobileMenuOpen}
            onSelect={setActiveSection}
            onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            onCloseMobile={() => setMobileMenuOpen(false)}
            onLogout={handleLogout}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <TopBar
              user={user}
              activeSection={activeSection}
              notices={data?.notices || []}
              onOpenMobileMenu={() => setMobileMenuOpen(true)}
              onNavigate={setActiveSection}
              onLogout={handleLogout}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto pb-20">
              {loading && !data ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                  <div className="h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
                </div>
              ) : loadError ? (
                <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
                  <p className="text-sm font-semibold text-red-700">{loadError}</p>
                  <button
                    type="button"
                    onClick={loadWorkspace}
                    className="mt-4 px-4 py-2 bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg"
                  >
                    Retry Connection
                  </button>
                </div>
              ) : (
                data && (
                  <>
                    {activeSection === 'dashboard' && (
                      <DashboardPage
                        user={user}
                        data={data}
                        onNavigate={setActiveSection}
                        onUpdateStudent={(updated) =>
                          setData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  students: prev.students.map((s) =>
                                    s.id === updated.id ? updated : s
                                  ),
                                }
                              : prev
                          )
                        }
                        onNotify={notify}
                      />
                    )}

                    {activeSection === 'students' && (
                      <StudentsPage
                        role={user.role}
                        actorName={user.name}
                        students={data.students}
                        courses={data.courses}
                        departments={data.departments}
                        onCreated={(stu) => {
                          loadWorkspace();
                          setData((prev) =>
                            prev ? { ...prev, students: [stu, ...prev.students] } : prev
                          );
                        }}
                        onUpdated={(stu) =>
                          setData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  students: prev.students.map((s) =>
                                    s.id === stu.id ? stu : s
                                  ),
                                }
                              : prev
                          )
                        }
                        onDeleted={(id) =>
                          setData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  students: prev.students.filter((s) => s.id !== id),
                                  fees: prev.fees.filter((f) => f.studentId !== id),
                                }
                              : prev
                          )
                        }
                        onNotify={notify}
                      />
                    )}

                    {activeSection === 'teachers' && (
                      <TeachersPage
                        role={user.role}
                        teachers={data.teachers}
                        departments={data.departments}
                        subjects={data.subjects}
                        onCreated={(t) =>
                          setData((prev) =>
                            prev ? { ...prev, teachers: [t, ...prev.teachers] } : prev
                          )
                        }
                        onUpdated={(t) =>
                          setData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  teachers: prev.teachers.map((item) =>
                                    item.id === t.id ? t : item
                                  ),
                                }
                              : prev
                          )
                        }
                        onDeleted={(id) =>
                          setData((prev) =>
                            prev
                              ? { ...prev, teachers: prev.teachers.filter((t) => t.id !== id) }
                              : prev
                          )
                        }
                        onNotify={notify}
                      />
                    )}

                    {activeSection === 'attendance' && (
                      <AttendancePage
                        user={user}
                        students={data.students}
                        courses={data.courses}
                        subjects={data.subjects}
                        attendance={data.attendance}
                        onSaved={(records) =>
                          setData((prev) => (prev ? { ...prev, attendance: records } : prev))
                        }
                        onNotify={notify}
                      />
                    )}

                    {activeSection === 'courses' && (
                      <CoursesSubjectsPage
                        role={user.role}
                        courses={data.courses}
                        departments={data.departments}
                        subjects={data.subjects}
                        teachers={data.teachers}
                        onCourseCreated={(c) =>
                          setData((prev) =>
                            prev ? { ...prev, courses: [c, ...prev.courses] } : prev
                          )
                        }
                        onCourseDeleted={(id) =>
                          setData((prev) =>
                            prev
                              ? { ...prev, courses: prev.courses.filter((c) => c.id !== id) }
                              : prev
                          )
                        }
                        onDeptCreated={(d) =>
                          setData((prev) =>
                            prev ? { ...prev, departments: [...prev.departments, d] } : prev
                          )
                        }
                        onDeptDeleted={(id) =>
                          setData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  departments: prev.departments.filter((d) => d.id !== id),
                                }
                              : prev
                          )
                        }
                        onSubjectCreated={(s) =>
                          setData((prev) =>
                            prev ? { ...prev, subjects: [s, ...prev.subjects] } : prev
                          )
                        }
                        onSubjectDeleted={(id) =>
                          setData((prev) =>
                            prev
                              ? { ...prev, subjects: prev.subjects.filter((s) => s.id !== id) }
                              : prev
                          )
                        }
                        onNotify={notify}
                      />
                    )}

                    {activeSection === 'examinations' && (
                      <ExaminationsPage
                        role={user.role}
                        exams={data.exams}
                        courses={data.courses}
                        subjects={data.subjects}
                        onCreated={(e) =>
                          setData((prev) =>
                            prev ? { ...prev, exams: [e, ...prev.exams] } : prev
                          )
                        }
                        onDeleted={(id) =>
                          setData((prev) =>
                            prev
                              ? { ...prev, exams: prev.exams.filter((e) => e.id !== id) }
                              : prev
                          )
                        }
                        onNotify={notify}
                      />
                    )}

                    {activeSection === 'results' && (
                      <ResultsPage
                        user={user}
                        students={data.students}
                        exams={data.exams}
                        results={data.results}
                        onSaved={(res) =>
                          setData((prev) => {
                            if (!prev) return prev;
                            const exists = prev.results.some((r) => r.id === res.id);
                            return {
                              ...prev,
                              results: exists
                                ? prev.results.map((r) => (r.id === res.id ? res : r))
                                : [res, ...prev.results],
                            };
                          })
                        }
                        onDeleted={(id) =>
                          setData((prev) =>
                            prev
                              ? { ...prev, results: prev.results.filter((r) => r.id !== id) }
                              : prev
                          )
                        }
                        onNotify={notify}
                      />
                    )}

                    {activeSection === 'fees' && (
                      <FeesPage
                        user={user}
                        fees={data.fees}
                        onUpdated={(updated) =>
                          setData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  fees: prev.fees.map((f) =>
                                    f.id === updated.id ? updated : f
                                  ),
                                }
                              : prev
                          )
                        }
                        onNotify={notify}
                      />
                    )}

                    {activeSection === 'notices' && (
                      <NoticesPage
                        user={user}
                        notices={data.notices}
                        onCreated={(n) =>
                          setData((prev) =>
                            prev ? { ...prev, notices: [n, ...prev.notices] } : prev
                          )
                        }
                        onDeleted={(id) =>
                          setData((prev) =>
                            prev
                              ? { ...prev, notices: prev.notices.filter((n) => n.id !== id) }
                              : prev
                          )
                        }
                        onNotify={notify}
                      />
                    )}

                    {activeSection === 'reports' && (
                      <ReportsPage data={data} onNotify={notify} />
                    )}

                    {activeSection === 'settings' && (
                      <SettingsPage
                        user={user}
                        settings={data.settings}
                        onUpdated={(next) =>
                          setData((prev) => (prev ? { ...prev, settings: next } : prev))
                        }
                        onNotify={notify}
                      />
                    )}
                  </>
                )
              )}
            </main>
          </div>
        </div>
      )}

      {/* Corner Backend Data & Database Inspector */}
      <BackendInspector
        onDataReset={(fresh) => setData(fresh)}
        onNotify={notify}
      />
    </div>
  );
}

