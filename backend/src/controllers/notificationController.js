const db = require('../config/db');
const { checkAndSendReminders } = require('../services/reminderService');

async function getMyNotifications(req, res) {
  try {
    const notifications = await db.query(
      `SELECT n.*, a.appointment_date, a.start_time, d.name as doctor_name
       FROM notifications n
       LEFT JOIN appointments a ON n.appointment_id = a.id
       LEFT JOIN doctors d ON a.doctor_id = d.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return res.json({
      notifications,
      unread_count: unreadCount
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ error: 'Failed to retrieve notifications: ' + err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;

    if (id === 'all') {
      await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    } else {
      await db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
    }

    return res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return res.status(500).json({ error: 'Failed to mark as read: ' + err.message });
  }
}

async function triggerReminderCheck(req, res) {
  try {
    const count = await checkAndSendReminders();
    return res.json({ message: `Reminder check completed. Generated ${count} new reminders.`, count });
  } catch (err) {
    console.error('Error checking reminders:', err);
    return res.status(500).json({ error: 'Reminder check failed: ' + err.message });
  }
}

module.exports = {
  getMyNotifications,
  markAsRead,
  triggerReminderCheck
};
