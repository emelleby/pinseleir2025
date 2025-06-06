/**
 * Simple admin authentication utilities
 * Uses localStorage for session management (suitable for low-security admin panels)
 */

export interface AdminSessionData {
  sessionId: string;
  expiresAt: number;
  createdAt: number;
}

/**
 * Check if there's a valid admin session
 */
export function isAdminLoggedIn(): boolean {
  try {
    const sessionData = localStorage.getItem('admin_session_data');
    if (!sessionData) {
      return false;
    }

    const parsed: AdminSessionData = JSON.parse(sessionData);
    
    // Check if session has expired
    if (Date.now() > parsed.expiresAt) {
      // Clean up expired session
      clearAdminSession();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking admin session:', error);
    clearAdminSession();
    return false;
  }
}

/**
 * Get the current admin session ID if valid
 */
export function getAdminSessionId(): string | null {
  if (!isAdminLoggedIn()) {
    return null;
  }

  try {
    const sessionData = localStorage.getItem('admin_session_data');
    if (!sessionData) {
      return null;
    }

    const parsed: AdminSessionData = JSON.parse(sessionData);
    return parsed.sessionId;
  } catch (error) {
    console.error('Error getting admin session ID:', error);
    return null;
  }
}

/**
 * Clear the admin session
 */
export function clearAdminSession(): void {
  localStorage.removeItem('admin_session_data');
  localStorage.removeItem('admin_session_id'); // Legacy cleanup
}

/**
 * Get session expiration time
 */
export function getSessionExpirationTime(): Date | null {
  try {
    const sessionData = localStorage.getItem('admin_session_data');
    if (!sessionData) {
      return null;
    }

    const parsed: AdminSessionData = JSON.parse(sessionData);
    return new Date(parsed.expiresAt);
  } catch (error) {
    console.error('Error getting session expiration:', error);
    return null;
  }
}
