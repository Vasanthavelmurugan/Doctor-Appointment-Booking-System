import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  X,
  FileText,
  Bell
} from 'lucide-react';
import { api } from '../api';

export default function PatientView({ user, onShowToast }) {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' or 'appointments'
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [myAppointments, setMyAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState(() => {
    // Tomorrow as default
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingReason, setBookingReason] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Cancellation Modal State
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Filter for appointments tab
  const [apptFilter, setApptFilter] = useState('All');

  useEffect(() => {
    loadDoctors();
    loadAppointments();
  }, [selectedSpecialization, searchQuery]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.doctors.getAll({
        specialization: selectedSpecialization,
        search: searchQuery
      });
      setDoctors(res.doctors || []);
      setSpecializations(res.specializations || []);
    } catch (err) {
      onShowToast('Failed to load doctors: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const res = await api.appointments.getAll();
      setMyAppointments(res || []);
    } catch (err) {
      console.error('Error loading appointments:', err);
    }
  };

  // When opening booking modal or changing date, fetch available slots
  const openBookingModal = (doctor) => {
    setBookingDoctor(doctor);
    setSelectedSlot(null);
    setBookingReason('');
    fetchSlots(doctor.id, bookingDate);
  };

  const fetchSlots = async (doctorId, date) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    setSlotsMessage('');
    try {
      const res = await api.appointments.getSlots(doctorId, date);
      setAvailableSlots(res.slots || []);
      if (!res.available) {
        setSlotsMessage(res.message || 'Doctor not available on this day');
      } else if (!res.slots || res.slots.length === 0) {
        setSlotsMessage('No available slots for this date');
      }
    } catch (err) {
      setSlotsMessage('Could not retrieve slots: ' + err.message);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setBookingDate(newDate);
    if (bookingDoctor) {
      fetchSlots(bookingDoctor.id, newDate);
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      onShowToast('Please select a time slot', 'error');
      return;
    }
    if (!bookingReason.trim()) {
      onShowToast('Please describe your symptoms or reason for visit', 'error');
      return;
    }

    setBookingSubmitting(true);
    try {
      await api.appointments.book({
        doctor_id: bookingDoctor.id,
        appointment_date: bookingDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        reason: bookingReason.trim()
      });

      onShowToast('Appointment successfully booked!', 'success');
      setBookingDoctor(null);
      loadAppointments();
      setActiveTab('appointments');
    } catch (err) {
      onShowToast(err.message || 'Booking failed', 'error');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellingAppt) return;
    setCancelSubmitting(true);
    try {
      await api.appointments.cancel(cancellingAppt.id, cancelReason);
      onShowToast('Appointment has been cancelled', 'success');
      setCancellingAppt(null);
      setCancelReason('');
      loadAppointments();
    } catch (err) {
      onShowToast('Failed to cancel appointment: ' + err.message, 'error');
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Filtered appointments
  const filteredAppointments = myAppointments.filter((a) => {
    if (apptFilter === 'All') return true;
    return a.status === apptFilter;
  });

  // Upcoming reminders check
  const upcomingScheduled = myAppointments.filter(a => a.status === 'Scheduled');

  return (
    <div>
      {/* Patient Welcome Card */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(to right, #ffffff, #f0fdfa)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              Welcome back, {user.profile?.name || user.email}!
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
              Book doctor consultations, select available time slots, and manage your health appointments.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Patient ID: #{user.patient_id || 'N/A'}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Age: {user.profile?.age || 30} yrs | {user.profile?.gender || 'Patient'}</div>
            </div>
            <button className="btn btn-primary" onClick={() => setActiveTab('browse')}>
              <Calendar size={16} /> Book New Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Reminder Alert if any upcoming scheduled */}
      {upcomingScheduled.length > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} color="#d97706" />
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#92400e' }}>
                You have an upcoming appointment scheduled:
              </span>
              <span style={{ fontSize: '0.86rem', color: '#b45309', marginLeft: '6px' }}>
                With {upcomingScheduled[0].doctor_name} ({upcomingScheduled[0].specialization}) on{' '}
                <strong>{upcomingScheduled[0].appointment_date}</strong> at{' '}
                <strong>{upcomingScheduled[0].start_time}</strong>
              </span>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ borderColor: '#fde68a', color: '#92400e' }}
            onClick={() => setActiveTab('appointments')}
          >
            View Details
          </button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          <Stethoscope size={16} /> Browse & Book Doctors
        </button>
        <button
          className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar size={16} /> My Appointments ({myAppointments.length})
        </button>
      </div>

      {/* TAB 1: BROWSE DOCTORS */}
      {activeTab === 'browse' && (
        <div>
          {/* Filters Bar */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}
          >
            {/* Search */}
            <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '400px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="Search by doctor name or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Specialization Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${selectedSpecialization === 'All' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedSpecialization('All')}
              >
                All Specializations
              </button>
              {specializations.map((spec) => (
                <button
                  key={spec}
                  className={`btn btn-sm ${selectedSpecialization === spec ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedSpecialization(spec)}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Doctors Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              Loading doctors directory...
            </div>
          ) : doctors.length > 0 ? (
            <div className="doctors-grid">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="doctor-card">
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: '#f0fdfa',
                        border: '1px solid #ccfbf1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0d9488',
                        flexShrink: 0
                      }}
                    >
                      <Stethoscope size={26} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{doctor.name}</h3>
                      <span className="badge badge-doctor" style={{ marginTop: '4px' }}>
                        {doctor.specialization}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>
                    {doctor.bio || 'Experienced specialist dedicated to providing personalized medical care and treatment.'}
                  </p>

                  <div
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '12px',
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      color: '#64748b'
                    }}
                  >
                    <div>
                      <span>Experience:</span>
                      <strong style={{ color: '#0f172a', marginLeft: '4px' }}>{doctor.experience_years} years</strong>
                    </div>
                    <div>
                      <span>Fee:</span>
                      <strong style={{ color: '#0d9488', marginLeft: '4px' }}>${doctor.consultation_fee}</strong>
                    </div>
                  </div>

                  {/* Available schedule overview */}
                  <div style={{ marginBottom: '16px', fontSize: '0.78rem', color: '#64748b' }}>
                    <span style={{ fontWeight: 600 }}>Weekly Days: </span>
                    {doctor.slots && doctor.slots.length > 0 ? (
                      <span>{doctor.slots.map(s => s.day_of_week).join(', ')}</span>
                    ) : (
                      <span>Mon - Fri</span>
                    )}
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => openBookingModal(doctor)}
                  >
                    <Calendar size={16} /> Book Appointment
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <Stethoscope size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#64748b', fontWeight: 600 }}>No doctors found matching your criteria</p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '12px' }}
                onClick={() => { setSelectedSpecialization('All'); setSearchQuery(''); }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">My Appointment History</h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Track scheduled consultations, cancellation status, and completed clinical summaries.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Scheduled', 'Completed', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  className={`btn btn-sm ${apptFilter === status ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setApptFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {filteredAppointments.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Doctor & Specialty</th>
                    <th>Date & Time</th>
                    <th>Fee</th>
                    <th>Reason / Symptoms</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{appt.doctor_name}</div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{appt.specialization}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#0d9488" />
                          <span style={{ fontWeight: 600 }}>{appt.appointment_date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          <Clock size={12} />
                          <span>{appt.start_time} - {appt.end_time}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>${appt.consultation_fee}</span>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontSize: '0.84rem', color: '#334155' }}>{appt.reason}</div>
                        {appt.notes && (
                          <div style={{ fontSize: '0.76rem', color: '#059669', marginTop: '4px' }}>
                            <strong>Doctor Notes:</strong> {appt.notes}
                          </div>
                        )}
                        {appt.cancellation_reason && (
                          <div style={{ fontSize: '0.76rem', color: '#dc2626', marginTop: '4px' }}>
                            <strong>Cancellation Reason:</strong> {appt.cancellation_reason}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${appt.status.toLowerCase()}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td>
                        {appt.status === 'Scheduled' && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => { setCancellingAppt(appt); setCancelReason(''); }}
                          >
                            Cancel
                          </button>
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
              <p style={{ fontWeight: 600 }}>No appointments found for this filter</p>
            </div>
          )}
        </div>
      )}

      {/* BOOKING MODAL */}
      {bookingDoctor && (
        <div className="modal-backdrop" onClick={() => setBookingDoctor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Book Appointment
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  With {bookingDoctor.name} ({bookingDoctor.specialization})
                </p>
              </div>
              <button
                onClick={() => setBookingDoctor(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking}>
              <div className="modal-body">
                {/* Doctor quick recap */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Consultation Fee</span>
                    <strong style={{ fontSize: '1rem', color: '#0d9488' }}>${bookingDoctor.consultation_fee}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Doctor Phone</span>
                    <span style={{ fontSize: '0.85rem', color: '#0f172a' }}>{bookingDoctor.phone}</span>
                  </div>
                </div>

                {/* Date Picker */}
                <div className="form-group">
                  <label className="form-label">Select Consultation Date</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={handleDateChange}
                  />
                </div>

                {/* Available Time Slots */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Select Available Time Slot</label>
                    {slotsLoading && <span style={{ fontSize: '0.76rem', color: '#0d9488' }}>Checking availability...</span>}
                  </div>

                  {slotsMessage ? (
                    <div
                      style={{
                        padding: '12px',
                        background: '#fef2f2',
                        color: '#991b1b',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        border: '1px solid #fee2e2'
                      }}
                    >
                      {slotsMessage}
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="slots-container">
                      {availableSlots.map((slot) => (
                        <div
                          key={slot.start_time}
                          className={`slot-pill ${!slot.is_available ? 'booked' : ''} ${
                            selectedSlot?.start_time === slot.start_time ? 'selected' : ''
                          }`}
                          onClick={() => slot.is_available && setSelectedSlot(slot)}
                          title={!slot.is_available ? 'Already booked' : 'Available'}
                        >
                          {slot.start_time}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      Please select a date to view available time slots
                    </div>
                  )}

                  {selectedSlot && (
                    <div style={{ fontSize: '0.82rem', color: '#0d9488', fontWeight: 600, marginTop: '6px' }}>
                      ✓ Selected Slot: {selectedSlot.start_time} - {selectedSlot.end_time}
                    </div>
                  )}
                </div>

                {/* Symptoms / Reason */}
                <div className="form-group">
                  <label className="form-label">Reason for Visit / Symptoms *</label>
                  <textarea
                    className="form-textarea"
                    required
                    placeholder="Briefly describe your symptoms or what you would like to consult the doctor about..."
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBookingDoctor(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!selectedSlot || bookingSubmitting}
                >
                  {bookingSubmitting ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {cancellingAppt && (
        <div className="modal-backdrop" onClick={() => setCancellingAppt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#dc2626' }}>
                Cancel Appointment
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
                  Are you sure you want to cancel your appointment with{' '}
                  <strong>{cancellingAppt.doctor_name}</strong> on{' '}
                  <strong>{cancellingAppt.appointment_date}</strong> at{' '}
                  <strong>{cancellingAppt.start_time}</strong>?
                </p>

                <div className="form-group">
                  <label className="form-label">Reason for Cancellation (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="e.g. Personal schedule conflict, symptom resolved, feeling better..."
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
                  disabled={cancelSubmitting}
                >
                  {cancelSubmitting ? 'Cancelling...' : 'Yes, Cancel Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
