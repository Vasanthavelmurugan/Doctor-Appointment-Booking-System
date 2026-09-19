const db = require('../config/db');

// Helper to convert "HH:MM" to minutes from midnight
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper to convert minutes to "HH:MM"
function minutesToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

async function getAvailableSlots(req, res) {
  try {
    const { doctor_id, date } = req.query;

    if (!doctor_id || !date) {
      return res.status(400).json({ error: 'doctor_id and date (YYYY-MM-DD) are required' });
    }

    // Determine day of week from date string (UTC safe parse)
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysOfWeek[dateObj.getUTCDay()];

    // Find active doctor slots for this day of week
    const slots = await db.query(
      'SELECT * FROM doctor_slots WHERE doctor_id = ? AND day_of_week = ? AND is_active = 1',
      [doctor_id, dayName]
    );

    if (!slots || slots.length === 0) {
      return res.json({
        date,
        day_of_week: dayName,
        available: false,
        message: `Doctor has no working hours scheduled on ${dayName}s`,
        slots: []
      });
    }

    // Find already booked appointments for this doctor on this date
    const bookedAppointments = await db.query(
      "SELECT start_time FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status != 'Cancelled'",
      [doctor_id, date]
    );
    const bookedTimes = new Set(bookedAppointments.map(b => b.start_time));

    // Generate individual time slots
    const generatedSlots = [];
    for (const slot of slots) {
      const startMin = timeToMinutes(slot.start_time);
      const endMin = timeToMinutes(slot.end_time);
      const duration = slot.slot_duration || 30;

      for (let curr = startMin; curr + duration <= endMin; curr += duration) {
        const slotStart = minutesToTime(curr);
        const slotEnd = minutesToTime(curr + duration);
        const isBooked = bookedTimes.has(slotStart);

        generatedSlots.push({
          start_time: slotStart,
          end_time: slotEnd,
          is_available: !isBooked
        });
      }
    }

    return res.json({
      date,
      day_of_week: dayName,
      available: true,
      slots: generatedSlots
    });
  } catch (err) {
    console.error('Error fetching available slots:', err);
    return res.status(500).json({ error: 'Failed to calculate available slots: ' + err.message });
  }
}

