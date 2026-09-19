import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PatientView from './components/PatientView';
import DoctorView from './components/DoctorView';
import AdminView from './components/AdminView';
import AuthModal from './components/AuthModal';
import { api } from './api';
import { Stethoscope, Shield, Users, CheckCircle, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }
  const [initialLoading, setInitialLoading] = useState(true);

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Check current session or default to patient demo
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.auth.getProfile();
          setUser(res.user);
          loadNotifications();
          setInitialLoading(false);
          return;
        } catch (err) {
          localStorage.removeItem('token');
        }
      }

      // Default quick-login as Patient Alice for seamless out-of-the-box demo
      try {
        const loginRes = await api.auth.login({
          email: 'alice@example.com',
          password: 'patient123'
        });
        localStorage.setItem('token', loginRes.token);
        setUser(loginRes.user);
        loadNotifications();
      } catch (e) {
        console.error('Default demo login failed:', e);
      } finally {
        setInitialLoading(false);
      }
    };

    initAuth();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.notifications.getMy();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleLogin = async (credentials) => {
    const res = await api.auth.login(credentials);
    localStorage.setItem('token', res.token);
    setUser(res.user);
    loadNotifications();
    showToast(`Welcome back, ${res.user.profile?.name || res.user.email}!`, 'success');
  };

  const handleRegister = async (userData) => {
    const res = await api.auth.register(userData);
    localStorage.setItem('token', res.token);
    setUser(res.user);
    loadNotifications();
    showToast(`Registration successful. Welcome ${res.user.name}!`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    showToast('Signed out successfully', 'success');
  };

  const handleQuickLogin = async (email, password) => {
    try {
      await handleLogin({ email, password });
    } catch (err) {
      showToast('Quick login failed: ' + err.message, 'error');
    }
  };

  const handleMarkNotifRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshReminders = async () => {
    try {
      const res = await api.notifications.checkReminders();
      showToast(res.message || 'Reminders checked', 'success');
      loadNotifications();
    } catch (err) {
      showToast('Failed to check reminders: ' + err.message, 'error');
    }
  };

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0d9488' }}>CarePulse Medical</div>
          <div style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '6px' }}>Initializing application...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkNotifRead={handleMarkNotifRead}
        onRefreshReminders={handleRefreshReminders}
        onQuickLogin={handleQuickLogin}
      />

      {/* Main View Body */}
      <main className="main-content">
        {user ? (
          <>
            {user.role === 'patient' && <PatientView user={user} onShowToast={showToast} />}
            {user.role === 'doctor' && <DoctorView user={user} onShowToast={showToast} />}
            {user.role === 'admin' && <AdminView onShowToast={showToast} />}
          </>
        ) : (
          <div className="card" style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '40px 24px' }}>
            <div className="brand-icon" style={{ margin: '0 auto 16px', width: '56px', height: '56px' }}>
              <Stethoscope size={30} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              CarePulse Doctor Appointment Booking
            </h1>
            <p style={{ color: '#64748b', margin: '12px 0 28px', lineHeight: 1.6 }}>
              A clean, responsive, and role-based hospital appointment management system.
              Please sign in with your account or use our demo switcher.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => setAuthModalOpen(true)}>
                Sign In or Register
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
