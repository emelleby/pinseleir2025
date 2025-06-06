
import React, { useState, useEffect } from 'react';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';

const Admin = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedSessionId = localStorage.getItem('admin_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }
  }, []);

  const handleLogin = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  const handleLogout = () => {
    setSessionId(null);
  };

  if (sessionId) {
    return <AdminDashboard onLogout={handleLogout} sessionId={sessionId} />;
  }

  return <AdminLogin onLogin={handleLogin} />;
};

export default Admin;
