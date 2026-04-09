import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';
import { formatCurrency, getInitials } from '../utils/helpers';
import { FiMapPin, FiClock, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import QuickApplyModal from './QuickApplyModal';
import MentorProfileModal from './MentorProfileModal';

export default function MentorCard({ mentor }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showApply, setShowApply] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const mentorId = mentor.user_id || mentor.id;

  const handleApply = () => {
    if (!user) { navigate('/login'); return; }
    setShowApply(true);
  };

  return (
    <>
      <div className="card hover:shadow-md transition-shadow flex flex-col">
        {/* Top: Avatar + Name + Rating */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {mentor.avatar_url ? (
              <img src={mentor.avatar_url} alt={mentor.name}
                className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                {getInitials(mentor.name)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{mentor.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <StarRating rating={parseFloat(mentor.avg_rating) || 0} size={13} />
              <span className="text-xs text-gray-500">({mentor.total_reviews || 0})</span>
            </div>
            {mentor.location && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <FiMapPin size={11} /> {mentor.location}
              </div>
            )}
          </div>
          {mentor.hourly_rate && (
            <div className="text-right flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">{formatCurrency(mentor.hourly_rate)}</span>
              <span className="text-xs text-gray-400">/hr</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {mentor.bio && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-2">{mentor.bio}</p>
        )}

        {/* Skills */}
        {mentor.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {mentor.skills.slice(0, 4).map(skill => (
              <span key={skill} className="badge bg-blue-50 text-blue-700">{skill}</span>
            ))}
            {mentor.skills.length > 4 && (
              <span className="badge bg-gray-100 text-gray-500">+{mentor.skills.length - 4}</span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><FiClock size={11} /> {mentor.total_sessions || 0} sessions</span>
          {mentor.experience_years > 0 && (
            <span className="flex items-center gap-1"><FiUser size={11} /> {mentor.experience_years}y exp</span>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setShowProfile(true)}
            className="btn-secondary text-sm py-2 flex-1">
            View Profile
          </button>
          <button onClick={handleApply}
            className="btn-primary text-sm py-2 flex-1">
            Apply Session
          </button>
        </div>
      </div>

      {showProfile && (
        <MentorProfileModal
          mentorId={mentorId}
          onClose={() => setShowProfile(false)}
          onApply={(session, mentor) => {
            setShowProfile(false);
            setShowApply(true);
          }}
        />
      )}

      {showApply && (
        <QuickApplyModal
          mentor={mentor}
          onClose={() => setShowApply(false)}
        />
      )}
    </>
  );
}