async function bookAppointment(req, res) {
  try {
    const { doctor_id, appointment_date, start_time, end_time, reason, patient_id } = req.body;

    if (!doctor_id || !appointment_date || !start_time || !reason) {
      return res.status(400).json({ error: 'doctor_id, appointment_date, start_time, and reason are required' });
    }

    // Determine target patient ID
    let targetPatientId = null;
    if (req.user.role === 'patient') {
      targetPatientId = req.user.patient_id;
    } else if (req.user.role === 'admin') {
      targetPatientId = patient_id;
    }

    if (!targetPatientId) {
      return res.status(400).json({ error: 'No patient record linked to this booking' });
    }

    // Verify patient
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [targetPatientId]);
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    // Verify doctor
    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [doctor_id]);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check doctor slot conflict
    const collision = await db.get(
      "SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND start_time = ? AND status != 'Cancelled'",
      [doctor_id, appointment_date, start_time]
    );
    if (collision) {
      return res.status(409).json({ error: 'This time slot is already booked for this doctor. Please pick another slot.' });
    }

    // Check patient conflict
    const patientConflict = await db.get(
      "SELECT id FROM appointments WHERE patient_id = ? AND appointment_date = ? AND start_time = ? AND status != 'Cancelled'",
      [targetPatientId, appointment_date, start_time]
    );
    if (patientConflict) {
      return res.status(409).json({ error: 'You already have another appointment booked at this exact time.' });
    }

    // Compute end_time if omitted
    const calculatedEndTime = end_time || minutesToTime(timeToMinutes(start_time) + 30);

    // Insert appointment
    const result = await db.run(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, status, reason)
       VALUES (?, ?, ?, ?, ?, 'Scheduled', ?)`,
      [targetPatientId, doctor_id, appointment_date, start_time, calculatedEndTime, reason]
    );
    const appointmentId = result.insertId;

    // Create confirmation notification for patient
    if (patient.user_id) {
      await db.run(
        `INSERT INTO notifications (user_id, appointment_id, title, message, type, is_read)
         VALUES (?, ?, ?, ?, 'booking', 0)`,
        [
          patient.user_id,
          appointmentId,
          'Appointment Confirmed',
          `Your appointment with ${doctor.name} (${doctor.specialization}) on ${appointment_date} at ${start_time} has been booked.`
        ]
      );
    }

    // Create notification for doctor
    if (doctor.user_id) {
      await db.run(
        `INSERT INTO notifications (user_id, appointment_id, title, message, type, is_read)
         VALUES (?, ?, ?, ?, 'booking', 0)`,
        [
          doctor.user_id,
          appointmentId,
          'New Patient Booking',
          `Patient ${patient.name} has scheduled an appointment on ${appointment_date} at ${start_time} (${reason}).`
        ]
      );
    }

    const created = await db.get(
      `SELECT a.*, d.name as doctor_name, d.specialization, d.consultation_fee, p.name as patient_name, p.phone as patient_phone
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN patients p ON a.patient_id = p.id
       WHERE a.id = ?`,
      [appointmentId]
    );

    return res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: created
    });
  } catch (err) {
    console.error('Error booking appointment:', err);
    return res.status(500).json({ error: 'Failed to book appointment: ' + err.message });
  }
}

async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const appointment = await db.get(
      `SELECT a.*, d.name as doctor_name, d.user_id as doctor_user_id, p.name as patient_name, p.user_id as patient_user_id
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN patients p ON a.patient_id = p.id
       WHERE a.id = ?`,
      [id]
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Role check
    if (req.user.role === 'patient' && req.user.patient_id !== appointment.patient_id) {
      return res.status(403).json({ error: 'You cannot cancel another patient\'s appointment' });
    }
    if (req.user.role === 'doctor' && req.user.doctor_id !== appointment.doctor_id) {
      return res.status(403).json({ error: 'You can only cancel appointments scheduled with you' });
    }

    if (appointment.status === 'Cancelled') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    const reason = cancellation_reason || `Cancelled by ${req.user.role}`;

    await db.run(
      "UPDATE appointments SET status = 'Cancelled', cancellation_reason = ? WHERE id = ?",
      [reason, id]
    );

    // Send cancellation notifications
    if (appointment.patient_user_id) {
      await db.run(
        `INSERT INTO notifications (user_id, appointment_id, title, message, type, is_read)
         VALUES (?, ?, ?, ?, 'cancellation', 0)`,
        [
          appointment.patient_user_id,
          id,
          'Appointment Cancelled',
          `Your appointment with ${appointment.doctor_name} on ${appointment.appointment_date} at ${appointment.start_time} was cancelled. Reason: ${reason}`
        ]
      );
    }

    if (appointment.doctor_user_id) {
      await db.run(
        `INSERT INTO notifications (user_id, appointment_id, title, message, type, is_read)
         VALUES (?, ?, ?, ?, 'cancellation', 0)`,
        [
          appointment.doctor_user_id,
          id,
          'Appointment Cancelled',
          `Appointment with ${appointment.patient_name} on ${appointment.appointment_date} at ${appointment.start_time} was cancelled. Reason: ${reason}`
        ]
      );
    }

    const updated = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    return res.json({ message: 'Appointment cancelled successfully', appointment: updated });
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    return res.status(500).json({ error: 'Failed to cancel appointment: ' + err.message });
  }
}

async function updateAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const appointment = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (req.user.role === 'doctor' && req.user.doctor_id !== appointment.doctor_id) {
      return res.status(403).json({ error: 'You can only update appointments scheduled with you' });
    }

    await db.run(
      'UPDATE appointments SET status = COALESCE(?, status), notes = COALESCE(?, notes) WHERE id = ?',
      [status, notes, id]
    );

    const updated = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    return res.json({ message: 'Appointment updated successfully', appointment: updated });
  } catch (err) {
    console.error('Error updating appointment:', err);
    return res.status(500).json({ error: 'Failed to update appointment: ' + err.message });
  }
}

async function getAllAppointments(req, res) {
  try {
    const { status, doctor_id, patient_id, date, upcoming } = req.query;

    let sql = `
      SELECT a.*, 
             d.name as doctor_name, d.specialization, d.consultation_fee, d.phone as doctor_phone,
             p.name as patient_name, p.age as patient_age, p.gender as patient_gender, p.phone as patient_phone, p.email as patient_email
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN patients p ON a.patient_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based restrictions
    if (req.user.role === 'patient') {
      sql += ' AND a.patient_id = ?';
      params.push(req.user.patient_id);
    } else if (req.user.role === 'doctor') {
      sql += ' AND a.doctor_id = ?';
      params.push(req.user.doctor_id);
    } else if (req.user.role === 'admin') {
      if (doctor_id) {
        sql += ' AND a.doctor_id = ?';
        params.push(doctor_id);
      }
      if (patient_id) {
        sql += ' AND a.patient_id = ?';
        params.push(patient_id);
      }
    }

    if (status && status !== 'All') {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    if (date) {
      sql += ' AND a.appointment_date = ?';
      params.push(date);
    }

    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      sql += ' AND a.appointment_date >= ? AND a.status = "Scheduled"';
      params.push(today);
    }

    sql += ' ORDER BY a.appointment_date DESC, a.start_time DESC';

    const appointments = await db.query(sql, params);
    return res.json(appointments);
  } catch (err) {
    console.error('Error retrieving appointments:', err);
    return res.status(500).json({ error: 'Failed to fetch appointments: ' + err.message });
  }
}

module.exports = {
  getAvailableSlots,
  bookAppointment,
  cancelAppointment,
  updateAppointmentStatus,
  getAllAppointments
};
