import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const SKILL_OPTIONS = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Design', 'Data Science', 'DevOps', 'Marketing', 'AWS', 'Docker', 'SQL'];

export default function ProfileEdit() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: '', bio: '', location: '', timezone: '',
    skills: [], experience_years: 0, hourly_rate: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      setForm({
        name: user.profile.name || '',
        bio: user.profile.bio || '',
        location: user.profile.location || '',
        timezone: user.profile.timezone || '',
        skills: user.profile.skills || [],
        experience_years: user.profile.experience_years || 0,
        hourly_rate: user.profile.hourly_rate || '',
      });
    }
  }, [user]);

  const toggleSkill = (skill) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach(item => data.append(k, item));
        else data.append(k, v);
      });
      if (avatar) data.append('avatar', avatar);

      const res = await api.put('/users/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ profile: res.data });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (role) => {
    try {
      await api.put('/users/switch-role', { role });
      updateUser({ role });
      toast.success(`Switched to ${role}`);
    } catch { toast.error('Failed to switch role'); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Current Role</h2>
          <div className="flex gap-3">
            {['learner', 'mentor'].map(role => (
              <button key={role} onClick={() => switchRole(role)}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium capitalize transition-colors
                  ${user?.role === role ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600'}`}>
                {role === 'learner' ? '📚 Learner' : '🎓 Mentor'}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {avatar ? (
                  <img src={URL.createObjectURL(avatar)} className="w-full h-full object-cover" alt="preview" />
                ) : user?.profile?.avatar_url ? (
                  <img src={user.profile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  <span className="text-blue-600 font-bold text-xl">{form.name?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <label className="btn-secondary text-sm cursor-pointer">
                Change Photo
                <input type="file" accept="image/*" className="hidden" onChange={e => setAvatar(e.target.files[0])} />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea className="input resize-none" rows={4} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                <input type="number" className="input" value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                <input type="number" className="input" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} min={0} step="0.01" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map(skill => (
                  <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors
                      ${form.skills.includes(skill) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
