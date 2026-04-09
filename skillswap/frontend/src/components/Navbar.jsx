import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiMenu, FiX, FiMessageSquare } from 'react-icons/fi';
import NotificationDropdown from './NotificationDropdown';
import { getInitials } from '../utils/helpers';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const dashboardPath = user?.role === 'admin' ? '/admin'
    : user?.role === 'mentor' ? '/mentor/dashboard' : '/dashboard';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            <span className="font-bold text-xl text-gray-900">SkillSwap</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/mentors" className="text-gray-600 hover:text-blue-600 transition-colors">Find Mentors</Link>
            <Link to="/sessions" className="text-gray-600 hover:text-blue-600 transition-colors">Browse Sessions</Link>
            {user && <Link to={dashboardPath} className="text-gray-600 hover:text-blue-600 transition-colors">Dashboard</Link>}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/chat" className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100">
                  <FiMessageSquare size={20} />
                </Link>
                <div className="relative">
                  <button onClick={() => setNotifOpen(!notifOpen)} className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100">
                    <FiBell size={20} />
                  </button>
                  {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
                </div>
                <div className="relative">
                  <button onClick={() => setProfileOpen(!profileOpen)}
                    className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                    {user.profile?.avatar_url
                      ? <img src={user.profile.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="avatar" />
                      : getInitials(user.profile?.name || user.email)}
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <Link to="/profile/edit" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit Profile</Link>
                      <Link to={dashboardPath} onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</Link>
                      <hr className="my-1" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm">Login</Link>
                <Link to="/signup" className="btn-primary text-sm">Sign Up</Link>
              </div>
            )}
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          <Link to="/mentors" className="block py-2 text-gray-700" onClick={() => setMenuOpen(false)}>Find Mentors</Link>
          <Link to="/sessions" className="block py-2 text-gray-700" onClick={() => setMenuOpen(false)}>Browse Sessions</Link>
          {user && <Link to={dashboardPath} className="block py-2 text-gray-700" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
        </div>
      )}
    </nav>
  );
}
