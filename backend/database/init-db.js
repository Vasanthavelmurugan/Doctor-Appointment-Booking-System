const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

async function initializeDatabase() {
  await db.initDatabaseConnection();
  const engine = db.getActiveEngine();
  console.log(`[InitDB] Running schema setup on [${engine.toUpperCase()}]...`);

  if (engine === 'sqlite') {
    // SQLite table creations
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'patient',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NULL,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT DEFAULT 'Not Specified',
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT NULL,
        medical_history TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        specialization TEXT NOT NULL,
        experience_years INTEGER NOT NULL DEFAULT 1,
        consultation_fee REAL NOT NULL DEFAULT 50.00,
        bio TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS doctor_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        day_of_week TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        slot_duration INTEGER NOT NULL DEFAULT 30,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE CASCADE
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        appointment_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Scheduled',
        reason TEXT NOT NULL,
        cancellation_reason TEXT NULL,
        notes TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE CASCADE
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        appointment_id INTEGER NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'system',
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL
      )
    `);
  }

  // Check if users exist to seed
  const existingUsers = await db.get('SELECT COUNT(*) as count FROM users');
  const userCount = existingUsers && existingUsers.count !== undefined ? Number(existingUsers.count) : 0;

  if (Number(userCount) === 0) {
    console.log('[InitDB] Seeding default users, doctors, and patients...');

    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin123', salt);
    const doctorHash = await bcrypt.hash('doctor123', salt);
    const patientHash = await bcrypt.hash('patient123', salt);

    // 1. Seed Users
    const uAdmin = await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [
      'admin@hospital.com', adminHash, 'admin'
    ]);
    const uDrJenkins = await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [
      'dr.jenkins@hospital.com', doctorHash, 'doctor'
    ]);
    const uDrChen = await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [
      'dr.chen@hospital.com', doctorHash, 'doctor'
    ]);
    const uDrTaylor = await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [
      'dr.taylor@hospital.com', doctorHash, 'doctor'
    ]);
    const uDrWilliams = await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [
      'dr.williams@hospital.com', doctorHash, 'doctor'
    ]);
    const uAlice = await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [
      'alice@example.com', patientHash, 'patient'
    ]);
    const uDavid = await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [
      'david@example.com', patientHash, 'patient'
    ]);

    // 2. Seed Doctors
    const d1 = await db.run(
      'INSERT INTO doctors (user_id, name, email, phone, specialization, experience_years, consultation_fee, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [uDrJenkins.insertId, 'Dr. Sarah Jenkins', 'dr.jenkins@hospital.com', '+1 (555) 234-5678', 'Cardiology', 12, 120.00, 'Board-certified cardiologist specializing in preventive cardiology, hypertension, and heart disease management.']
    );
    const d2 = await db.run(
      'INSERT INTO doctors (user_id, name, email, phone, specialization, experience_years, consultation_fee, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [uDrChen.insertId, 'Dr. Michael Chen', 'dr.chen@hospital.com', '+1 (555) 345-6789', 'Dermatology', 8, 95.00, 'Clinical dermatologist focused on skin cancer screening, acne therapeutics, and autoimmune skin conditions.']
    );
    const d3 = await db.run(
      'INSERT INTO doctors (user_id, name, email, phone, specialization, experience_years, consultation_fee, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [uDrTaylor.insertId, 'Dr. Emily Taylor', 'dr.taylor@hospital.com', '+1 (555) 456-7890', 'Pediatrics', 10, 85.00, 'Compassionate pediatrician dedicated to newborn care, childhood immunology, and developmental milestone tracking.']
    );
    const d4 = await db.run(
      'INSERT INTO doctors (user_id, name, email, phone, specialization, experience_years, consultation_fee, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [uDrWilliams.insertId, 'Dr. Robert Williams', 'dr.williams@hospital.com', '+1 (555) 567-8901', 'Orthopedics', 15, 140.00, 'Specialist in sports medicine, arthroscopy, joint reconstruction, and spinal rehabilitation.']
    );

    // 3. Seed Patients
    const p1 = await db.run(
      'INSERT INTO patients (user_id, name, age, gender, phone, email, address, medical_history) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [uAlice.insertId, 'Alice Johnson', 29, 'Female', '+1 (555) 987-6543', 'alice@example.com', '742 Evergreen Terrace, Springfield', 'Mild seasonal asthma; no known drug allergies.']
    );
    const p2 = await db.run(
      'INSERT INTO patients (user_id, name, age, gender, phone, email, address, medical_history) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [uDavid.insertId, 'David Miller', 46, 'Male', '+1 (555) 876-5432', 'david@example.com', '123 Maple Street, Metropolis', 'Hypertension under management (Lisinopril 10mg). Penicillin allergy.']
    );

    // 4. Seed Slots for each doctor across days of week
    const slots = [
      // Dr. Jenkins (Mon, Wed, Fri)
      { docId: d1.insertId, day: 'Monday', start: '09:00', end: '13:00' },
      { docId: d1.insertId, day: 'Wednesday', start: '14:00', end: '18:00' },
      { docId: d1.insertId, day: 'Friday', start: '09:00', end: '13:00' },
      // Dr. Chen (Tue, Thu, Sat)
      { docId: d2.insertId, day: 'Tuesday', start: '10:00', end: '15:00' },
      { docId: d2.insertId, day: 'Thursday', start: '13:00', end: '17:00' },
      { docId: d2.insertId, day: 'Saturday', start: '09:00', end: '13:00' },
      // Dr. Taylor (Mon, Wed, Fri)
      { docId: d3.insertId, day: 'Monday', start: '08:30', end: '12:30' },
      { docId: d3.insertId, day: 'Wednesday', start: '08:30', end: '12:30' },
      { docId: d3.insertId, day: 'Friday', start: '13:30', end: '17:30' },
      // Dr. Williams (Tue, Thu)
      { docId: d4.insertId, day: 'Tuesday', start: '14:00', end: '18:00' },
      { docId: d4.insertId, day: 'Thursday', start: '09:00', end: '14:00' },
    ];

    for (const s of slots) {
      await db.run(
        'INSERT INTO doctor_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active) VALUES (?, ?, ?, ?, 30, 1)',
        [s.docId, s.day, s.start, s.end]
      );
    }

    // 5. Seed sample appointments
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const past = new Date(today);
    past.setDate(today.getDate() - 3);

    const fmt = d => d.toISOString().split('T')[0];

    const appt1 = await db.run(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, status, reason, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [p1.insertId, d1.insertId, fmt(tomorrow), '09:30', '10:00', 'Scheduled', 'Routine cardiac health checkup and blood pressure assessment', 'Patient requested morning slot']
    );

    const appt2 = await db.run(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, status, reason, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [p2.insertId, d2.insertId, fmt(past), '10:30', '11:00', 'Completed', 'Consultation regarding rash on lower forearm', 'Prescribed topical hydrocortisone ointment']
    );

    // 6. Seed sample notifications/reminders
    await db.run(
      'INSERT INTO notifications (user_id, appointment_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)',
      [uAlice.insertId, appt1.insertId, 'Upcoming Appointment Reminder', `Reminder: You have an appointment with Dr. Sarah Jenkins on ${fmt(tomorrow)} at 09:30.`, 'reminder', 0]
    );

    await db.run(
      'INSERT INTO notifications (user_id, appointment_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)',
      [uAlice.insertId, appt1.insertId, 'Appointment Confirmed', `Your appointment with Dr. Sarah Jenkins on ${fmt(tomorrow)} at 09:30 has been booked successfully.`, 'booking', 1]
    );

    console.log('[InitDB] Seed data successfully applied.');
  } else {
    console.log(`[InitDB] Database already initialized (${userCount} users found).`);
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('[InitDB] Finished.');
      process.exit(0);
    })
    .catch(err => {
      console.error('[InitDB] Error:', err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
