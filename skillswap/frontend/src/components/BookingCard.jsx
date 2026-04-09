import { formatDateTime, formatCurrency, statusColor } from '../utils/helpers';
import { Link } from 'react-router-dom';
import { FiVideo, FiMessageSquare } from 'react-icons/fi';

export default function BookingCard({ booking, onCancel, onComplete }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{booking.session_title || 'Session'}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{formatDateTime(booking.scheduled_at)}</p>
          <p className="text-sm text-gray-500">{booking.duration_minutes} min · {formatCurrency(booking.price)}</p>
        </div>
        <span className={`badge ${statusColor(booking.status)}`}>{booking.status}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {booking.mentor_name && (
          <span className="text-sm text-gray-600">with <strong>{booking.mentor_name}</strong></span>
        )}
        {booking.learner_name && (
          <span className="text-sm text-gray-600">with <strong>{booking.learner_name}</strong></span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {booking.status === 'confirmed' && (
          <Link to={`/video/${booking.id}`} className="btn-primary text-sm py-1.5 flex items-center gap-1">
            <FiVideo size={14} /> Join Call
          </Link>
        )}
        <Link to={`/chat/${booking.learner_id || booking.mentor_id}`} className="btn-secondary text-sm py-1.5 flex items-center gap-1">
          <FiMessageSquare size={14} /> Message
        </Link>
        {booking.status === 'confirmed' && onComplete && (
          <button onClick={() => onComplete(booking.id)} className="btn-secondary text-sm py-1.5">Mark Complete</button>
        )}
        {['pending', 'confirmed'].includes(booking.status) && onCancel && (
          <button onClick={() => onCancel(booking.id)} className="btn-danger text-sm py-1.5">Cancel</button>
        )}
      </div>
    </div>
  );
}
