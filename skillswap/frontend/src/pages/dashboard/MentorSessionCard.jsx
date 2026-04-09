import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';
import { FiClock, FiChevronDown, FiChevronUp, FiCalendar, FiEdit } from 'react-icons/fi';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function MentorSessionCard({ session, onSetAvailability }) {
  const [expanded, setExpanded] = useState(false);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const loadSlots = () => {
    if (slots.length > 0) return;
    setLoadingSlots(true);
    api.get(`/users/${session.mentor_id}/availability?session_id=${session.id}`)
      .then(r => setSlots(r.data || []))
      .finally(() => setLoadingSlots(false));
  };

  const handleExpand = () => {
    setExpanded(prev => !prev);
    if (!expanded) loadSlots();
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-200 transition-colors">
      {/* Session Header - clickable */}
      <button onClick={handleExpand} className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{session.title}</h3>
            <span className={`badge text-xs ${session.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {session.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><FiClock size={12} /> {session.duration_minutes} min</span>
            <span className="font-medium text-blue-600">{formatCurrency(session.price)}</span>
            <span className="capitalize">{session.session_type}</span>
            {session.category && <span className="badge bg-purple-50 text-purple-700 text-xs">{session.category}</span>}
          </div>
          {session.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{session.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onSetAvailability(session); }}
            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
            <FiCalendar size={12} /> Set Slots
          </button>
          {expanded ? <FiChevronUp size={16} className="text-gray-400" /> : <FiChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded: Show Slots */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
            <FiCalendar size={12} /> Available Time Slots
          </p>
          {loadingSlots ? (
            <p className="text-xs text-gray-400">Loading slots...</p>
          ) : slots.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-xs text-gray-400 mb-2">No slots set for this session yet.</p>
              <button
                onClick={() => onSetAvailability(session)}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                + Add Time Slots
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot, i) => (
                <div key={i} className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                  <span className="font-medium">{DAYS[slot.day_of_week]}</span>
                  <span className="text-gray-500 ml-1">{slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}</span>
                </div>
              ))}
              <button
                onClick={() => onSetAvailability(session)}
                className="border border-dashed border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center gap-1">
                <FiEdit size={11} /> Edit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
