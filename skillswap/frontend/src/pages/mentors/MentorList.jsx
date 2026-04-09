import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import MentorCard from '../../components/MentorCard';
import api from '../../utils/api';
import { FiSearch, FiFilter } from 'react-icons/fi';

const SKILLS = ['JavaScript', 'Python', 'React', 'Node.js', 'Design', 'Data Science', 'DevOps', 'Marketing'];

export default function MentorList() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', skill: '', min_rating: '', max_price: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const res = await api.get(`/users/mentors?${params}`);
      setMentors(res.data.mentors);
      setTotalPages(res.data.pages);
    } catch {
      setMentors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMentors(); }, [page, filters]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Find a Mentor</h1>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input className="input pl-9" placeholder="Search mentors..."
                value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <select className="input" value={filters.skill} onChange={e => setFilters({ ...filters, skill: e.target.value })}>
              <option value="">All Skills</option>
              {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input" value={filters.min_rating} onChange={e => setFilters({ ...filters, min_rating: e.target.value })}>
              <option value="">Any Rating</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
            <input type="number" className="input" placeholder="Max price/hr"
              value={filters.max_price} onChange={e => setFilters({ ...filters, max_price: e.target.value })} />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="card animate-pulse h-48 bg-gray-100" />
            ))}
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No mentors found. Try adjusting your filters.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map(m => <MentorCard key={m.id} mentor={m} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium ${p === page ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
