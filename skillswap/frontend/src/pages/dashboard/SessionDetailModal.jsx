import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatDateTime, statusColor } from '../../utils/helpers';
import { FiX, FiClock, FiCalendar, FiUser, FiVideo, FiMessageSquare, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function SessionDetailModal({ booking, onClose }) {
  const [slots, setSlots] = useState([]);
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (booking.session_id) {
      api.get(`/sessions/${booking.session_id}`).then(r => setSession(r.data)).catch(() => {});
      api.get(`/users/${booking.mentor_id}/availability?session_id=${booking.session_id}`)
        .then(r => setSlots(r.data || []));
    }
  }, [booking]);

  const generateSlots = () => {
    const result = [];
    const today = new Date();
    for (let d = 1; d <= 14; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      const dow = date.getDay();
      slots.filter(s => s.day_of_week === dow).forEach(s => {
        const [h, m] = s.start_time.split(':');
        const dt = new Date(date);
        dt.setHours(parseInt(h), parseInt(m), 0, 0);
        result.push({
          label: `${DAYS[dow]}, ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${s.start_time.slice(0,5)} – ${s.end_time.slice(0,5)}`,
          datetime: dt.toISOString(),
        });
      });
    }
    return result;
  };

  const upcomingSlots = generateSlots();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900 text-lg">Session Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FiX size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Booking Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Booking Status</span>
            <span className={`badge text-sm px-3 py-1 ${statusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>

          {/* Session Info */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="font-bold text-gray-900 text-lg">{booking.session_title || session?.title || 'Session'}</h3>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1"><FiClock size={13} /> {booking.duration_minutes} min</span>
              <span className="font-bold text-blue-600">{formatCurrency(booking.price)}</span>
              {session?.session_type && (
                <span className="badge bg-white text-gray-600 capitalize">{session.session_type}</span>
              )}
              {session?.category && (
                <span className="badge bg-purple-50 text-purple-700">{session.category}</span>
              )}
            </div>
            {session?.description && (
              <p className="text-sm text-gray-600 mt-2">{session.description}</p>
            )}
          </div>

          {/* Mentor Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {booking.mentor_name?.[0]?.toUpperCase() || 'M'}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">Mentor: {booking.mentor_name}</p>
              <p className="text-xs text-gray-500">
                Scheduled: {formatDateTime(booking.scheduled_at)}
              </p>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
              <p className="text-xs font-semibold text-yellow-700 mb-1">Your Note</p>
              <p className="text-sm text-gray-700 italic">"{booking.notes}"</p>
            </div>
          )}

          {/* Meeting Link */}
          {booking.meeting_link && booking.status === 'confirmed' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm font-semibold text-green-700 mb-2">🎉 Session Confirmed — Meeting Link Ready</p>
              <a href={booking.meeting_link} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors w-fit">
                <FiExternalLink size={15} /> Join Google Meet
              </a>
            </div>
          )}

          {/* Available Time Slots for this session */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FiCalendar size={14} /> Available Slots for This Session
            </p>
            {upcomingSlots.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-400 text-center">
                No recurring slots set by mentor for this session.
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {upcomingSlots.map((slot, i) => (
                  <div key={i} className={`px-4 py-2.5 rounded-xl text-sm border
                    ${slot.datetime === booking.scheduled_at
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                    📅 {slot.label}
                    {slot.datetime === booking.scheduled_at && (
                      <span className="ml-2 text-xs text-blue-500">← Your slot</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {booking.status === 'confirmed' && (
              <Link to={`/video/${booking.id}`} onClick={onClose}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                <FiVideo size={14} /> Join Video Call
              </Link>
            )}
            <Link to={`/chat/${booking.mentor_id}`} onClick={onClose}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
              <FiMessageSquare size={14} /> Message Mentor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
