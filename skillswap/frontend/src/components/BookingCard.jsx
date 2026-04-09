import { formatDateTime, formatCurrency, statusColor } from '../utils/helpers';
import { Link } from 'react-router-dom';
import { FiVideo, FiMessageSquare, FiExternalLink, FiClock, FiCalendar } from 'react-icons/fi';

export default function BookingCard({ booking, onCancel, onComplete }) {
  const otherPersonId = booking.learner_id || booking.mentor_id;
  const otherPersonName = booking.mentor_name || booking.learner_name;

  return (
    <div className="card hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{booking.session_title || 'Session'}</h3>
          {otherPersonName && (
            <p className="text-sm text-gray-500 mt-0.5">
              with <span className="font-medium text-gray-700">{otherPersonName}</span>
            </p>
          )}
        </div>
        <span className={`badge flex-shrink-0 ${statusColor(booking.status)}`}>
          {booking.status}
        </span>
      </div>

      {/* Details */}
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <FiCalendar size={13} className="text-blue-500" />
          {formatDateTime(booking.scheduled_at)}
        </span>
        <span className="flex items-center gap-1.5">
          <FiClock size={13} className="text-blue-500" />
          {booking.duration_minutes} min
        </span>
        <span className="font-semibold text-blue-600">{formatCurrency(booking.price)}</span>
      </div>

      {/* Meeting Link — shown when confirmed */}
      {booking.status === 'confirmed' && booking.meeting_link && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-green-700 mb-0.5">Meeting Link Ready</p>
            <p className="text-xs text-green-600 truncate max-w-xs">{booking.meeting_link}</p>
          </div>
          <a href={booking.meeting_link} target="_blank" rel="noreferrer"
            className="flex-shrink-0 flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
            <FiExternalLink size={13} /> Join Meet
          </a>
        </div>
      )}

      {/* Notes */}
      {booking.notes && (
        <p className="mt-2 text-xs text-gray-400 italic">"{booking.notes}"</p>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {booking.status === 'confirmed' && (
          <Link to={`/video/${booking.id}`}
            className="btn-primary text-sm py-1.5 flex items-center gap-1.5">
            <FiVideo size={14} /> Video Call
          </Link>
        )}
        {otherPersonId && (
          <Link to={`/chat/${otherPersonId}`}
            className="btn-secondary text-sm py-1.5 flex items-center gap-1.5">
            <FiMessageSquare size={14} /> Message
          </Link>
        )}
        {booking.status === 'confirmed' && onComplete && (
          <button onClick={() => onComplete(booking.id)}
            className="btn-secondary text-sm py-1.5">
            Mark Complete
          </button>
        )}
        {['pending', 'confirmed'].includes(booking.status) && onCancel && (
          <button onClick={() => onCancel(booking.id)}
            className="btn-danger text-sm py-1.5">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
