import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function SessionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/sessions/${id}`).then(res => setSession(res.data));
  }, [id]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    try {
      const booking = await api.post('/bookings', { session_id: id, scheduled_at: scheduledAt, notes });
      toast.success('Booking created! Proceed to payment.');
      navigate('/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{session.title}</h1>
          <p className="text-gray-500 text-sm mb-4">by {session.mentor_name}</p>
          {session.description && <p className="text-gray-600 mb-6">{session.description}</p>}

          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{formatCurrency(session.price)}</div>
              <div className="text-xs text-gray-500">Price</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{session.duration_minutes}m</div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 capitalize">{session.session_type}</div>
              <div className="text-xs text-gray-500">Type</div>
            </div>
          </div>

          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date & Time</label>
              <input type="datetime-local" className="input"
                value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required
                min={new Date().toISOString().slice(0, 16)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea className="input resize-none" rows={3} placeholder="What do you want to learn?"
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Booking...' : `Book for ${formatCurrency(session.price)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
