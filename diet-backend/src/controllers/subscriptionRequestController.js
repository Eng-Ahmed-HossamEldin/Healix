const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');
const pool = require('../config/db');
const doctorModel = require('../models/doctorModel');

// User: request a plan upgrade
const requestUpgrade = asyncHandler(async (req, res) => {
  const { requested_tier, doctor_username } = req.body;
  const username = req.user.username;

  if (!['pro', 'doctor'].includes(requested_tier)) {
    return errorResponse(res, 'Invalid tier. Must be pro or doctor.', 400);
  }
  // doctor_username is optional — admin will assign a doctor when approving

  // Check for existing pending request
  const [pending] = await pool.query(
    `SELECT id FROM subscription_requests WHERE user_username = ? AND status = 'pending'`,
    [username]
  );
  if (pending.length > 0) {
    return errorResponse(res, 'You already have a pending upgrade request. Please wait for admin review.', 409);
  }

  // Insert request
  await pool.query(
    `INSERT INTO subscription_requests (user_username, requested_tier, doctor_username) VALUES (?, ?, ?)`,
    [username, requested_tier, doctor_username || null]
  );

  // Notify all admins
  const [admins] = await pool.query(`SELECT admin_username FROM admin_account`);
  const tierLabel = requested_tier === 'pro' ? 'AI Pro' : 'Doctor';
  const msg = `User @${username} has requested an upgrade to the ${tierLabel} plan.`;
  for (const admin of admins) {
    await pool.query(
      `INSERT INTO notification (user_username, message) VALUES (?, ?)`,
      [admin.admin_username, msg]
    );
    if (global.io) {
      global.io.to(`notif_${admin.admin_username}`).emit('receive_notification', {
        message: msg,
        created_at: new Date(),
        is_read: false
      });
    }
  }

  return successResponse(res, null, 'Upgrade request submitted. Admin will review shortly.');
});

// User: get my current upgrade request status
const getMyRequest = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, requested_tier, doctor_username, status, admin_note, created_at, updated_at
     FROM subscription_requests
     WHERE user_username = ?
     ORDER BY created_at DESC LIMIT 1`,
    [req.user.username]
  );
  return successResponse(res, rows[0] || null, 'Request fetched');
});

// Admin: get all requests
const getAllRequests = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT sr.*, ua.first_name, ua.last_name, ua.email, ua.subscription_tier as current_tier
     FROM subscription_requests sr
     JOIN user_account ua ON ua.user_username = sr.user_username
     ORDER BY sr.created_at DESC`
  );
  return successResponse(res, rows, 'Requests fetched');
});

// Admin: approve or reject a request
const reviewRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, admin_note } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return errorResponse(res, 'action must be approve or reject', 400);
  }

  const [rows] = await pool.query(`SELECT * FROM subscription_requests WHERE id = ?`, [id]);
  if (!rows.length) return errorResponse(res, 'Request not found', 404);
  const request = rows[0];
  if (request.status !== 'pending') {
    return errorResponse(res, 'This request has already been reviewed.', 409);
  }

  const status = action === 'approve' ? 'approved' : 'rejected';
  await pool.query(
    `UPDATE subscription_requests SET status = ?, admin_note = ?, updated_at = NOW() WHERE id = ?`,
    [status, admin_note || null, id]
  );

  const tierLabel = request.requested_tier === 'pro' ? 'AI Pro' : 'Doctor';
  let userMsg;

  if (action === 'approve') {
    // Activate the subscription
    await pool.query(
      `UPDATE user_account SET subscription_tier = ?, subscription_end_date = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE user_username = ?`,
      [request.requested_tier, request.user_username]
    );

    userMsg = `Your upgrade request to the ${tierLabel} plan has been approved! Your subscription is now active.`;
  } else {
    userMsg = `Your upgrade request to the ${tierLabel} plan was not approved.${admin_note ? ' Reason: ' + admin_note : ' Please contact support for more information.'}`;
  }

  // Notify the user
  await pool.query(`INSERT INTO notification (user_username, message) VALUES (?, ?)`, [request.user_username, userMsg]);
  if (global.io) {
    global.io.to(`notif_${request.user_username}`).emit('receive_notification', { message: userMsg, created_at: new Date(), is_read: false });
  }

  return successResponse(res, null, `Request ${status}`);
});

module.exports = { requestUpgrade, getMyRequest, getAllRequests, reviewRequest };
