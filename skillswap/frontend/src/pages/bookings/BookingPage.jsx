import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import BookingCard from '../../components/BookingCard';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function BookingPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    api.get(`/bookings?role=${user?.role}`).then(res => setBookings(res.data));
  }, [user]);

  const handleCancel = async (id) => {
    try {
      await api.put(`/bookings/${id}/status`, { status: 'cancelled' });
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

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
            <BookingCard key={b.id} booking={b} onCancel={tab === 'upcoming' ? handleCancel : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}
