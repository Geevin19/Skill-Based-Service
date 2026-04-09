import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { formatCurrency, getInitials } from '../utils/helpers';
import { FiMapPin, FiClock } from 'react-icons/fi';

export default function MentorCard({ mentor }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {mentor.avatar_url ? (
            <img src={mentor.avatar_url} alt={mentor.name} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
              {getInitials(mentor.name)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{mentor.name}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <StarRating rating={mentor.avg_rating} size={13} />
            <span className="text-xs text-gray-500">({mentor.total_reviews})</span>
          </div>
          {mentor.location && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <FiMapPin size={11} /> {mentor.location}
            </div>
          )}
        </div>
        {mentor.hourly_rate && (
          <div className="text-right">
            <span className="text-blue-600 font-semibold">{formatCurrency(mentor.hourly_rate)}</span>
            <span className="text-xs text-gray-400">/hr</span>
          </div>
        )}
      </div>

      {mentor.bio && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{mentor.bio}</p>
      )}

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

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <FiClock size={12} /> {mentor.total_sessions} sessions
        </div>
        <Link to={`/mentors/${mentor.id}`} className="btn-primary text-sm py-1.5 px-4">
          View Profile
        </Link>
      </div>
    </div>
  );
}
