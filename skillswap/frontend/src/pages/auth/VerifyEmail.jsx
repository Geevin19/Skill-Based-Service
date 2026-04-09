import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../utils/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        {status === 'verifying' && <p className="text-gray-600">Verifying your email...</p>}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-500 mb-6">Your account is now active.</p>
            <Link to="/login" className="btn-primary">Go to Login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-500 mb-6">The link is invalid or expired.</p>
            <Link to="/login" className="btn-secondary">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
