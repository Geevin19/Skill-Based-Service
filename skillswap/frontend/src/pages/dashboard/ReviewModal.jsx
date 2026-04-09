import { useState } from 'react';
import StarRating from '../../components/StarRating';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ReviewModal({ booking, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/bookings/${booking.id}/status`, { status: 'completed' });
      await api.post('/reviews', { booking_id: booking.id, rating, comment });
      toast.success('Review submitted!');
      onSubmit();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Rate your session</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <StarRating rating={rating} interactive onChange={setRating} size={28} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
            <textarea className="input resize-none" rows={3} placeholder="Share your experience..."
              value={comment} onChange={e => setComment(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
