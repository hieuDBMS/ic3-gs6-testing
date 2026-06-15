import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { Navbar } from './components/shared/Navbar';

/* ─── Lazy-loaded pages ─────────────────────────────────────────────────────
   Each page becomes its own JS chunk. The browser only downloads a chunk when
   the user navigates to that route for the first time. Subsequent visits use
   the cached chunk. This reduces the initial bundle by ~70%.
──────────────────────────────────────────────────────────────────────────── */
const LoginPage             = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage          = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage         = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ExamListPage          = lazy(() => import('./pages/ExamListPage').then(m => ({ default: m.ExamListPage })));
const ExamPage              = lazy(() => import('./pages/ExamPage').then(m => ({ default: m.ExamPage })));
const ResultPage            = lazy(() => import('./pages/ResultPage').then(m => ({ default: m.ResultPage })));
const QuestionsPage         = lazy(() => import('./pages/QuestionsPage').then(m => ({ default: m.QuestionsPage })));
const QuestionFormPage      = lazy(() => import('./pages/QuestionFormPage').then(m => ({ default: m.QuestionFormPage })));
const StudentManagementPage = lazy(() => import('./pages/StudentManagementPage').then(m => ({ default: m.StudentManagementPage })));
const StudentProgressPage   = lazy(() => import('./pages/StudentProgressPage').then(m => ({ default: m.StudentProgressPage })));
const ExamStructurePage     = lazy(() => import('./pages/ExamStructurePage').then(m => ({ default: m.ExamStructurePage })));
const FlashcardListPage     = lazy(() => import('./pages/FlashcardListPage').then(m => ({ default: m.FlashcardListPage })));
const FlashcardPage         = lazy(() => import('./pages/FlashcardPage').then(m => ({ default: m.FlashcardPage })));
const MockExamSetupPage     = lazy(() => import('./pages/MockExamSetupPage').then(m => ({ default: m.MockExamSetupPage })));
const MockExamPage          = lazy(() => import('./pages/MockExamPage').then(m => ({ default: m.MockExamPage })));
const MockResultPage        = lazy(() => import('./pages/MockResultPage').then(m => ({ default: m.MockResultPage })));
const PaymentHistoryPage    = lazy(() => import('./pages/PaymentHistoryPage').then(m => ({ default: m.PaymentHistoryPage })));
const PaymentSettingsPage   = lazy(() => import('./pages/PaymentSettingsPage').then(m => ({ default: m.PaymentSettingsPage })));

/* ─── Page loading skeleton ──────────────────────────────────────────────── */
const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-indigo-100 animate-pulse" />
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

const Layout = () => (
  <>
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
  </>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard"                 element={<DashboardPage />} />
                  <Route path="/exam"                      element={<ExamListPage />} />
                  <Route path="/exam/:examId"              element={<ExamPage />} />
                  <Route path="/exam/:attemptId/result"    element={<ResultPage />} />
                  <Route path="/mock-exam"                 element={<MockExamSetupPage />} />
                  <Route path="/mock-exam/:attemptId"      element={<MockExamPage />} />
                  <Route path="/mock-exam/:attemptId/result" element={<MockResultPage />} />
                  <Route path="/flashcard"                 element={<FlashcardListPage />} />
                  <Route path="/flashcard/:examId"         element={<FlashcardPage />} />
                  <Route path="/payments"                  element={<PaymentHistoryPage />} />
                  <Route path="/teacher/payment-settings"  element={<PaymentSettingsPage />} />
                </Route>
              </Route>

              {/* Teacher Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                <Route element={<Layout />}>
                  <Route path="/questions"                         element={<QuestionsPage />} />
                  <Route path="/questions/new"                     element={<QuestionFormPage />} />
                  <Route path="/questions/:id/edit"                element={<QuestionFormPage />} />
                  <Route path="/teacher/exam-structure"            element={<ExamStructurePage />} />
                  <Route path="/teacher/students"                  element={<StudentManagementPage />} />
                  <Route path="/teacher/students/:studentId"       element={<StudentProgressPage />} />
                </Route>
              </Route>

              <Route path="/"  element={<Navigate to="/dashboard" replace />} />
              <Route path="*"  element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
