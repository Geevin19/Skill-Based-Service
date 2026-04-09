import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import StarRating from '../../components/StarRating';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getInitials } from '../../utils/helpers';
import { FiMapPin, FiClock, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MentorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/sessions?mentor_id=${id}`),
      api.get(`/reviews/mentor/${id}`),
    ]).then(([m, s, r]) => {
      setMentor(m.data);
      setSessions(s.data);
      setReviews(r.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (!mentor) return <div className="text-center py-20">Mentor not found</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Profile */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card text-center">
              {mentor.avatar_url ? (
                <img src={mentor.avatar_url} alt={mentor.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-4" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl mx-auto mb-4">
                  {getInitials(mentor.name)}
                </div>
              )}
              <h1 className="text-xl font-bold text-gray-900">{mentor.name}</h1>
              <div className="flex items-center justify-center gap-1 mt-1">
                <StarRating rating={mentor.avg_rating} size={15} />
                <span className="text-sm text-gray-500">({mentor.total_reviews} reviews)</span>
              </div>
              {mentor.location && (
                <div className="flex items-center justify-center gap-1 mt-2 text-sm text-gray-500">
                  <FiMapPin size={13} /> {mentor.location}
                </div>
              )}
              {mentor.hourly_rate && (
                <div className="mt-3 text-2xl font-bold text-blue-600">
                  {formatCurrency(mentor.hourly_rate)}<span className="text-sm text-gray-400 font-normal">/hr</span>
                </div>
              )}
              {user && user.id !== id && (
                <Link to={`/chat/${id}`} className="btn-secondary w-full mt-4 flex items-center justify-center gap-2">
                  <FiMessageSquare size={15} /> Message
                </Link>
              )}
            </div>

            {mentor.skills?.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {mentor.skills.map(s => (
                    <span key={s} className="badge bg-blue-50 text-blue-700">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {mentor.experience_years > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 text-gray-700">
                  <FiClock size={16} />
                  <span className="text-sm">{mentor.experience_years} years experience</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Sessions + Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {mentor.bio && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-2">About</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{mentor.bio}</p>
              </div>
            )}

            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Sessions</h2>
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-sm">No sessions available yet.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => (
                    <div key={s.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{s.title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">{s.duration_minutes} min · {s.session_type}</p>
                          {s.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{s.description}</p>}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-blue-600">{formatCurrency(s.price)}</div>
                          <Link to={`/sessions/${s.id}`} className="btn-primary text-xs py-1 px-3 mt-2 inline-block">Book</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Reviews ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-sm">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
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
                      {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
