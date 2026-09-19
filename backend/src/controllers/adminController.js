const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function getDashboardStats(req, res) {
  try {
    const totalPatientsRow = await db.get('SELECT COUNT(*) as count FROM patients');
    const totalDoctorsRow = await db.get('SELECT COUNT(*) as count FROM doctors');
    const totalAppointmentsRow = await db.get('SELECT COUNT(*) as count FROM appointments');

    const scheduledRow = await db.get("SELECT COUNT(*) as count FROM appointments WHERE status = 'Scheduled'");
    const completedRow = await db.get("SELECT COUNT(*) as count FROM appointments WHERE status = 'Completed'");
    const cancelledRow = await db.get("SELECT COUNT(*) as count FROM appointments WHERE status = 'Cancelled'");

    const today = new Date().toISOString().split('T')[0];
    const todayAppointmentsRow = await db.get('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?', [today]);

    // Recent 5 appointments
    const recentAppointments = await db.query(
      `SELECT a.*, d.name as doctor_name, d.specialization, p.name as patient_name
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN patients p ON a.patient_id = p.id
       ORDER BY a.created_at DESC
       LIMIT 5`
    );

    // Recent 5 registered patients
    const recentPatients = await db.query(
      'SELECT id, name, age, phone, email, created_at FROM patients ORDER BY created_at DESC LIMIT 5'
    );

    return res.json({
      stats: {
        total_patients: totalPatientsRow ? Number(totalPatientsRow.count || 0) : 0,
        total_doctors: totalDoctorsRow ? Number(totalDoctorsRow.count || 0) : 0,
        total_appointments: totalAppointmentsRow ? Number(totalAppointmentsRow.count || 0) : 0,
        scheduled: scheduledRow ? Number(scheduledRow.count || 0) : 0,
        completed: completedRow ? Number(completedRow.count || 0) : 0,
        cancelled: cancelledRow ? Number(cancelledRow.count || 0) : 0,
        today_count: todayAppointmentsRow ? Number(todayAppointmentsRow.count || 0) : 0
      },
      recent_appointments: recentAppointments,
      recent_patients: recentPatients
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return res.status(500).json({ error: 'Failed to retrieve dashboard stats: ' + err.message });
  }
}

async function createDoctor(req, res) {
  try {
    const { name, email, password, phone, specialization, experience_years, consultation_fee, bio, slots } = req.body;

    if (!name || !email || !password || !specialization) {
      return res.status(400).json({ error: 'Name, email, password, and specialization are required' });
    }

    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userResult = await db.run(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email.trim().toLowerCase(), hashedPassword, 'doctor']
    );

    const doctorResult = await db.run(
      `INSERT INTO doctors (user_id, name, email, phone, specialization, experience_years, consultation_fee, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userResult.insertId,
        name.trim(),
        email.trim().toLowerCase(),
        phone || '',
        specialization.trim(),
        experience_years ? parseInt(experience_years, 10) : 1,
        consultation_fee ? parseFloat(consultation_fee) : 50.0,
        bio || ''
      ]
    );
    const doctorId = doctorResult.insertId;

    // Add default slots if provided
    if (Array.isArray(slots) && slots.length > 0) {
      for (const slot of slots) {
        await db.run(
          `INSERT INTO doctor_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [doctorId, slot.day_of_week, slot.start_time, slot.end_time, slot.slot_duration || 30]
        );
      }
    } else {
      // Create standard Monday-Friday default slots
      const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      for (const day of defaultDays) {
        await db.run(
          `INSERT INTO doctor_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active)
           VALUES (?, ?, '09:00', '13:00', 30, 1)`,
          [doctorId, day]
        );
      }
    }

    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [doctorId]);
    return res.status(201).json({ message: 'Doctor onboarded successfully', doctor });
  } catch (err) {
    console.error('Error creating doctor:', err);
    return res.status(500).json({ error: 'Failed to create doctor: ' + err.message });
  }
}

async function deleteDoctor(req, res) {
  try {
    const { id } = req.params;
    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [id]);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (doctor.user_id) {
      await db.run('DELETE FROM users WHERE id = ?', [doctor.user_id]);
    }
    await db.run('DELETE FROM doctors WHERE id = ?', [id]);

    return res.json({ message: 'Doctor deleted successfully' });
  } catch (err) {
    console.error('Error deleting doctor:', err);
    return res.status(500).json({ error: 'Failed to delete doctor: ' + err.message });
  }
}

module.exports = {
  getDashboardStats,
  createDoctor,
  deleteDoctor
};
