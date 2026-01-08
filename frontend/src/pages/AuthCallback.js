import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Check for session_id in hash (old emergent.ai way)
      if (location.hash?.includes('session_id=')) {
        const params = new URLSearchParams(location.hash.substring(1));
        const sessionId = params.get('session_id');
        
        if (sessionId) {
          try {
            // Process session with backend
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ session_id: sessionId })
            });
            
            if (response.ok) {
              const userData = await response.json();
              await checkAuth();
              navigate('/dashboard', { replace: true, state: { user: userData } });
              return;
            }
          } catch (error) {
            console.error('Session processing error:', error);
          }
        }
      }
      
      // Check for token in query params (new way with your backend)
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const error = params.get('error');

      if (error) {
        console.error('Authentication error:', error);
        navigate('/login?error=' + error);
        return;
      }

      if (token) {
        localStorage.setItem('token', token);
        await checkAuth();
        navigate('/dashboard', { replace: true });
        return;
      }

      // No valid auth found
      navigate('/login?error=no_auth_data');
    };

    handleCallback();
  }, [location, navigate, checkAuth]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}

export default AuthCallback;
