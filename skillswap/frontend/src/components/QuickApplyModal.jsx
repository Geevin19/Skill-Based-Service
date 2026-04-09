import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDateTime, getInitials } from '../utils/helpers';
import StarRating from './StarRating';
import { FiX, FiClock, FiMapPin, FiCalendar, FiUser, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function QuickApplyModal({ mentor, onClose }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1); // 1=mentor info+sessions, 2=pick slot
  const [loading, setLoading] = useState(false);

  const mentorId = mentor.user_id || mentor.id;

  useEffect(() => {
    api.get(`/sessions?mentor_id=${mentorId}`).then(r => setSessions(r.data));
  }, [mentorId]);

  // Fetch availability when session is selected
  useEffect(() => {
    if (!selectedSession) return;
    api.get(`/users/${mentorId}/availability?session_id=${selectedSession.id}`)
      .then(r => setAvailability(r.data));
  }, [selectedSession, mentorId]);

  // Generate available slots for next 14 days
  const generateSlots = () => {
    const slots = [];
    const today = new Date();
    for (let d = 1; d <= 14; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      const dow = date.getDay();
      availability.filter(a => a.day_of_week === dow).forEach(a => {
        const [h, m] = a.start_time.split(':');
        const dt = new Date(date);
        dt.setHours(parseInt(h), parseInt(m), 0, 0);
        slots.push({
          label: `${DAYS[dow]}, ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${a.start_time.slice(0,5)}`,
          value: dt.toISOString(),
        });
      });
    }
    return slots;
  };

  const slots = generateSlots();

  const handleBook = async () => {
    const scheduled_at = selectedSlot || customDate;
    if (!selectedSession) { toast.error('Please select a session'); return; }
    if (!scheduled_at) { toast.error('Please select a time slot'); return; }
    setLoading(true);
    try {
      await api.post('/bookings', { session_id: selectedSession.id, scheduled_at, notes });
      toast.success('Application sent! Mentor will confirm shortly.');
      onClose();
      navigate('/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="p-1 hover:bg-gray-100 rounded-lg mr-1">
                ←
              </button>
            )}
            <h2 className="font-bold text-gray-900">
              {step === 1 ? 'Apply for a Session' : 'Choose Time Slot'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FiX size={18} />
          </button>
        </div>

        {step === 1 && (
          <div className="p-6 space-y-5">
            {/* Mentor Details */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-violet-50 rounded-xl border border-blue-100">
              <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xl flex-shrink-0 overflow-hidden">
                {mentor.avatar_url
                  ? <img src={mentor.avatar_url} className="w-full h-full object-cover" alt="" />
                  : getInitials(mentor.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-lg">{mentor.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <StarRating rating={parseFloat(mentor.avg_rating) || 0} size={13} />
                  <span className="text-xs text-gray-500">({mentor.total_reviews || 0} reviews)</span>
                </div>
                {mentor.location && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <FiMapPin size={11} /> {mentor.location}
                  </p>
                )}
                {mentor.experience_years > 0 && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <FiUser size={11} /> {mentor.experience_years} years experience
                  </p>
                )}
                {mentor.hourly_rate && (
                  <p className="text-sm font-bold text-blue-600 mt-1">{formatCurrency(mentor.hourly_rate)}/hr</p>
                )}
              </div>
            </div>

            {/* Bio */}
            {mentor.bio && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">About</p>
                <p className="text-sm text-gray-600 leading-relaxed">{mentor.bio}</p>
              </div>
            )}

            {/* Skills */}
            {mentor.skills?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.skills.map(s => (
                    <span key={s} className="badge bg-blue-50 text-blue-700">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Sessions to pick */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Select a Session</p>
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No sessions available yet.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map(s => (
                    <button key={s.id} type="button"
                      onClick={() => setSelectedSession(s)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all
                        ${selectedSession?.id === s.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{s.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><FiClock size={11} /> {s.duration_minutes} min</span>
                            <span className="capitalize badge bg-gray-100 text-gray-600">{s.session_type}</span>
                            {s.category && <span className="badge bg-purple-50 text-purple-700">{s.category}</span>}
                          </div>
                          {s.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{s.description}</p>}
                        </div>
                        <div className="ml-3 text-right flex-shrink-0">
                          <p className="font-bold text-blue-600">{formatCurrency(s.price)}</p>
                          {selectedSession?.id === s.id && (
                            <span className="text-xs text-blue-600">✓ Selected</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Message to Mentor <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea className="input resize-none text-sm" rows={2}
                placeholder="Your goals, current level, questions..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <button
              onClick={() => { if (!selectedSession) { toast.error('Please select a session first'); return; } setStep(2); setSelectedSlot(''); setCustomDate(''); }}
              className="btn-primary w-full flex items-center justify-center gap-2">
              Next: Choose Time Slot <FiChevronRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 space-y-5">
            {/* Selected session summary */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm">
              <p className="font-semibold text-gray-900">{selectedSession?.title}</p>
              <p className="text-blue-600 font-bold">{formatCurrency(selectedSession?.price)}</p>
            </div>

            {/* Slots */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiCalendar size={14} /> Available Slots for "{selectedSession?.title}"
              </p>
              {slots.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {slots.map((slot, i) => (
                    <button key={i} type="button"
                      onClick={() => { setSelectedSlot(slot.value); setCustomDate(''); }}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all
                        ${selectedSlot === slot.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 hover:border-blue-300 text-gray-700'}`}>
                      📅 {slot.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
                  Mentor hasn't set recurring slots. Pick a custom date below.
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Or pick a custom date & time</p>
              <input type="datetime-local" className="input text-sm"
                value={customDate}
                min={new Date(Date.now() + 86400000).toISOString().slice(0,16)}
                onChange={e => { setCustomDate(e.target.value); setSelectedSlot(''); }} />
            </div>

            {(selectedSlot || customDate) && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                ✅ <strong>{formatDateTime(selectedSlot || customDate)}</strong>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
              <button onClick={handleBook}
                disabled={loading || (!selectedSlot && !customDate)}
                className="btn-primary flex-1">
                {loading ? 'Sending...' : `Apply — ${formatCurrency(selectedSession?.price)}`}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Mentor will confirm your booking. You'll get an email notification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}