const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken } = require('../middleware/auth');

async function registerPatient(req, res) {
  try {
    const { email, password, name, age, gender, phone, address, medical_history } = req.body;

    if (!email || !password || !name || !phone) {
      return res.status(400).json({ error: 'Please provide email, password, name, and phone number' });
    }

    // Check if email already exists
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const userResult = await db.run(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email.trim().toLowerCase(), hashedPassword, 'patient']
    );
    const userId = userResult.insertId;

    // Insert patient profile
    const patientResult = await db.run(
      `INSERT INTO patients (user_id, name, age, gender, phone, email, address, medical_history)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name.trim(),
        age ? parseInt(age, 10) : 0,
        gender || 'Not Specified',
        phone.trim(),
        email.trim().toLowerCase(),
        address || '',
        medical_history || ''
      ]
    );

    const token = generateToken({
      id: userId,
      email: email.trim().toLowerCase(),
      role: 'patient',
      patient_id: patientResult.insertId
    });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        email: email.trim().toLowerCase(),
        role: 'patient',
        patient_id: patientResult.insertId,
        name: name.trim()
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'Server error during registration: ' + err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let profile = null;
    let patientId = null;
    let doctorId = null;

    if (user.role === 'patient') {
      profile = await db.get('SELECT * FROM patients WHERE user_id = ?', [user.id]);
      if (profile) patientId = profile.id;
    } else if (user.role === 'doctor') {
      profile = await db.get('SELECT * FROM doctors WHERE user_id = ?', [user.id]);
      if (profile) doctorId = profile.id;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      patient_id: patientId,
      doctor_id: doctorId
    });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        patient_id: patientId,
        doctor_id: doctorId,
        profile
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Server error during login: ' + err.message });
  }
}

async function getProfile(req, res) {
  try {
    const user = await db.get('SELECT id, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profile = null;
    if (user.role === 'patient') {
      profile = await db.get('SELECT * FROM patients WHERE user_id = ?', [user.id]);
    } else if (user.role === 'doctor') {
      profile = await db.get('SELECT * FROM doctors WHERE user_id = ?', [user.id]);
    }

    return res.json({
      user: {
        ...user,
        patient_id: profile && user.role === 'patient' ? profile.id : null,
        doctor_id: profile && user.role === 'doctor' ? profile.id : null,
        profile
      }
    });
  } catch (err) {
    console.error('Get Profile Error:', err);
    return res.status(500).json({ error: 'Server error fetching profile: ' + err.message });
  }
}

// Quick demo login list helper
function getDemoAccounts(req, res) {
  return res.json([
    { role: 'admin', label: 'Admin (Hospital Director)', email: 'admin@hospital.com', password: 'admin123' },
    { role: 'doctor', label: 'Dr. Sarah Jenkins (Cardiology)', email: 'dr.jenkins@hospital.com', password: 'doctor123' },
    { role: 'doctor', label: 'Dr. Michael Chen (Dermatology)', email: 'dr.chen@hospital.com', password: 'doctor123' },
    { role: 'patient', label: 'Alice Johnson (Patient)', email: 'alice@example.com', password: 'patient123' },
    { role: 'patient', label: 'David Miller (Patient)', email: 'david@example.com', password: 'patient123' }
  ]);
}

module.exports = {
  registerPatient,
  login,
  getProfile,
  getDemoAccounts
};
