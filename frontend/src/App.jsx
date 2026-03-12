import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/admin/login/Login';
import Dashboard from './pages/admin/dashboard/Dashboard';
import Quizzes from './pages/admin/quizzes/Quizzes';
import QuizForm from './pages/admin/quizzes/QuizForm';
import Leaderboard from './pages/admin/leaderboard/Leaderboard';
import Settings from './pages/admin/settings/Settings';

// Student Pages
import QuizLanding from './pages/student/QuizLanding';
import QuizSession from './pages/student/QuizSession';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Public Admin Route */}
          <Route path="/admin/login" element={<Login />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="quizzes" element={<Quizzes />} />
            <Route path="quizzes/create" element={<QuizForm />} />
            <Route path="quizzes/:id/edit" element={<QuizForm />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Student App Routes */}
          <Route path="/quiz/:slug" element={<QuizLanding />} />
          <Route path="/quiz/:slug/session" element={<QuizSession />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
