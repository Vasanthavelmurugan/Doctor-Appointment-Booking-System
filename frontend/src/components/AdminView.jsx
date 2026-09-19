import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Search,
  Filter,
  Stethoscope,
  Activity,
  X,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';
import { api } from '../api';

export default function AdminView({ onShowToast }) {
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments', 'doctors', 'patients'
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter state for appointments
  const [apptStatusFilter, setApptStatusFilter] = useState('All');
  const [apptSearch, setApptSearch] = useState('');

  // Add Doctor Modal State
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: 'General Medicine',
    experience_years: 5,
    consultation_fee: 75.0,
    bio: ''
  });
  const [addDoctorLoading, setAddDoctorLoading] = useState(false);

  // Cancellation Modal
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, apptsRes, docsRes, patientsRes] = await Promise.all([
        api.admin.getStats(),
        api.appointments.getAll(),
        api.doctors.getAll(),
        api.patients.getAll()
      ]);
      setStats(statsRes.stats);
      setAppointments(apptsRes || []);
      setDoctors(docsRes.doctors || []);
      setPatients(patientsRes || []);
    } catch (err) {
      onShowToast('Failed to load dashboard data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setAddDoctorLoading(true);
    try {
      await api.admin.createDoctor(newDoctor);
      onShowToast(`Doctor ${newDoctor.name} onboarded successfully`, 'success');
      setShowAddDoctorModal(false);
      setNewDoctor({
        name: '',
        email: '',
        password: '',
        phone: '',
        specialization: 'General Medicine',
        experience_years: 5,
        consultation_fee: 75.0,
        bio: ''
      });
      loadDashboardData();
    } catch (err) {
      onShowToast(err.message || 'Failed to create doctor', 'error');
    } finally {
      setAddDoctorLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (!window.confirm(`Are you sure you want to remove ${doctorName}?`)) return;
    try {
      await api.admin.deleteDoctor(doctorId);
      onShowToast('Doctor removed', 'success');
      loadDashboardData();
    } catch (err) {
      onShowToast('Failed to delete doctor: ' + err.message, 'error');
    }
  };

  const handleCancelAppointment = async (e) => {
    e.preventDefault();
    if (!cancellingAppt) return;
    try {
      await api.appointments.cancel(cancellingAppt.id, cancelReason || 'Cancelled by Admin');
      onShowToast('Appointment cancelled by Admin', 'success');
      setCancellingAppt(null);
      setCancelReason('');
      loadDashboardData();
    } catch (err) {
      onShowToast('Cancellation failed: ' + err.message, 'error');
    }
  };

  const handleUpdateStatus = async (apptId, newStatus) => {
    try {
      await api.appointments.updateStatus(apptId, { status: newStatus });
      onShowToast(`Appointment status updated to ${newStatus}`, 'success');
      loadDashboardData();
    } catch (err) {
      onShowToast('Status update failed: ' + err.message, 'error');
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = apptStatusFilter === 'All' || a.status === apptStatusFilter;
    const matchesSearch = !apptSearch ||
      a.doctor_name.toLowerCase().includes(apptSearch.toLowerCase()) ||
      a.patient_name.toLowerCase().includes(apptSearch.toLowerCase()) ||
      a.specialization.toLowerCase().includes(apptSearch.toLowerCase()) ||
      a.reason.toLowerCase().includes(apptSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      {/* Admin Welcome Banner */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(to right, #ffffff, #fffbeb)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="badge badge-admin">Administrator Dashboard</span>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              Hospital System Operations
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
              Real-time monitoring of clinical appointments, medical specialists, and patient bookings.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddDoctorModal(true)}>
            <Plus size={16} /> Onboard New Doctor
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              <Calendar size={24} />
            </div>
            <div>
              <div className="stat-val">{stats.total_appointments}</div>
              <div className="stat-label">Total Appointments</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}>
              <Clock size={24} />
            </div>
            <div>
              <div className="stat-val" style={{ color: '#166534' }}>{stats.scheduled}</div>
              <div className="stat-label">Active Scheduled</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f0fdfa', color: '#0d9488' }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <div className="stat-val">{stats.total_doctors}</div>
              <div className="stat-label">Practicing Doctors</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}>
              <Users size={24} />
            </div>
            <div>
              <div className="stat-val">{stats.total_patients}</div>
              <div className="stat-label">Registered Patients</div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar size={16} /> Master Appointments ({appointments.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'doctors' ? 'active' : ''}`}
          onClick={() => setActiveTab('doctors')}
        >
          <Stethoscope size={16} /> Doctors Directory ({doctors.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveTab('patients')}
        >
          <Users size={16} /> Patients Directory ({patients.length})
        </button>
      </div>

      {/* TAB 1: MASTER APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '380px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="Search patient, doctor, reason..."
                value={apptSearch}
                onChange={(e) => setApptSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['All', 'Scheduled', 'Completed', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  className={`btn btn-sm ${apptStatusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setApptStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredAppointments.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Doctor & Specialty</th>
                    <th>Date & Time</th>
                    <th>Fee</th>
                    <th>Reason / Symptoms</th>
                    <th>Status</th>
                    <th>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appt) => (
                    <tr key={appt.id}>
                      <td style={{ fontWeight: 600, color: '#64748b' }}>#{appt.id}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{appt.patient_name}</div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                          Age {appt.patient_age} | {appt.patient_phone}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{appt.doctor_name}</div>
                        <div style={{ fontSize: '0.76rem', color: '#0d9488' }}>{appt.specialization}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{appt.appointment_date}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {appt.start_time} - {appt.end_time}
                        </div>
                      </td>
                      <td>${appt.consultation_fee}</td>
                      <td style={{ maxWidth: '220px' }}>
                        <div style={{ fontSize: '0.84rem' }}>{appt.reason}</div>
                        {appt.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>
                            Notes: {appt.notes}
                          </div>
                        )}
                        {appt.cancellation_reason && (
                          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '2px' }}>
                            Cancel Reason: {appt.cancellation_reason}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${appt.status.toLowerCase()}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {appt.status === 'Scheduled' && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                onClick={() => handleUpdateStatus(appt.id, 'Completed')}
                                title="Mark Completed"
                              >
                                Complete
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                onClick={() => { setCancellingAppt(appt); setCancelReason(''); }}
                                title="Cancel"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {appt.status === 'Cancelled' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                              onClick={() => handleUpdateStatus(appt.id, 'Scheduled')}
                              title="Reopen as Scheduled"
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
              No appointments found
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOCTORS DIRECTORY */}
      {activeTab === 'doctors' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Hospital Doctors Roster</h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Manage physician credentials, specializations, consultation rates, and weekly schedules.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddDoctorModal(true)}>
              <Plus size={16} /> Add Doctor
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Rate</th>
                  <th>Contact</th>
                  <th>Scheduled Slots</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>ID: #{doc.id}</div>
                    </td>
                    <td>
                      <span className="badge badge-doctor">{doc.specialization}</span>
                    </td>
                    <td>{doc.experience_years} years</td>
                    <td>
                      <strong style={{ color: '#0d9488' }}>${doc.consultation_fee}</strong>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>📞 {doc.phone}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>✉️ {doc.email}</div>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                        {doc.slots && doc.slots.length > 0
                          ? doc.slots.map(s => s.day_of_week.slice(0, 3)).join(', ')
                          : 'Standard Mon-Fri'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                        title="Delete Doctor"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PATIENTS DIRECTORY */}
      {activeTab === 'patients' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Registered Patient Records</h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Complete directory of registered patients, emergency details, and appointment counts.
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Demographics</th>
                  <th>Contact Details</th>
                  <th>Address</th>
                  <th>Medical Notes</th>
                  <th>Total Bookings</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Patient ID: #{p.id}</div>
                    </td>
                    <td>
                      <div>Age: {p.age}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{p.gender}</div>
                    </td>
                    <td>
                      <div>📞 {p.phone}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>✉️ {p.email}</div>
                    </td>
                    <td style={{ maxWidth: '180px', fontSize: '0.82rem', color: '#475569' }}>
                      {p.address || 'Not specified'}
                    </td>
                    <td style={{ maxWidth: '200px', fontSize: '0.82rem', color: '#334155' }}>
                      {p.medical_history || 'None'}
                    </td>
                    <td>
                      <span className="badge badge-patient">
                        {p.total_appointments || 0} visits
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ONBOARD DOCTOR MODAL */}
      {showAddDoctorModal && (
        <div className="modal-backdrop" onClick={() => setShowAddDoctorModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Onboard New Specialist / Doctor
              </h3>
              <button
                onClick={() => setShowAddDoctorModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Doctor Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Dr. Jennifer Adams"
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Email (Login) *</label>
                    <input
                      type="email"
                      className="form-input"
                      required
                      placeholder="doctor@hospital.com"
                      value={newDoctor.email}
                      onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      className="form-input"
                      required
                      placeholder="Secure password"
                      value={newDoctor.password}
                      onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Specialization *</label>
                    <select
                      className="form-select"
                      value={newDoctor.specialization}
                      onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Neurology">Neurology</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Ophthalmology">Ophthalmology</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+1 (555) 000-0000"
                      value={newDoctor.phone}
                      onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Years of Experience</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={newDoctor.experience_years}
                      onChange={(e) => setNewDoctor({ ...newDoctor, experience_years: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Consultation Fee ($)</label>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      className="form-input"
                      value={newDoctor.consultation_fee}
                      onChange={(e) => setNewDoctor({ ...newDoctor, consultation_fee: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Professional Bio / Summary</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Brief background, certifications, and clinical interests..."
                    value={newDoctor.bio}
                    onChange={(e) => setNewDoctor({ ...newDoctor, bio: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddDoctorModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addDoctorLoading}
                >
                  {addDoctorLoading ? 'Onboarding...' : 'Onboard Doctor'}
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
                Cancel Appointment (Admin Override)
              </h3>
              <button
                onClick={() => setCancellingAppt(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCancelAppointment}>
              <div className="modal-body">
                <p style={{ fontSize: '0.88rem', color: '#334155', marginBottom: '14px' }}>
                  Cancelling appointment #{cancellingAppt.id} between patient{' '}
                  <strong>{cancellingAppt.patient_name}</strong> and{' '}
                  <strong>{cancellingAppt.doctor_name}</strong>.
                </p>

                <div className="form-group">
                  <label className="form-label">Reason for Cancellation</label>
                  <textarea
                    className="form-textarea"
                    placeholder="e.g. Schedule readjustment by clinic administration..."
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
                  Back
                </button>
                <button type="submit" className="btn btn-danger">
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
