import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import layouts
import DashboardLayout from './layouts/DashboardLayout';

// Import pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyOtp from './pages/VerifyOtp';
import VerifyCertificate from './pages/VerifyCertificate';

import StudentDashboard from './pages/StudentDashboard';
import AIChatbot from './pages/AIChatbot';
import AIRoadmap from './pages/AIRoadmap';
import AIResume from './pages/AIResume';
import AISkillGap from './pages/AISkillGap';
import AIMockInterview from './pages/AIMockInterview';
import AIQuiz from './pages/AIQuiz';
import MentorsSearch from './pages/MentorsSearch';
import CoursesSearch from './pages/CoursesSearch';
import CourseDetail from './pages/CourseDetail';
import CodingArena from './pages/CodingArena';
import ForumBoard from './pages/ForumBoard';
import CertificatesCenter from './pages/CertificatesCenter';
import UserProfile from './pages/UserProfile';

import MentorDashboard from './pages/MentorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChatRoom from './pages/ChatRoom';

// Route Guard for authenticated users
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light dark:bg-brand-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading CareerNest Portal...</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

// Route Guard for specific roles (student, mentor, admin)
const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/verify-certificate/:id" element={<VerifyCertificate />} />

        {/* PROTECTED STUDENT ROUTES */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <StudentDashboard />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-chatbot"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <AIChatbot />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-roadmap"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <AIRoadmap />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-resume"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <AIResume />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-gap"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <AISkillGap />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-interview"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <AIMockInterview />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-quiz"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <AIQuiz />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentors"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <MentorsSearch />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <CoursesSearch />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <CourseDetail />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <CodingArena />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/certificates"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <CertificatesCenter />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* PROTECTED MENTOR ROUTES */}
        <Route
          path="/mentor/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['mentor']}>
                <DashboardLayout>
                  <MentorDashboard />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* PROTECTED ADMIN ROUTES */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mentors-approval"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDashboard /> {/* Displays the approval screen as part of admin actions */}
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* COMMON SHARED DASHBOARD ROUTING */}
        <Route
          path="/forum"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ForumBoard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ChatRoom />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserProfile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all fallback redirects */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
