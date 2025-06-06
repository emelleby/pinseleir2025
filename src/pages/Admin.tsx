
import React, { useState, useEffect } from 'react';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import { isAdminLoggedIn, getAdminSessionId, clearAdminSession } from '@/utils/adminAuth';

const Admin = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in with valid session
    if (isAdminLoggedIn()) {
      const storedSessionId = getAdminSessionId();
      setSessionId(storedSessionId);
    }
  }, []);

  const handleLogin = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  const handleLogout = () => {
    clearAdminSession();
    setSessionId(null);
  };

  if (sessionId) {
    return <AdminDashboard onLogout={handleLogout} sessionId={sessionId} />;
  }

  return <AdminLogin onLogin={handleLogin} />;
};

export default Admin;
