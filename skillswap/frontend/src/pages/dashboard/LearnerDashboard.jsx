import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import BookingCard from '../../components/BookingCard';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReviewModal from './ReviewModal';
import SessionDetailModal from './SessionDetailModal';

export default function LearnerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [reviewBooking, setReviewBooking] = useState(null);
  const [detailBooking, setDetailBooking] = useState(null);

  useEffect(() => {
    api.get('/bookings?role=learner').then(res => setBookings(res.data));
  }, []);

  const handleCancel = async (id) => {
    try {
      await api.put(`/bookings/${id}/status`, { status: 'cancelled', cancel_reason: 'Cancelled by learner' });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
    } catch { toast.error('Failed to cancel'); }
  };

  const filtered = bookings.filter(b =>
    tab === 'upcoming' ? ['pending', 'confirmed'].includes(b.status) :
    tab === 'completed' ? b.status === 'completed' : b.status === 'cancelled'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-500">Welcome back, {user?.profile?.name}</p>
          </div>
          <Link to="/mentors" className="btn-primary">Find Mentors</Link>
          <Link to="/sessions" className="btn-secondary ml-2">Browse Sessions</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            ['Total Sessions', bookings.length],
            ['Upcoming', bookings.filter(b => ['pending','confirmed'].includes(b.status)).length],
            ['Completed', bookings.filter(b => b.status === 'completed').length],
            ['Cancelled', bookings.filter(b => b.status === 'cancelled').length],
          ].map(([label, val]) => (
            <div key={label} className="card text-center">
              <div className="text-2xl font-bold text-blue-600">{val}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {['upcoming', 'completed', 'cancelled'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors
                ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No {tab} bookings.</div>
          ) : filtered.map(b => (
            <div key={b.id} className="cursor-pointer" onClick={() => setDetailBooking(b)}>
              <BookingCard booking={b}
                onCancel={tab === 'upcoming' ? (e) => { e.stopPropagation?.(); handleCancel(b.id); } : undefined}
                onComplete={tab === 'upcoming' && b.status === 'confirmed' ? (id) => { setReviewBooking(b); } : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      {reviewBooking && (
        <ReviewModal booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSubmit={() => {
            setBookings(prev => prev.map(b => b.id === reviewBooking.id ? { ...b, status: 'completed' } : b));
            setReviewBooking(null);
          }} />
      )}

      {detailBooking && (
        <SessionDetailModal
          booking={detailBooking}
          onClose={() => setDetailBooking(null)}
        />
      )}
    </div>
  );
}
