import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import layouts
import DashboardLayout from './layouts/DashboardLayout';

// Lazy-loaded public & auth pages
const Landing = React.lazy(() => import('./pages/Landing'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const VerifyOtp = React.lazy(() => import('./pages/VerifyOtp'));
const VerifyCertificate = React.lazy(() => import('./pages/VerifyCertificate'));

// Lazy-loaded student core & AI pages
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const AIChatbot = React.lazy(() => import('./pages/AIChatbot'));
const AIJobAnalyzer = React.lazy(() => import('./pages/AIJobAnalyzer'));
const JobApplicationCopilot = React.lazy(() => import('./pages/JobApplicationCopilot'));
const StudyPods = React.lazy(() => import('./pages/StudyPods'));
const MicroInternships = React.lazy(() => import('./pages/MicroInternships'));
const CareerPassport = React.lazy(() => import('./pages/CareerPassport'));
const MentorshipRoom = React.lazy(() => import('./pages/MentorshipRoom'));

const AIRoadmap = React.lazy(() => import('./pages/AIRoadmap'));
const AIResume = React.lazy(() => import('./pages/AIResume'));
const AISkillGap = React.lazy(() => import('./pages/AISkillGap'));
const AIMockInterview = React.lazy(() => import('./pages/AIMockInterview'));
const AIQuiz = React.lazy(() => import('./pages/AIQuiz'));
const MentorsSearch = React.lazy(() => import('./pages/MentorsSearch'));
const CoursesSearch = React.lazy(() => import('./pages/CoursesSearch'));
const CourseDetail = React.lazy(() => import('./pages/CourseDetail'));
const CodingArena = React.lazy(() => import('./pages/CodingArena'));
const ForumBoard = React.lazy(() => import('./pages/ForumBoard'));
const CertificatesCenter = React.lazy(() => import('./pages/CertificatesCenter'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));

// Lazy-loaded role-specific & communication pages
const MentorDashboard = React.lazy(() => import('./pages/MentorDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const ChatRoom = React.lazy(() => import('./pages/ChatRoom'));

// Lazy-loaded community pages
const CommunityHub = React.lazy(() => import('./pages/CommunityHub'));
const CommunityDetail = React.lazy(() => import('./pages/CommunityDetail'));
const CommunityManage = React.lazy(() => import('./pages/CommunityManage'));

// Consistent loading fallback matching CareerNest design system
const PageLoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-transparent">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Loading CareerNest view...</p>
    </div>
  </div>
);

// Route Guard for authenticated users
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light dark:bg-brand-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading CareerNest Platform...</p>
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
      <React.Suspense fallback={<PageLoadingFallback />}>
        <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/verify-certificate/:id" element={<VerifyCertificate />} />
        <Route path="/passport/:id" element={<CareerPassport />} />
        <Route path="/portfolio/:id" element={<CareerPassport />} />

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
          path="/ai-job-analyzer"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <AIJobAnalyzer />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-applications"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <JobApplicationCopilot />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-pods"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <StudyPods />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/micro-internships"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <MicroInternships />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/passport"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <CareerPassport />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentorship-room/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <MentorshipRoom />
              </DashboardLayout>
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
                  <AdminDashboard />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* COMMON SHARED DASHBOARD ROUTING */}
        {/* COMMUNITY ROUTES */}
        <Route
          path="/communities"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CommunityHub />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities/:idOrSlug"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CommunityDetail />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities/:idOrSlug/manage"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CommunityManage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

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
    </React.Suspense>
  </Router>
);
}

export default App;
