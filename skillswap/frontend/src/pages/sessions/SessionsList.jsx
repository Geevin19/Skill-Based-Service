import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';
import { FiSearch, FiClock, FiUser } from 'react-icons/fi';
import StarRating from '../../components/StarRating';
import { useAuth } from '../../context/AuthContext';
import BookSessionModal from '../mentors/BookSessionModal';
import MentorProfileModal from '../../components/MentorProfileModal';

export default function SessionsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingSession, setBookingSession] = useState(null);
  const [bookingMentor, setBookingMentor] = useState(null);
  const [profileMentorId, setProfileMentorId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mentorFilter, setMentorFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    api.get('/sessions').then(res => {
      setSessions(res.data);
      setFiltered(res.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = sessions;

    if (search) {
      result = result.filter(s =>
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase()) ||
        s.category?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (mentorFilter) {
      result = result.filter(s =>
        s.mentor_name?.toLowerCase().includes(mentorFilter.toLowerCase())
      );
    }

    if (categoryFilter) {
      result = result.filter(s =>
        s.category?.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    if (typeFilter) {
      result = result.filter(s => s.session_type === typeFilter);
    }

    setFiltered(result);
  }, [search, mentorFilter, categoryFilter, typeFilter, sessions]);

  const clearFilters = () => {
    setSearch('');
    setMentorFilter('');
    setCategoryFilter('');
    setTypeFilter('');
  };

  const hasFilters = search || mentorFilter || categoryFilter || typeFilter;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Browse Sessions</h1>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} sessions available</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input className="input pl-9" placeholder="Search sessions..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input className="input pl-9" placeholder="Filter by mentor name..."
                value={mentorFilter} onChange={e => setMentorFilter(e.target.value)} />
            </div>
            <input className="input" placeholder="Filter by category..."
              value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} />
            <select className="input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="1-on-1">1-on-1</option>
              <option value="group">Group</option>
            </select>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-sm text-blue-600 hover:underline">
              Clear all filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="card animate-pulse h-48 bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">No sessions found.</p>
            {hasFilters && <button onClick={clearFilters} className="mt-3 text-blue-600 hover:underline text-sm">Clear filters</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(s => (
              <div key={s.id} className="card hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{s.title}</h3>
                    {s.category && (
                      <span className="badge bg-blue-50 text-blue-700 mt-1">{s.category}</span>
                    )}
                  </div>
                  <span className="text-blue-600 font-bold text-lg ml-2">{formatCurrency(s.price)}</span>
                </div>

                {s.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{s.description}</p>
                )}

                <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><FiClock size={13} /> {s.duration_minutes} min</span>
                  <span className="badge bg-gray-100 text-gray-600 capitalize">{s.session_type}</span>
                </div>

                {/* Mentor info */}
                <div className="flex items-center gap-2 py-3 border-t border-gray-100 mt-auto">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs flex-shrink-0">
                    {s.mentor_name?.[0]?.toUpperCase() || 'M'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.mentor_name || 'Mentor'}</p>
                    {s.avg_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <StarRating rating={s.avg_rating} size={11} />
                        <span className="text-xs text-gray-400">{s.avg_rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setProfileMentorId(s.mentor_id)}
                      className="btn-secondary text-xs py-1.5 px-3">
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        if (!user) { navigate('/login'); return; }
                        setBookingSession(s);
                        setBookingMentor({ user_id: s.mentor_id, name: s.mentor_name, avg_rating: s.avg_rating });
                      }}
                      className="btn-primary text-xs py-1.5 px-3">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />

      {bookingSession && bookingMentor && (
        <BookSessionModal
          session={bookingSession}
          mentor={bookingMentor}
          onClose={() => { setBookingSession(null); setBookingMentor(null); }}
          onBooked={() => { setBookingSession(null); setBookingMentor(null); navigate('/bookings'); }}
        />
      )}

      {profileMentorId && (
        <MentorProfileModal
          mentorId={profileMentorId}
          onClose={() => setProfileMentorId(null)}
          onApply={(session, mentor) => {
            setBookingSession(session);
            setBookingMentor(mentor);
          }}
        />
      )}
    </div>
  );
}
