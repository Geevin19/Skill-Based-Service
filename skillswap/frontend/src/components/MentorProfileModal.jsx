import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, getInitials, formatDate } from '../utils/helpers';
import StarRating from './StarRating';
import { FiX, FiMapPin, FiClock, FiUser, FiMessageSquare, FiExternalLink } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function MentorProfileModal({ mentorId, onClose, onApply }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('about');

  useEffect(() => {
    Promise.all([
      api.get(`/users/${mentorId}`),
      api.get(`/sessions?mentor_id=${mentorId}`),
      api.get(`/reviews/mentor/${mentorId}`),
    ]).then(([m, s, r]) => {
      setMentor({ ...m.data, user_id: mentorId });
      setSessions(s.data || []);
      setReviews(r.data || []);
    }).finally(() => setLoading(false));
  }, [mentorId]);

  if (loading) return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
      </div>
    </div>
  );

  if (!mentor) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">Mentor Profile</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/mentors/${mentorId}`)}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <FiExternalLink size={12} /> Full Page
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Profile Hero */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-violet-50 border-b">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-2xl flex-shrink-0 overflow-hidden">
              {mentor.avatar_url
                ? <img src={mentor.avatar_url} className="w-full h-full object-cover" alt="" />
                : getInitials(mentor.name)}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{mentor.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                <StarRating rating={parseFloat(mentor.avg_rating) || 0} size={14} />
                <span className="text-sm text-gray-500">({mentor.total_reviews || 0} reviews)</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                {mentor.location && (
                  <span className="flex items-center gap-1"><FiMapPin size={12} /> {mentor.location}</span>
                )}
                {mentor.experience_years > 0 && (
                  <span className="flex items-center gap-1"><FiUser size={12} /> {mentor.experience_years}y exp</span>
                )}
                {mentor.total_sessions > 0 && (
                  <span className="flex items-center gap-1"><FiClock size={12} /> {mentor.total_sessions} sessions</span>
                )}
              </div>
              {mentor.hourly_rate && (
                <p className="text-lg font-bold text-blue-600 mt-2">{formatCurrency(mentor.hourly_rate)}/hr</p>
              )}
            </div>
          </div>

          {/* Skills */}
          {mentor.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {mentor.skills.map(s => (
                <span key={s} className="badge bg-white text-blue-700 border border-blue-200">{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 mx-6 mt-4 rounded-xl w-fit">
          {['about', 'sessions', 'reviews'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors
                ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t} {t === 'sessions' ? `(${sessions.length})` : t === 'reviews' ? `(${reviews.length})` : ''}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* About Tab */}
          {tab === 'about' && (
            <div className="space-y-4">
              {mentor.bio ? (
                <p className="text-gray-600 leading-relaxed">{mentor.bio}</p>
              ) : (
                <p className="text-gray-400 text-sm">No bio added yet.</p>
              )}
            </div>
          )}

          {/* Sessions Tab */}
          {tab === 'sessions' && (
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No sessions available.</p>
              ) : sessions.map(s => (
                <div key={s.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{s.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><FiClock size={11} /> {s.duration_minutes} min</span>
                        <span className="capitalize badge bg-gray-100 text-gray-600">{s.session_type}</span>
                        {s.category && <span className="badge bg-purple-50 text-purple-700">{s.category}</span>}
                      </div>
                      {s.description && <p className="text-xs text-gray-500 mt-1">{s.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-blue-600">{formatCurrency(s.price)}</p>
                      <button
                        onClick={() => { onClose(); onApply?.(s, mentor); }}
                        className="btn-primary text-xs py-1.5 px-3 mt-1">
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reviews Tab */}
          {tab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No reviews yet.</p>
              ) : reviews.map(r => (
                <div key={r.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                      {getInitials(r.reviewer_name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.reviewer_name}</p>
                      <div className="flex items-center gap-1">
                        <StarRating rating={r.rating} size={12} />
                        <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 ml-11">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {user && user.id !== mentorId && (
            <button
              onClick={() => { onClose(); navigate(`/chat/${mentorId}`); }}
              className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <FiMessageSquare size={15} /> Message
            </button>
          )}
          {sessions.length > 0 && (
            <button
              onClick={() => setTab('sessions')}
              className="btn-primary flex-1">
              View Sessions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
