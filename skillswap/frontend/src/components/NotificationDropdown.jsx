import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';

export default function NotificationDropdown({ onClose }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get('/notifications').then(res => setNotifications(res.data));
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="font-semibold text-gray-900">Notifications</span>
        <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-gray-500 py-6 text-sm">No notifications</p>
        ) : notifications.map(n => (
          <div key={n.id} className={`px-4 py-3 border-b last:border-0 ${!n.is_read ? 'bg-blue-50' : ''}`}>
            <p className="text-sm font-medium text-gray-900">{n.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
            <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
