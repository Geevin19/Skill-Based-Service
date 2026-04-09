import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Reset Password</h1>
          <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send a reset link.</p>
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📧</div>
              <p className="text-gray-700">Check your inbox for the reset link.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" className="input" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
          <p className="text-center text-sm text-gray-500 mt-4">
            <Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
