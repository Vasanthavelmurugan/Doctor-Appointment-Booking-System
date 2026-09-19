const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting API Integration Tests ---');

  // 0. Static Frontend HTML
  const frontend = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/',
    method: 'GET'
  });
  console.log('0. Frontend Index HTML:', frontend.status, typeof frontend.raw === 'string' && frontend.raw.includes('CarePulse'));
  if (frontend.status !== 200) throw new Error('Frontend serving failed');

  // 1. Health check
  const health = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  console.log('1. Health Check:', health.status, health.data);
  if (health.status !== 200) throw new Error('Health check failed');

  // 2. Login as Admin
  const adminLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@hospital.com', password: 'admin123' });
  console.log('2. Admin Login:', adminLogin.status, adminLogin.data.user?.role);
  if (adminLogin.status !== 200) throw new Error('Admin login failed');
  const adminToken = adminLogin.data.token;

  // 3. Login as Patient
  const patientLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'alice@example.com', password: 'patient123' });
  console.log('3. Patient Login:', patientLogin.status, patientLogin.data.user?.role);
  if (patientLogin.status !== 200) throw new Error('Patient login failed');
  const patientToken = patientLogin.data.token;

  // 4. Get Doctors List
  const doctorsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/doctors',
    method: 'GET'
  });
  console.log('4. Doctors Count:', doctorsRes.data.doctors?.length);
  if (!doctorsRes.data.doctors || doctorsRes.data.doctors.length === 0) throw new Error('No doctors found');

  const doc = doctorsRes.data.doctors[0];

  // 5. Patient registers new account
  const randomEmail = `test.patient.${Date.now()}@example.com`;
  const registerRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: randomEmail,
    password: 'password123',
    name: 'Test Candidate',
    age: 32,
    gender: 'Male',
    phone: '+1 555-0199',
    address: '456 Test Way',
    medical_history: 'None'
  });
  console.log('5. New Patient Registration:', registerRes.status, registerRes.data.user?.name);
  if (registerRes.status !== 201) throw new Error('Registration failed');
  const newPatientToken = registerRes.data.token;

  // 6. Check Available Slots for next Monday
  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
  const dateStr = nextMonday.toISOString().split('T')[0];

  const slotsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/appointments/slots?doctor_id=${doc.id}&date=${dateStr}`,
    method: 'GET'
  });
  console.log(`6. Available slots for Doctor ${doc.name} on ${dateStr}:`, slotsRes.data.slots?.length);

  // 7. Book Appointment
  let slotTime = '09:00';
  if (slotsRes.data.slots && slotsRes.data.slots.length > 0) {
    const available = slotsRes.data.slots.find(s => s.is_available);
    if (available) slotTime = available.start_time;
  }

  const bookRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/appointments/book',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${newPatientToken}`
    }
  }, {
    doctor_id: doc.id,
    appointment_date: dateStr,
    start_time: slotTime,
    reason: 'Initial health screening'
  });
  console.log('7. Book Appointment:', bookRes.status, bookRes.data.message);
  if (bookRes.status !== 201) throw new Error('Booking failed: ' + JSON.stringify(bookRes.data));
  const createdApptId = bookRes.data.appointment.id;

  // 8. Prevent duplicate booking collision
  const collisionRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/appointments/book',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patientToken}`
    }
  }, {
    doctor_id: doc.id,
    appointment_date: dateStr,
    start_time: slotTime,
    reason: 'Trying duplicate slot'
  });
  console.log('8. Duplicate Booking Conflict (Expected 409):', collisionRes.status);
  if (collisionRes.status !== 409) throw new Error('Expected 409 on duplicate booking');

  // 9. Notifications check
  const notifRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${newPatientToken}` }
  });
  console.log('9. Patient Notifications count:', notifRes.data.notifications?.length);

  // 10. Cancel Appointment
  const cancelRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/appointments/${createdApptId}/cancel`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${newPatientToken}`
    }
  }, { cancellation_reason: 'Schedule conflict on my end' });
  console.log('10. Appointment Cancellation:', cancelRes.status, cancelRes.data.appointment?.status);
  if (cancelRes.status !== 200 || cancelRes.data.appointment?.status !== 'Cancelled') {
    throw new Error('Cancellation failed');
  }

  // 11. Admin Dashboard Stats
  const adminStatsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('11. Admin Stats:', adminStatsRes.status, adminStatsRes.data.stats);

  console.log('=========================================');
  console.log(' ALL 11 API INTEGRATION TESTS PASSED! ');
  console.log('=========================================');
}

module.exports = { runTests };

if (require.main === module) {
  runTests().catch(err => {
    console.error('Test Suite Failure:', err);
    process.exit(1);
  });
}
