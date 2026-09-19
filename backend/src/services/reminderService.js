const db = require('../config/db');

/**
 * Scan for upcoming scheduled appointments and generate reminder notifications
 * for appointments within the next 48 hours.
 */
async function checkAndSendReminders() {
  try {
    const now = new Date();
    const futureLimit = new Date();
    futureLimit.setHours(futureLimit.getHours() + 48);

    const todayStr = now.toISOString().split('T')[0];
    const futureLimitStr = futureLimit.toISOString().split('T')[0];

    // Find all scheduled appointments within today and futureLimit
    const appointments = await db.query(
      `SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.start_time,
              p.name as patient_name, p.user_id as patient_user_id,
              d.name as doctor_name, d.user_id as doctor_user_id, d.specialization
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.status = 'Scheduled'
         AND a.appointment_date >= ?
         AND a.appointment_date <= ?`,
      [todayStr, futureLimitStr]
    );

    let remindersGenerated = 0;

    for (const appt of appointments) {
      if (!appt.patient_user_id) continue;

      // Check if a reminder has already been created for this appointment
      const existing = await db.get(
        `SELECT id FROM notifications 
         WHERE user_id = ? AND appointment_id = ? AND type = 'reminder'`,
        [appt.patient_user_id, appt.id]
      );

      if (!existing) {
        const title = 'Upcoming Appointment Reminder';
        const message = `Reminder: You have an upcoming appointment with ${appt.doctor_name} (${appt.specialization}) on ${appt.appointment_date} at ${appt.start_time}.`;

        await db.run(
          `INSERT INTO notifications (user_id, appointment_id, title, message, type, is_read)
           VALUES (?, ?, ?, ?, 'reminder', 0)`,
          [appt.patient_user_id, appt.id, title, message]
        );
        remindersGenerated++;
      }
    }

    if (remindersGenerated > 0) {
      console.log(`[ReminderService] Generated ${remindersGenerated} new appointment reminder(s).`);
    }
    return remindersGenerated;
  } catch (err) {
    console.error('[ReminderService Error]:', err.message);
    return 0;
  }
}

// Start periodic interval (checks every 10 minutes)
function startReminderWorker(intervalMs = 10 * 60 * 1000) {
  // Run once on startup
  setTimeout(() => {
    checkAndSendReminders();
  }, 3000);

  // Then periodically
  const interval = setInterval(checkAndSendReminders, intervalMs);
  return interval;
}

module.exports = {
  checkAndSendReminders,
  startReminderWorker
};
