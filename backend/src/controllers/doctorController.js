const db = require('../config/db');

async function getAllDoctors(req, res) {
  try {
    const { specialization, search } = req.query;
    let sql = 'SELECT * FROM doctors WHERE 1=1';
    const params = [];

    if (specialization && specialization !== 'All') {
      sql += ' AND LOWER(specialization) = LOWER(?)';
      params.push(specialization);
    }

    if (search) {
      sql += ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(specialization) LIKE LOWER(?) OR LOWER(bio) LIKE LOWER(?))';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY name ASC';
    const doctors = await db.query(sql, params);

    // Fetch slots for each doctor
    const doctorsWithSlots = await Promise.all(
      doctors.map(async (doc) => {
        const slots = await db.query(
          'SELECT * FROM doctor_slots WHERE doctor_id = ? AND is_active = 1 ORDER BY id ASC',
          [doc.id]
        );
        return {
          ...doc,
          slots
        };
      })
    );

    // Get list of unique specializations
    const specsResult = await db.query('SELECT DISTINCT specialization FROM doctors ORDER BY specialization ASC');
    const specializations = specsResult.map(s => s.specialization);

    return res.json({
      doctors: doctorsWithSlots,
      specializations
    });
  } catch (err) {
    console.error('Error fetching doctors:', err);
    return res.status(500).json({ error: 'Failed to retrieve doctors: ' + err.message });
  }
}

async function getDoctorById(req, res) {
  try {
    const { id } = req.params;
    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [id]);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const slots = await db.query(
      'SELECT * FROM doctor_slots WHERE doctor_id = ? AND is_active = 1',
      [id]
    );

    return res.json({
      ...doctor,
      slots
    });
  } catch (err) {
    console.error('Error fetching doctor:', err);
    return res.status(500).json({ error: 'Failed to retrieve doctor: ' + err.message });
  }
}

async function getDoctorSlots(req, res) {
  try {
    const { id } = req.params;
    const slots = await db.query('SELECT * FROM doctor_slots WHERE doctor_id = ? ORDER BY id ASC', [id]);
    return res.json(slots);
  } catch (err) {
    console.error('Error fetching slots:', err);
    return res.status(500).json({ error: 'Failed to retrieve doctor slots: ' + err.message });
  }
}

async function setDoctorSlots(req, res) {
  try {
    const { id } = req.params;
    const { slots } = req.body; // Array of { day_of_week, start_time, end_time, slot_duration }

    // Check authorization: must be admin or the doctor themselves
    if (req.user.role === 'doctor' && req.user.doctor_id !== parseInt(id, 10)) {
      return res.status(403).json({ error: 'You can only manage your own schedule' });
    }

    if (!Array.isArray(slots)) {
      return res.status(400).json({ error: 'Slots must be an array of schedule objects' });
    }

    // Delete existing slots for this doctor
    await db.run('DELETE FROM doctor_slots WHERE doctor_id = ?', [id]);

    // Insert updated slots
    for (const slot of slots) {
      if (slot.day_of_week && slot.start_time && slot.end_time) {
        await db.run(
          `INSERT INTO doctor_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, slot.day_of_week, slot.start_time, slot.end_time, slot.slot_duration || 30, slot.is_active !== undefined ? (slot.is_active ? 1 : 0) : 1]
        );
      }
    }

    const updatedSlots = await db.query('SELECT * FROM doctor_slots WHERE doctor_id = ?', [id]);
    return res.json({ message: 'Doctor schedule slots updated successfully', slots: updatedSlots });
  } catch (err) {
    console.error('Error updating slots:', err);
    return res.status(500).json({ error: 'Failed to update slots: ' + err.message });
  }
}

async function updateDoctorProfile(req, res) {
  try {
    const { id } = req.params;
    const { name, phone, specialization, experience_years, consultation_fee, bio } = req.body;

    if (req.user.role === 'doctor' && req.user.doctor_id !== parseInt(id, 10)) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    await db.run(
      `UPDATE doctors 
       SET name = COALESCE(?, name),
           phone = COALESCE(?, phone),
           specialization = COALESCE(?, specialization),
           experience_years = COALESCE(?, experience_years),
           consultation_fee = COALESCE(?, consultation_fee),
           bio = COALESCE(?, bio)
       WHERE id = ?`,
      [name, phone, specialization, experience_years, consultation_fee, bio, id]
    );

    const updated = await db.get('SELECT * FROM doctors WHERE id = ?', [id]);
    return res.json({ message: 'Doctor profile updated', doctor: updated });
  } catch (err) {
    console.error('Error updating doctor:', err);
    return res.status(500).json({ error: 'Failed to update doctor: ' + err.message });
  }
}

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorSlots,
  setDoctorSlots,
  updateDoctorProfile
};
