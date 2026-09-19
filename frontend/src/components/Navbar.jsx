import React, { useState } from 'react';
import { Activity, Bell, LogOut, User, Check, RefreshCw, X, Shield, Stethoscope } from 'lucide-react';

export default function Navbar({
  user,
  onLogout,
  onOpenAuth,
  notifications,
  unreadCount,
  onMarkNotifRead,
  onRefreshReminders,
  onQuickLogin
}) {
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <>
      {/* Quick Demo Switcher Bar */}
      <div className="demo-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, letterSpacing: '0.04em' }}>DEMO QUICK-LOGIN:</span>
          <span style={{ opacity: 0.8 }}>Switch roles in 1 click:</span>
        </div>
        <div className="demo-pills">
          <button
            className="demo-btn"
            onClick={() => onQuickLogin('admin@hospital.com', 'admin123')}
          >
            🛡️ Admin
          </button>
          <button
            className="demo-btn"
            onClick={() => onQuickLogin('dr.jenkins@hospital.com', 'doctor123')}
          >
            🩺 Dr. Jenkins (Cardio)
          </button>
          <button
            className="demo-btn"
            onClick={() => onQuickLogin('dr.chen@hospital.com', 'doctor123')}
          >
            🩺 Dr. Chen (Derma)
          </button>
          <button
            className="demo-btn"
            onClick={() => onQuickLogin('alice@example.com', 'patient123')}
          >
            👤 Alice (Patient)
          </button>
          <button
            className="demo-btn"
            onClick={() => onQuickLogin('david@example.com', 'patient123')}
          >
            👤 David (Patient)
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="brand-icon">
              <Activity size={22} />
            </div>
            <div>
              <span>CarePulse</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, display: 'block', marginTop: '-4px' }}>
                Healthcare Appointment Platform
              </span>
            </div>
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                {/* Role badge */}
                <span className={`badge badge-${user.role}`}>
                  {user.role === 'admin' && <Shield size={12} />}
                  {user.role === 'doctor' && <Stethoscope size={12} />}
                  {user.role === 'patient' && <User size={12} />}
                  {user.role}
                </span>

                {/* Notifications Bell */}
                <div style={{ position: 'relative' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ position: 'relative', padding: '8px 10px' }}
                    onClick={() => setShowNotifs(!showNotifs)}
                    title="Notifications & Reminders"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '999px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          minWidth: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 4px',
                          boxShadow: '0 0 0 2px white'
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown menu */}
                  {showNotifs && (
                    <div className="notif-dropdown">
                      <div
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#f8fafc'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Bell size={16} color="#0d9488" />
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications & Reminders</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                            onClick={onRefreshReminders}
                            title="Check for new reminders"
                          >
                            <RefreshCw size={12} /> Check
                          </button>
                          {unreadCount > 0 && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                              onClick={() => onMarkNotifRead('all')}
                            >
                              <Check size={12} /> Read All
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                        {notifications && notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
                              onClick={() => !notif.is_read && onMarkNotifRead(notif.id)}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>
                                    {notif.title}
                                  </span>
                                  {!notif.is_read && (
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d9488', marginTop: '4px' }} />
                                  )}
                                </div>
                                <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                                  {notif.message}
                                </p>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                                  {new Date(notif.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                            No notifications yet
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      {user.profile?.name || user.email.split('@')[0]}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {user.email}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onLogout}
                  title="Sign out"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={onOpenAuth}>
                <User size={16} /> Sign In / Register
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
