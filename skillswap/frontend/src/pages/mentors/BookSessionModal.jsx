import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { FiClock, FiCalendar, FiX, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BookSessionModal({ session, mentor, onClose, onBooked }) {
  const [availability, setAvailability] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [customDate, setCustomDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=pick slot, 2=confirm

  const mentorId = mentor.user_id || mentor.id;

  useEffect(() => {
    api.get(`/users/${mentorId}/availability?session_id=${session.id}`).then(res => setAvailability(res.data));
  }, [mentorId, session.id]);

  // Generate next 14 days of available slots based on mentor availability
  const generateSlots = () => {
    const slots = [];
    const today = new Date();
    for (let d = 1; d <= 14; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      const dayOfWeek = date.getDay();
      const matching = availability.filter(a => a.day_of_week === dayOfWeek);
      matching.forEach(a => {
        const [startH, startM] = a.start_time.split(':');
        const slotDate = new Date(date);
        slotDate.setHours(parseInt(startH), parseInt(startM), 0, 0);
        slots.push({
          label: `${DAYS[dayOfWeek]}, ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${a.start_time.slice(0, 5)}`,
          datetime: slotDate.toISOString(),
        });
      });
    }
    return slots;
  };

  const slots = generateSlots();

  const handleBook = async () => {
    const scheduled_at = selectedSlot || customDate;
    if (!scheduled_at) { toast.error('Please select a time slot'); return; }
    setLoading(true);
    try {
      await api.post('/bookings', {
        session_id: session.id,
        scheduled_at,
        notes,
      });
      toast.success('Booking request sent! The mentor will confirm shortly.');
      onBooked();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Apply for Session</h2>
            <p className="text-sm text-gray-500 mt-0.5">with {mentor.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FiX size={18} />
          </button>
        </div>

        {/* Session Summary */}
        <div className="mx-6 mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-semibold text-gray-900">{session.title}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1"><FiClock size={13} /> {session.duration_minutes} min</span>
            <span className="capitalize">{session.session_type}</span>
            <span className="font-bold text-blue-600">{formatCurrency(session.price)}</span>
          </div>
          {session.description && <p className="text-xs text-gray-500 mt-2">{session.description}</p>}
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Pick Slot */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FiCalendar size={15} /> Choose a Time Slot
            </label>

            {slots.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {slots.map((slot, i) => (
                  <button key={i} type="button"
                    onClick={() => { setSelectedSlot(slot.datetime); setCustomDate(''); }}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all
                      ${selectedSlot === slot.datetime
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-200 hover:border-blue-300 text-gray-700'}`}>
                    📅 {slot.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
                No recurring slots set by mentor. Please pick a custom date below.
              </div>
            )}

            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Or pick a custom date & time</label>
              <input type="datetime-local" className="input text-sm"
                value={customDate}
                min={new Date(Date.now() + 86400000).toISOString().slice(0, 16)}
                onChange={e => { setCustomDate(e.target.value); setSelectedSlot(null); }} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              What do you want to learn? <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea className="input resize-none text-sm" rows={3}
              placeholder="Describe your goals, current level, specific topics..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {/* Selected summary */}
          {(selectedSlot || customDate) && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
              ✅ Selected: <strong>{formatDateTime(selectedSlot || customDate)}</strong>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleBook} disabled={loading || (!selectedSlot && !customDate)}
              className="btn-primary flex-1">
              {loading ? 'Sending...' : `Apply — ${formatCurrency(session.price)}`}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            The mentor will review and confirm your booking. You'll be notified by email.
          </p>
        </div>
      </div>
    </div>
  );
}
