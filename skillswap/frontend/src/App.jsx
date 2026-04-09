import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import MentorList from './pages/mentors/MentorList';
import MentorProfile from './pages/mentors/MentorProfile';
import SessionDetail from './pages/sessions/SessionDetail';
import LearnerDashboard from './pages/dashboard/LearnerDashboard';
import MentorDashboard from './pages/dashboard/MentorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ProfileEdit from './pages/profile/ProfileEdit';
import BookingPage from './pages/bookings/BookingPage';
import ChatPage from './pages/chat/ChatPage';
import VideoCall from './pages/video/VideoCall';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/mentors" element={<MentorList />} />
          <Route path="/mentors/:id" element={<MentorProfile />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/bookings" element={<BookingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:userId" element={<ChatPage />} />
            <Route path="/video/:bookingId" element={<VideoCall />} />
          </Route>

          <Route element={<ProtectedRoute roles={['learner']} />}>
            <Route path="/dashboard" element={<LearnerDashboard />} />
          </Route>

          <Route element={<ProtectedRoute roles={['mentor']} />}>
            <Route path="/mentor/dashboard" element={<MentorDashboard />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}
