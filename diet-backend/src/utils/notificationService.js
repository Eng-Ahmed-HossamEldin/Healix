const pool = require('../config/db');

// ── Send a notification (persists + emits via Socket.IO) ─────────────────────
async function sendNotification(username, message) {
  try {
    const [result] = await pool.query(
      'INSERT INTO notification (user_username, message) VALUES (?, ?)',
      [username, message]
    );
    if (global.io) {
      global.io.to(`notif_${username}`).emit('receive_notification', {
        id: result.insertId,
        message,
        created_at: new Date(),
        is_read: false
      });
    }
  } catch (e) {
    console.error('sendNotification error:', e.message);
  }
}

module.exports = { sendNotification };
