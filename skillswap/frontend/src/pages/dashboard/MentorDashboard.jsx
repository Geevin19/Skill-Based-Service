import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import BookingCard from '../../components/BookingCard';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import SessionForm from './SessionForm';

export default function MentorDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [tab, setTab] = useState('bookings');
  const [showSessionForm, setShowSessionForm] = useState(false);

  useEffect(() => {
    api.get('/bookings?role=mentor').then(res => setBookings(res.data));
    api.get(`/sessions?mentor_id=${user.id}`).then(res => setSessions(res.data));
    api.get('/payments/earnings').then(res => setEarnings(res.data));
  }, []);

  const handleConfirm = async (id) => {
    try {
      await api.put(`/bookings/${id}/status`, { status: 'confirmed' });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
      toast.success('Booking confirmed');
    } catch { toast.error('Failed'); }
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/bookings/${id}/status`, { status: 'cancelled' });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
            <p className="text-gray-500">Welcome, {user?.profile?.name}</p>
          </div>
          <button onClick={() => setShowSessionForm(true)} className="btn-primary">+ New Session</button>
        </div>

        {/* Earnings Stats */}
        {earnings && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(earnings.summary?.total_earnings || 0)}</div>
              <div className="text-sm text-gray-500 mt-1">Total Earnings</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(earnings.summary?.monthly_earnings || 0)}</div>
              <div className="text-sm text-gray-500 mt-1">This Month</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-900">{bookings.filter(b => b.status === 'confirmed').length}</div>
              <div className="text-sm text-gray-500 mt-1">Upcoming</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-900">{bookings.filter(b => b.status === 'completed').length}</div>
              <div className="text-sm text-gray-500 mt-1">Completed</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {['bookings', 'sessions', 'transactions'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors
                ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'bookings' && (
          <div className="space-y-4">
            {bookings.length === 0 ? <p className="text-center py-12 text-gray-500">No bookings yet.</p>
              : bookings.map(b => (
                <div key={b.id}>
                  <BookingCard booking={b} onCancel={handleCancel} />
                  {b.status === 'pending' && (
                    <button onClick={() => handleConfirm(b.id)} className="btn-primary text-sm mt-2">Confirm Booking</button>
                  )}
                </div>
              ))}
          </div>
        )}

        {tab === 'sessions' && (
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="card flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.duration_minutes} min · {formatCurrency(s.price)} · {s.session_type}</p>
                </div>
                <span className={`badge ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'transactions' && (
          <div className="space-y-3">
            {earnings?.transactions?.map(t => (
              <div key={t.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{t.learner_name}</p>
                  <p className="text-sm text-gray-500">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <span className="font-semibold text-green-600">+{formatCurrency(t.net_amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSessionForm && (
        <SessionForm
          onClose={() => setShowSessionForm(false)}
          onCreated={(s) => { setSessions(prev => [s, ...prev]); setShowSessionForm(false); }}
        />
      )}
    </div>
  );
}
