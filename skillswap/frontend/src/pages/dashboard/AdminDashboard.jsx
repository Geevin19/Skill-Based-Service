import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data));
    api.get('/admin/users').then(res => setUsers(res.data));
    api.get('/admin/reports').then(res => setReports(res.data));
  }, []);

  const toggleUser = async (id, is_active) => {
    await api.put(`/admin/users/${id}`, { is_active: !is_active });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !is_active } : u));
    toast.success('User updated');
  };

  const approveMentor = async (id, approved) => {
    await api.put(`/admin/users/${id}/approve-mentor`, { approved });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_mentor_approved: approved } : u));
    toast.success(approved ? 'Mentor approved' : 'Mentor rejected');
  };

  const resolveReport = async (id, status) => {
    await api.put(`/admin/reports/${id}`, { status });
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success('Report updated');
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              ['Users', stats.total_users],
              ['Sessions', stats.total_sessions],
              ['Bookings', stats.total_bookings],
              ['Revenue', formatCurrency(stats.total_revenue || 0)],
              ['Open Reports', stats.open_reports],
            ].map(([label, val]) => (
              <div key={label} className="card text-center">
                <div className="text-xl font-bold text-blue-600">{val}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {['overview', 'users', 'reports'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors
                ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div>
            <input className="input mb-4 max-w-sm" placeholder="Search users..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Name', 'Email', 'Role', 'Status', 'Mentor', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{u.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-blue-50 text-blue-700 capitalize">{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.role === 'mentor' && (
                          <span className={`badge ${u.is_mentor_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {u.is_mentor_approved ? 'Approved' : 'Pending'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => toggleUser(u.id, u.is_active)}
                            className={`text-xs px-2 py-1 rounded ${u.is_active ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {u.is_active ? 'Suspend' : 'Activate'}
                          </button>
                          {u.role === 'mentor' && !u.is_mentor_approved && (
                            <button onClick={() => approveMentor(u.id, true)}
                              className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-600">
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{r.reason}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {r.reporter_name} reported {r.reported_name} · {formatDate(r.created_at)}
                    </p>
                    {r.description && <p className="text-sm text-gray-600 mt-1">{r.description}</p>}
                  </div>
                  <span className={`badge ${r.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {r.status}
                  </span>
                </div>
                {r.status === 'open' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => resolveReport(r.id, 'resolved')} className="btn-primary text-xs py-1 px-3">Resolve</button>
                    <button onClick={() => resolveReport(r.id, 'dismissed')} className="btn-secondary text-xs py-1 px-3">Dismiss</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
