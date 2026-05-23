import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { Navbar } from './components/shared/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExamListPage } from './pages/ExamListPage';
import { ExamPage } from './pages/ExamPage';
import { ResultPage } from './pages/ResultPage';
import { QuestionsPage } from './pages/QuestionsPage';
import { StudentManagementPage } from './pages/StudentManagementPage';
import { StudentProgressPage } from './pages/StudentProgressPage';
import { ExamStructurePage } from './pages/ExamStructurePage';
import { FlashcardListPage } from './pages/FlashcardListPage';
import { FlashcardPage } from './pages/FlashcardPage';

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
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/exam" element={<ExamListPage />} />
                <Route path="/exam/:examId" element={<ExamPage />} />
                <Route path="/exam/:examId/result" element={<ResultPage />} />
                <Route path="/flashcard" element={<FlashcardListPage />} />
                <Route path="/flashcard/:examId" element={<FlashcardPage />} />
              </Route>
            </Route>

            {/* Teacher Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
              <Route element={<Layout />}>
                <Route path="/questions" element={<QuestionsPage />} />
                <Route path="/teacher/exam-structure" element={<ExamStructurePage />} />
                <Route path="/teacher/students" element={<StudentManagementPage />} />
                <Route path="/teacher/students/:studentId" element={<StudentProgressPage />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
