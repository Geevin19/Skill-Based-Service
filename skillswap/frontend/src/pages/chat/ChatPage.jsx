import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getInitials, formatDate } from '../../utils/helpers';
import { FiSend, FiPaperclip } from 'react-icons/fi';

export default function ChatPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeUser, setActiveUser] = useState(userId || null);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.get('/chat/conversations').then(res => setConversations(res.data));
  }, []);

  useEffect(() => {
    if (!activeUser) return;
    api.get(`/chat/${activeUser}`).then(res => setMessages(res.data));
  }, [activeUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_message', (msg) => {
      if (msg.sender_id === activeUser || msg.receiver_id === activeUser) {
        setMessages(prev => [...prev, msg]);
      }
    });
    socket.on('user_typing', ({ userId: uid }) => {
      if (uid === activeUser) { setTyping(true); setTimeout(() => setTyping(false), 2000); }
    });
    return () => { socket.off('new_message'); socket.off('user_typing'); };
  }, [socket, activeUser]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;

    if (file) {
      const fd = new FormData();
      fd.append('receiver_id', activeUser);
      fd.append('content', text);
      fd.append('file', file);
      const res = await api.post('/chat', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessages(prev => [...prev, res.data]);
      setFile(null);
    } else {
      socket?.emit('send_message', { receiver_id: activeUser, content: text });
    }
    setText('');
  };

  const handleTyping = () => socket?.emit('typing', { receiver_id: activeUser });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-5xl mx-auto w-full px-4 py-4 gap-4 h-[calc(100vh-64px)]">
        {/* Conversations */}
        <div className="w-72 bg-white rounded-xl border border-gray-100 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Messages</h2>
          </div>
          {conversations.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No conversations yet</p>
          ) : conversations.map(c => (
            <button key={c.other_user} onClick={() => setActiveUser(c.other_user)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left
                ${activeUser === c.other_user ? 'bg-blue-50' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm flex-shrink-0">
                {c.avatar_url ? <img src={c.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" /> : getInitials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{c.name}</p>
                <p className="text-xs text-gray-400 truncate">{c.last_message}</p>
              </div>
              {c.unread_count > 0 && (
                <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">{c.unread_count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 flex flex-col">
          {!activeUser ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">Select a conversation</div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm
                      ${m.sender_id === user?.id ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                      {m.content && <p>{m.content}</p>}
                      {m.file_url && (
                        <a href={m.file_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 mt-1 underline text-xs">
                          <FiPaperclip size={12} /> {m.file_name || 'Attachment'}
                        </a>
                      )}
                      <p className={`text-xs mt-1 ${m.sender_id === user?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm text-gray-500">typing...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t flex items-center gap-2">
                <label className="cursor-pointer text-gray-400 hover:text-blue-600">
                  <FiPaperclip size={18} />
                  <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
                </label>
                {file && <span className="text-xs text-blue-600 truncate max-w-24">{file.name}</span>}
                <input className="input flex-1" placeholder="Type a message..."
                  value={text} onChange={e => { setText(e.target.value); handleTyping(); }} />
                <button type="submit" className="btn-primary p-2.5">
                  <FiSend size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
