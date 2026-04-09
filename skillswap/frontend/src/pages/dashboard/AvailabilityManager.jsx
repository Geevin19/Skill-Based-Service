import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiClock } from 'react-icons/fi';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityManager({ mentorId, preSelectedSession, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(preSelectedSession || null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    api.get(`/sessions?mentor_id=${mentorId}`).then(res => {
      setSessions(res.data || []);
    });
  }, [mentorId]);

  // Load slots when session is selected
  useEffect(() => {
    if (!selectedSession) return;
    setLoadingSlots(true);
    api.get(`/users/${mentorId}/availability?session_id=${selectedSession.id}`)
      .then(res => {
        setSlots(res.data.length > 0
          ? res.data
          : [{ day_of_week: 1, start_time: '09:00', end_time: '10:00' }]
        );
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedSession]);

  const addSlot = () => setSlots(prev => [...prev, { day_of_week: 1, start_time: '09:00', end_time: '10:00' }]);
  const removeSlot = (i) => setSlots(prev => prev.filter((_, idx) => idx !== i));
  const updateSlot = (i, key, val) => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s));

  const handleSave = async () => {
    if (!selectedSession) { toast.error('Select a session first'); return; }
    setLoading(true);
    try {
      await api.put('/users/availability', { slots, session_id: selectedSession.id });
      toast.success(`Availability saved for "${selectedSession.title}"!`);
    } catch {
      toast.error('Failed to save availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">Set Availability</h2>
          <p className="text-sm text-gray-500 mt-0.5">Set time slots per session — learners will only see slots for the session they apply to</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Pick Session */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              1. Select Session
            </label>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3 bg-gray-50 rounded-xl">
                No sessions yet. Create a session first.
              </p>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => (
                  <button key={s.id} type="button"
                    onClick={() => setSelectedSession(s)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all
                      ${selectedSession?.id === s.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <FiClock size={11} /> {s.duration_minutes} min · {s.session_type}
                        </p>
                      </div>
                      {selectedSession?.id === s.id && (
                        <span className="text-xs text-blue-600 font-medium">✓ Selected</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Set Slots */}
          {selectedSession && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                2. Time Slots for <span className="text-blue-600">"{selectedSession.title}"</span>
              </label>

              {loadingSlots ? (
                <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {slots.map((slot, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                      <select className="input text-sm flex-1"
                        value={slot.day_of_week}
                        onChange={e => updateSlot(i, 'day_of_week', parseInt(e.target.value))}>
                        {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                      </select>
                      <input type="time" className="input text-sm w-28"
                        value={slot.start_time}
                        onChange={e => updateSlot(i, 'start_time', e.target.value)} />
                      <span className="text-gray-400 text-sm flex-shrink-0">to</span>
                      <input type="time" className="input text-sm w-28"
                        value={slot.end_time}
                        onChange={e => updateSlot(i, 'end_time', e.target.value)} />
                      <button onClick={() => removeSlot(i)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0">
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  ))}

                  <button onClick={addSlot}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors">
                    <FiPlus size={15} /> Add Time Slot
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">Close</button>
            <button onClick={handleSave} disabled={loading || !selectedSession}
              className="btn-primary flex-1">
              {loading ? 'Saving...' : 'Save Availability'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
