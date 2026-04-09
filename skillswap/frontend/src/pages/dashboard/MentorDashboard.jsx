import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import BookingCard from '../../components/BookingCard';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import SessionForm from './SessionForm';
import AvailabilityManager from './AvailabilityManager';
import MentorSessionCard from './MentorSessionCard';

export default function MentorDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [tab, setTab] = useState('bookings');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [availabilitySession, setAvailabilitySession] = useState(null);

  const handleSetAvailability = (session) => {
    setAvailabilitySession(session);
    setShowAvailability(true);
  };

  useEffect(() => {
    if (!user?.id) return;
    api.get('/bookings?role=mentor').then(res => setBookings(res.data));
    api.get(`/sessions?mentor_id=${user.id}`).then(res => setSessions(res.data));
    api.get('/payments/earnings').then(res => setEarnings(res.data));
  }, [user?.id]);

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
          <div className="flex gap-2">
            <button onClick={() => setShowAvailability(true)} className="btn-secondary">📅 Set Availability</button>
            <button onClick={() => setShowSessionForm(true)} className="btn-primary">+ New Session</button>
          </div>
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
            {/* Pending requests highlighted */}
            {bookings.filter(b => b.status === 'pending').length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-2">
                <p className="text-sm font-semibold text-yellow-800 mb-3">
                  🔔 {bookings.filter(b => b.status === 'pending').length} pending booking request(s)
                </p>
                {bookings.filter(b => b.status === 'pending').map(b => (
                  <div key={b.id} className="bg-white rounded-xl p-4 border border-yellow-200 mb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{b.session_title || 'Session'}</p>
                        <p className="text-sm text-gray-500">from <strong>{b.learner_name}</strong></p>
                        <p className="text-sm text-gray-500">{new Date(b.scheduled_at).toLocaleString('en-IN')}</p>
                        {b.notes && <p className="text-xs text-gray-400 mt-1 italic">"{b.notes}"</p>}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => handleConfirm(b.id)} className="btn-primary text-xs py-1.5 px-3">✓ Confirm</button>
                        <button onClick={() => handleCancel(b.id)} className="btn-danger text-xs py-1.5 px-3">✗ Decline</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {bookings.filter(b => b.status !== 'pending').length === 0 && bookings.filter(b => b.status === 'pending').length === 0
              ? <p className="text-center py-12 text-gray-500">No bookings yet.</p>
              : bookings.filter(b => b.status !== 'pending').map(b => (
                <BookingCard key={b.id} booking={b} onCancel={handleCancel} />
              ))}
          </div>
        )}

        {tab === 'sessions' && (
          <div className="space-y-3">
            {sessions.length === 0
              ? <p className="text-center py-12 text-gray-500">No sessions yet. Click "+ New Session" to create one.</p>
              : sessions.map(s => (
                <MentorSessionCard
                  key={s.id}
                  session={s}
                  onSetAvailability={handleSetAvailability}
                />
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

      {showAvailability && (
        <AvailabilityManager
          mentorId={user?.id}
          preSelectedSession={availabilitySession}
          onClose={() => { setShowAvailability(false); setAvailabilitySession(null); }}
        />
      )}
    </div>
  );
}
