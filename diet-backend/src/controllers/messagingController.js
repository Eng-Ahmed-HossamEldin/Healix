const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/response");
const pool = require("../config/db");

const getChatHistory = asyncHandler(async (req, res) => {
  const { partner_username } = req.params;
  const myUsername = req.user.username;

  const [rows] = await pool.query(
    `SELECT id, sender_username, receiver_username, message, created_at, is_read
     FROM doctor_patient_chat
     WHERE (sender_username = ? AND receiver_username = ?)
        OR (sender_username = ? AND receiver_username = ?)
     ORDER BY created_at ASC`,
    [myUsername, partner_username, partner_username, myUsername]
  );

  // Mark as read if I am the receiver
  await pool.query(
    `UPDATE doctor_patient_chat SET is_read = TRUE WHERE receiver_username = ? AND sender_username = ? AND is_read = FALSE`,
    [myUsername, partner_username]
  );

  return successResponse(res, rows, "Chat history fetched");
});

const getNotifications = asyncHandler(async (req, res) => {
  const myUsername = req.user.username;
  const [rows] = await pool.query(
    `SELECT id, message, is_read, created_at
     FROM notification
     WHERE user_username = ?
     ORDER BY created_at DESC LIMIT 50`,
    [myUsername]
  );
  return successResponse(res, rows, "Notifications fetched");
});

const markNotificationsRead = asyncHandler(async (req, res) => {
  const myUsername = req.user.username;
  await pool.query(
    `DELETE FROM notification WHERE user_username = ?`,
    [myUsername]
  );
  return successResponse(res, null, "Notifications deleted");
});

const sendMessage = asyncHandler(async (req, res) => {
  const { receiver_username, message } = req.body;
  const sender_username = req.user.username;

  if (!receiver_username || !message) {
    return errorResponse(res, "Receiver username and message are required", 400);
  }

  // Save message to DB
  const [result] = await pool.query(
    `INSERT INTO doctor_patient_chat (sender_username, receiver_username, message) VALUES (?, ?, ?)`,
    [sender_username, receiver_username, message]
  );

  const msgObj = {
    id: result.insertId,
    sender_username,
    receiver_username,
    message,
    created_at: new Date(),
    is_read: false
  };

  // Broadcast if Socket.io is globally available
  if (global.io) {
    const room = [sender_username, receiver_username].sort().join("_");
    global.io.to(room).emit("receive_message", msgObj);

    // Send a notification to the recipient
    const notifMsg = `New message from ${sender_username}: "${message.length > 40 ? message.slice(0, 40) + '…' : message}"`;
    const [notifResult] = await pool.query(
      `INSERT INTO notification (user_username, message) VALUES (?, ?)`,
      [receiver_username, notifMsg]
    );
    global.io.to(`notif_${receiver_username}`).emit("receive_notification", {
      id: notifResult.insertId,
      message: notifMsg,
      created_at: new Date(),
      is_read: false
    });
  }

  return successResponse(res, msgObj, "Message sent successfully", 201);
});

module.exports = {
  getChatHistory,
  getNotifications,
  markNotificationsRead,
  sendMessage
};
