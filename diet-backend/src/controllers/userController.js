const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/response");
const userModel = require("../models/userModel");
const doctorModel = require("../models/doctorModel");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await userModel.getUserProfileByUsername(req.user.username);
  return successResponse(res, profile, "Profile fetched");
});

const updateMyProfile = asyncHandler(async (req, res) => {
  await userModel.updateUserProfileByUsername(req.user.username, req.body);
  return successResponse(res, null, "Profile updated");
});

const getConditions = asyncHandler(async (req, res) => {
  const conditions = await userModel.getConditionsList();
  return successResponse(res, conditions, "Conditions fetched");
});

const subscribe = asyncHandler(async (req, res) => {
  const { tier, durationDays, doctor_username } = req.body;
  if (!['default','pro','doctor'].includes(tier)) {
    return errorResponse(res, 'Invalid tier', 400);
  }

  let assignedDoctor = null;
  if (tier === 'doctor') {
    if (!doctor_username) {
      return errorResponse(res, 'doctor_username is required for doctor tier', 400);
    }

    const doctor = await doctorModel.getDoctorProfileByUsername(doctor_username);
    if (!doctor) {
      return errorResponse(res, 'Selected doctor was not found', 404);
    }

    assignedDoctor = doctor_username;
  }

  await userModel.updateSubscription(req.user.username, tier, durationDays, null);

  if (tier === 'doctor') {
    await doctorModel.replaceUserDoctorLink(req.user.username, assignedDoctor);
    
    // Notify Doctor
    const msg = `User ${req.user.username} has requested you as their doctor.`;
    const pool = require('../config/db');
    const [result] = await pool.query(
      'INSERT INTO notification (user_username, message) VALUES (?, ?)',
      [assignedDoctor, msg]
    );
    if (global.io) {
      global.io.to(`notif_${assignedDoctor}`).emit('receive_notification', {
        id: result.insertId,
        message: msg,
        created_at: new Date(),
        is_read: false
      });
    }
  } else {
    await doctorModel.clearUserDoctorLinks(req.user.username);
  }

  return successResponse(res, null, "Subscription updated");
});

const changeMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return errorResponse(res, "Current and new passwords are required", 400);
  }

  const [rows] = await pool.query(
    'SELECT password_hash FROM user_account WHERE user_username = ?',
    [req.user.username]
  );
  if (!rows.length || !rows[0].password_hash) {
    return errorResponse(res, "User not found", 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!isMatch) {
    return errorResponse(res, "Incorrect current password", 401);
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    'UPDATE user_account SET password_hash = ? WHERE user_username = ?',
    [newHash, req.user.username]
  );
  return successResponse(res, null, "Password updated successfully");
});

const requestDoctor = asyncHandler(async (req, res) => {
  const { doctor_username } = req.body;
  if (!doctor_username) return errorResponse(res, 'doctor_username is required', 400);

  const doctor = await doctorModel.getDoctorProfileByUsername(doctor_username);
  if (!doctor) return errorResponse(res, 'Selected doctor was not found', 404);

  // Clear any existing user doctor links and insert new pending request
  await doctorModel.replaceUserDoctorLink(req.user.username, doctor_username);

  // Notify Doctor
  const msg = `User @${req.user.username} has requested you as their doctor.`;
  await pool.query('INSERT INTO notification (user_username, message) VALUES (?, ?)', [doctor_username, msg]);
  if (global.io) {
    global.io.to(`notif_${doctor_username}`).emit('receive_notification', { message: msg, created_at: new Date(), is_read: false });
  }

  return successResponse(res, null, "Doctor request sent");
});

// Direct doctor selection — only for users with an active 'doctor' subscription
// No pending step: the admin already approved the subscription, so the user
// can choose any available doctor and be immediately linked.
const selectDoctor = asyncHandler(async (req, res) => {
  const username = req.user.username;
  const { doctor_username } = req.body;
  if (!doctor_username) return errorResponse(res, 'doctor_username is required', 400);

  // Verify the user actually has an active doctor subscription
  const [rows] = await pool.query(
    `SELECT subscription_tier FROM user_account WHERE user_username = ?`, [username]
  );
  if (!rows.length || rows[0].subscription_tier !== 'doctor') {
    return errorResponse(res, 'You must have an active Doctor subscription to select a doctor', 403);
  }

  const doctor = await doctorModel.getDoctorProfileByUsername(doctor_username);
  if (!doctor) return errorResponse(res, 'Selected doctor was not found', 404);

  // Directly assign — link as 'accepted' and update assigned_doctor_username
  await pool.query(
    `DELETE FROM user_doctor_consultation WHERE user_username = ?`, [username]
  );
  await pool.query(
    `INSERT INTO user_doctor_consultation (user_username, doctor_username, status) VALUES (?, ?, 'accepted')`,
    [username, doctor_username]
  );
  await pool.query(
    `UPDATE user_account SET assigned_doctor_username = ? WHERE user_username = ?`,
    [doctor_username, username]
  );

  // Notify the doctor
  const msg = `User @${username} has been assigned to you as their doctor.`;
  await pool.query('INSERT INTO notification (user_username, message) VALUES (?, ?)', [doctor_username, msg]);
  if (global.io) {
    global.io.to(`notif_${doctor_username}`).emit('receive_notification', { message: msg, created_at: new Date(), is_read: false });
  }

  return successResponse(res, { assigned_doctor_username: doctor_username }, "Doctor selected successfully");
});

// Cancel doctor request
const cancelDoctorRequest = asyncHandler(async (req, res) => {
  const username = req.user.username;
  
  // Clear any existing doctor links
  await doctorModel.clearUserDoctorLinks(username);
  
  // Reset assigned doctor field just in case
  await pool.query(
    `UPDATE user_account SET assigned_doctor_username = NULL WHERE user_username = ?`,
    [username]
  );

  return successResponse(res, null, "Doctor request cancelled successfully");
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  getConditions,
  subscribe,
  requestDoctor,
  selectDoctor,
  cancelDoctorRequest
};
