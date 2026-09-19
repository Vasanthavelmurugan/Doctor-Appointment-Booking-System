import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Stethoscope,
  Plus,
  Trash2,
  FileText,
  Phone,
  Mail,
  X
} from 'lucide-react';
import { api } from '../api';

export default function DoctorView({ user, onShowToast }) {
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' or 'schedule'
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  // Complete Appointment Modal State
  const [completingAppt, setCompletingAppt] = useState(null);
  const [consultNotes, setConsultNotes] = useState('');
  const [completingLoading, setCompletingLoading] = useState(false);

  // Cancel Appointment Modal State
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingLoading, setCancellingLoading] = useState(false);

  // Add Slot State
  const [newSlotDay, setNewSlotDay] = useState('Monday');
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('13:00');

  useEffect(() => {
    loadAppointments();
    loadSlots();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.appointments.getAll();
      setAppointments(res || []);
    } catch (err) {
      onShowToast('Failed to load appointments: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      if (user.doctor_id) {
        const res = await api.doctors.getSlots(user.doctor_id);
        setSlots(res || []);
      }
    } catch (err) {
      console.error('Error loading doctor slots:', err);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completingAppt) return;
    setCompletingLoading(true);
    try {
      await api.appointments.updateStatus(completingAppt.id, {
        status: 'Completed',
        notes: consultNotes.trim()
      });
      onShowToast('Appointment marked as Completed', 'success');
      setCompletingAppt(null);
      setConsultNotes('');
      loadAppointments();
    } catch (err) {
      onShowToast('Failed to complete appointment: ' + err.message, 'error');
    } finally {
      setCompletingLoading(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellingAppt) return;
    setCancellingLoading(true);
    try {
      await api.appointments.cancel(cancellingAppt.id, cancelReason);
      onShowToast('Appointment cancelled', 'success');
      setCancellingAppt(null);
      setCancelReason('');
      loadAppointments();
    } catch (err) {
      onShowToast('Failed to cancel appointment: ' + err.message, 'error');
    } finally {
      setCancellingLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    const updatedSlots = [
      ...slots,
      {
        day_of_week: newSlotDay,
        start_time: newSlotStart,
        end_time: newSlotEnd,
        slot_duration: 30,
        is_active: 1
      }
    ];

    try {
      await api.doctors.setSlots(user.doctor_id, updatedSlots);
      onShowToast('Schedule updated successfully', 'success');
      loadSlots();
    } catch (err) {
      onShowToast('Failed to update schedule: ' + err.message, 'error');
    }
  };

  const handleDeleteSlot = async (indexToRemove) => {
    const updatedSlots = slots.filter((_, idx) => idx !== indexToRemove);
    try {
      await api.doctors.setSlots(user.doctor_id, updatedSlots);
      onShowToast('Slot removed', 'success');
      loadSlots();
    } catch (err) {
      onShowToast('Failed to delete slot: ' + err.message, 'error');
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter === 'All') return true;
    return a.status === statusFilter;
  });

  const scheduledCount = appointments.filter(a => a.status === 'Scheduled').length;
  const completedCount = appointments.filter(a => a.status === 'Completed').length;

  return (
    <div>
      {/* Doctor Header Banner */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(to right, #ffffff, #f0fdfa)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-doctor">{user.profile?.specialization || 'Doctor'}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Doctor ID: #{user.doctor_id}</span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {user.profile?.name || 'Doctor Portal'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '2px' }}>
              Consultation Fee: <strong style={{ color: '#0d9488' }}>${user.profile?.consultation_fee || 50}</strong> |{' '}
              Experience: <strong>{user.profile?.experience_years || 5} years</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="stat-card" style={{ padding: '12px 20px', minWidth: '150px' }}>
              <div>
                <div className="stat-val" style={{ color: '#0d9488' }}>{scheduledCount}</div>
                <div className="stat-label">Pending Scheduled</div>
              </div>
            </div>
            <div className="stat-card" style={{ padding: '12px 20px', minWidth: '150px' }}>
              <div>
                <div className="stat-val" style={{ color: '#10b981' }}>{completedCount}</div>
                <div className="stat-label">Completed Visits</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar size={16} /> Patient Appointments ({appointments.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Clock size={16} /> Manage Working Hours & Slots ({slots.length})
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Patient Consultations Queue</h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Review patient medical symptoms, conduct sessions, and update clinical notes.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Scheduled', 'Completed', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
              Loading patient queue...
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient Details</th>
                    <th>Date & Time</th>
                    <th>Symptoms / Reason</th>
                    <th>Status</th>
                    <th>Clinical Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{appt.patient_name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Age: {appt.patient_age} | {appt.patient_gender}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#0d9488', marginTop: '2px' }}>
                          📞 {appt.patient_phone}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{appt.appointment_date}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {appt.start_time} - {appt.end_time}
                        </div>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontSize: '0.84rem', color: '#1e293b' }}>{appt.reason}</div>
                        {appt.cancellation_reason && (
                          <div style={{ fontSize: '0.76rem', color: '#dc2626', marginTop: '4px' }}>
                            <strong>Cancelled:</strong> {appt.cancellation_reason}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${appt.status.toLowerCase()}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px' }}>
                        {appt.notes ? (
                          <span style={{ fontSize: '0.82rem', color: '#047857' }}>{appt.notes}</span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No notes recorded</span>
                        )}
                      </td>
                      <td>
                        {appt.status === 'Scheduled' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => { setCompletingAppt(appt); setConsultNotes(appt.notes || ''); }}
                              title="Mark as Completed"
                            >
                              <CheckCircle size={14} /> Complete
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => { setCancellingAppt(appt); setCancelReason(''); }}
                              title="Cancel Appointment"
                            >
                              <XCircle size={14} /> Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
              <Calendar size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600 }}>No appointments match this filter</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCHEDULE & SLOTS */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'flex-start' }}>
          {/* Current Weekly Schedule */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '16px' }}>Current Active Available Slots</h2>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '20px' }}>
              These weekly slots define when patients can schedule 30-minute consultations with you.
            </p>

            {slots.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Day of Week</th>
                      <th>Time Window</th>
                      <th>Slot Duration</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((slot, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{slot.day_of_week}</strong>
                        </td>
                        <td>
                          {slot.start_time} - {slot.end_time}
                        </td>
                        <td>
                          {slot.slot_duration || 30} mins
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => handleDeleteSlot(index)}
                            title="Remove this slot"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8' }}>
                No active slots configured. Add a new slot using the form on the right.
              </div>
            )}
          </div>

          {/* Add New Slot Card */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '16px' }}>Add Working Hours</h2>
            <form onSubmit={handleAddSlot}>
              <div className="form-group">
                <label className="form-label">Day of Week</label>
                <select
                  className="form-select"
                  value={newSlotDay}
                  onChange={(e) => setNewSlotDay(e.target.value)}
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  required
                  value={newSlotStart}
                  onChange={(e) => setNewSlotStart(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  required
                  value={newSlotEnd}
                  onChange={(e) => setNewSlotEnd(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                <Plus size={16} /> Add Working Time Slot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE APPOINTMENT MODAL */}
      {completingAppt && (
        <div className="modal-backdrop" onClick={() => setCompletingAppt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0d9488' }}>
                Complete Consultation
              </h3>
              <button
                onClick={() => setCompletingAppt(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.88rem', color: '#334155', marginBottom: '14px' }}>
                  Completing consultation for patient <strong>{completingAppt.patient_name}</strong>.
                </p>

                <div className="form-group">
                  <label className="form-label">Clinical Notes / Prescription / Recommendation</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter visit summary, prescribed medication, or follow-up instructions..."
                    value={consultNotes}
                    onChange={(e) => setConsultNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCompletingAppt(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={completingLoading}
                >
                  {completingLoading ? 'Updating...' : 'Save & Mark Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancellingAppt && (
        <div className="modal-backdrop" onClick={() => setCancellingAppt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#dc2626' }}>
                Cancel Patient Appointment
              </h3>
              <button
                onClick={() => setCancellingAppt(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.88rem', color: '#334155', marginBottom: '14px' }}>
                  Are you sure you want to cancel the appointment with <strong>{cancellingAppt.patient_name}</strong> on{' '}
                  <strong>{cancellingAppt.appointment_date}</strong> at <strong>{cancellingAppt.start_time}</strong>?
                </p>

                <div className="form-group">
                  <label className="form-label">Cancellation Reason</label>
                  <textarea
                    className="form-textarea"
                    placeholder="e.g. Doctor emergency surgery, emergency leave..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCancellingAppt(null)}
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={cancellingLoading}
                >
                  {cancellingLoading ? 'Cancelling...' : 'Cancel Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
