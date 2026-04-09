import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
    });

    socketRef.current.on('user_online', ({ userId }) =>
      setOnlineUsers(prev => new Set([...prev, userId]))
    );
    socketRef.current.on('user_offline', ({ userId }) =>
      setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s; })
    );

    return () => socketRef.current?.disconnect();
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
