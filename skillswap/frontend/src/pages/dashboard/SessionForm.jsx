import { useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function SessionForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', category: '', session_type: '1-on-1',
    duration_minutes: 60, price: '', max_participants: 1,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/sessions', form);
      toast.success('Session created!');
      onCreated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Create Session</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input className="input" value={form.category} onChange={e => set('category', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="input" value={form.session_type} onChange={e => set('session_type', e.target.value)}>
                <option value="1-on-1">1-on-1</option>
                <option value="group">Group</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input type="number" className="input" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} min={15} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input type="number" className="input" value={form.price} onChange={e => set('price', e.target.value)} min={0} step="0.01" required />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
