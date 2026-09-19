const db = require('../config/db');

async function getAllPatients(req, res) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT p.*, COUNT(a.id) as total_appointments
      FROM patients p
      LEFT JOIN appointments a ON p.id = a.patient_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (LOWER(p.name) LIKE LOWER(?) OR LOWER(p.email) LIKE LOWER(?) OR LOWER(p.phone) LIKE LOWER(?))';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' GROUP BY p.id ORDER BY p.name ASC';
    const patients = await db.query(sql, params);
    return res.json(patients);
  } catch (err) {
    console.error('Error getting patients:', err);
    return res.status(500).json({ error: 'Failed to retrieve patients: ' + err.message });
  }
}

async function getPatientById(req, res) {
  try {
    const { id } = req.params;

    // Check authorization: patient can only view their own profile, doctors and admins can view any
    if (req.user.role === 'patient' && req.user.patient_id !== parseInt(id, 10)) {
      return res.status(403).json({ error: 'Access denied to this patient profile' });
    }

    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [id]);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Fetch appointment history
    const appointments = await db.query(
      `SELECT a.*, d.name as doctor_name, d.specialization
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC, a.start_time DESC`,
      [id]
    );

    return res.json({
      ...patient,
      appointments
    });
  } catch (err) {
    console.error('Error fetching patient:', err);
    return res.status(500).json({ error: 'Failed to retrieve patient: ' + err.message });
  }
}

async function updatePatientProfile(req, res) {
  try {
    const { id } = req.params;
    const { name, age, gender, phone, address, medical_history } = req.body;

    if (req.user.role === 'patient' && req.user.patient_id !== parseInt(id, 10)) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    await db.run(
      `UPDATE patients
       SET name = COALESCE(?, name),
           age = COALESCE(?, age),
           gender = COALESCE(?, gender),
           phone = COALESCE(?, phone),
           address = COALESCE(?, address),
           medical_history = COALESCE(?, medical_history)
       WHERE id = ?`,
      [name, age, gender, phone, address, medical_history, id]
    );

    const updated = await db.get('SELECT * FROM patients WHERE id = ?', [id]);
    return res.json({ message: 'Patient profile updated', patient: updated });
  } catch (err) {
    console.error('Error updating patient:', err);
    return res.status(500).json({ error: 'Failed to update patient profile: ' + err.message });
  }
}

module.exports = {
  getAllPatients,
  getPatientById,
  updatePatientProfile
};
