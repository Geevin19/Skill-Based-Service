import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import StarRating from '../../components/StarRating';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getInitials } from '../../utils/helpers';
import { FiMapPin, FiClock, FiMessageSquare, FiCalendar, FiUsers } from 'react-icons/fi';
import BookSessionModal from './BookSessionModal';

export default function MentorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingSession, setBookingSession] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/sessions?mentor_id=${id}`),
      api.get(`/reviews/mentor/${id}`),
    ]).then(([m, s, r]) => {
      // Ensure user_id is always set to the URL param id
      const mentorData = { ...m.data, user_id: id };
      setMentor(mentorData);
      setSessions(s.data);
      setReviews(r.data);
    }).catch(() => setMentor(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (!mentor) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mentor not found</h2>
          <Link to="/mentors" className="btn-primary">Browse Mentors</Link>
        </div>
      </div>
    </div>
  );

  // Use user_id as the mentor's actual user ID
  const mentorUserId = mentor.user_id || mentor.id;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Profile Card */}
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
              <p className="text-sm text-gray-500 mt-0.5">{mentor.email}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <StarRating rating={parseFloat(mentor.avg_rating) || 0} size={15} />
                <span className="text-sm text-gray-500">({mentor.total_reviews} reviews)</span>
              </div>
              {mentor.location && (
                <div className="flex items-center justify-center gap-1 mt-2 text-sm text-gray-500">
                  <FiMapPin size={13} /> {mentor.location}
                </div>
              )}
              {mentor.hourly_rate && (
                <div className="mt-3 text-2xl font-bold text-blue-600">
                  {formatCurrency(mentor.hourly_rate)}
                  <span className="text-sm text-gray-400 font-normal">/hr</span>
                </div>
              )}
              {user && user.id !== mentorUserId && (
                <Link to={`/chat/${mentorUserId}`}
                  className="btn-secondary w-full mt-4 flex items-center justify-center gap-2">
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

          {/* Right: About + Sessions + Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {mentor.bio && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-2">About</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{mentor.bio}</p>
              </div>
            )}

            {/* Sessions */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Available Sessions</h2>
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-sm">No sessions available yet.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => (
                    <div key={s.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{s.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><FiClock size={12} /> {s.duration_minutes} min</span>
                            <span className="flex items-center gap-1">
                              <FiUsers size={12} />
                              <span className="capitalize">{s.session_type}</span>
                            </span>
                            {s.category && <span className="badge bg-gray-100 text-gray-600">{s.category}</span>}
                          </div>
                          {s.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{s.description}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-blue-600 text-lg">{formatCurrency(s.price)}</div>
                          <button
                            onClick={() => {
                              if (!user) { navigate('/login'); return; }
                              setBookingSession(s);
                            }}
                            className="btn-primary text-sm py-1.5 px-4 mt-2">
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
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
                      {r.comment && <p className="text-sm text-gray-600 ml-11">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {bookingSession && (
        <BookSessionModal
          session={bookingSession}
          mentor={mentor}
          onClose={() => setBookingSession(null)}
          onBooked={() => { setBookingSession(null); navigate('/bookings'); }}
        />
      )}

      <Footer />
    </div>
  );
}
