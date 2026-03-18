import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Core Pages
import LandingPage from "./pages/LandingPage";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateQuizPage from "./pages/teacher/CreateQuizPage";
import QuestionBankPage from "./pages/teacher/QuestionBankPage";
import TeacherAnalyticsPage from "./pages/teacher/TeacherAnalyticsPage";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import QuizAttemptPage from "./pages/student/QuizAttemptPage";
import ResultPage from "./pages/student/ResultPage";
import StudentAnalyticsPage from "./pages/student/StudentAnalyticsPage";
import LeaderboardPage from "./pages/student/LeaderboardPage";

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-brand-violet/20 rounded-full" />
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-brand-violet border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "teacher") return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<RoleRedirect />} />

        {/* Teacher */}
        <Route path="/teacher" element={
          <ProtectedRoute roles={["teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/teacher/quiz/create" element={
          <ProtectedRoute roles={["teacher"]}>
            <CreateQuizPage />
          </ProtectedRoute>
        } />
        <Route path="/teacher/quiz/:quizId/edit" element={
          <ProtectedRoute roles={["teacher"]}>
            <CreateQuizPage />
          </ProtectedRoute>
        } />
        <Route path="/teacher/questions" element={
          <ProtectedRoute roles={["teacher"]}>
            <QuestionBankPage />
          </ProtectedRoute>
        } />
        <Route path="/teacher/analytics/:quizId" element={
          <ProtectedRoute roles={["teacher"]}>
            <TeacherAnalyticsPage />
          </ProtectedRoute>
        } />

        {/* Student */}
        <Route path="/student" element={
          <ProtectedRoute roles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/quiz/:quizId/attempt" element={
          <ProtectedRoute roles={["student"]}>
            <QuizAttemptPage />
          </ProtectedRoute>
        } />
        <Route path="/student/result/:attemptId" element={
          <ProtectedRoute roles={["student"]}>
            <ResultPage />
          </ProtectedRoute>
        } />
        <Route path="/student/analytics" element={
          <ProtectedRoute roles={["student"]}>
            <StudentAnalyticsPage />
          </ProtectedRoute>
        } />
        <Route path="/student/leaderboard" element={
          <ProtectedRoute roles={["student"]}>
            <LeaderboardPage />
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--surface-color)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "1rem",
              backdropFilter: "blur(10px)",
              padding: "1rem 1.5rem"
            },
          }}
        />
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
