const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/response");
const doctorModel = require("../models/doctorModel");
const userModel = require("../models/userModel");
const requirementModel = require("../models/requirementModel");
const medicalModel = require("../models/medicalModel");
const planModel = require("../models/planModel");
const { sendNotification } = require("../utils/notificationService");

const getDoctorProfile = asyncHandler(async (req, res) => {
  const profile = await doctorModel.getDoctorProfileByUsername(req.user.username);
  return successResponse(res, profile, "Doctor profile fetched");
});

const searchUsers = asyncHandler(async (req, res) => {
  const search = req.query.search || "";
  const users = await doctorModel.searchUsers(search, req.user.username);
  return successResponse(res, users, "Patients fetched");
});

const linkUserDoctor = asyncHandler(async (req, res) => {
  const { user_username } = req.body;
  await doctorModel.linkUserDoctor(user_username, req.user.username);
  return successResponse(res, null, "User linked to doctor");
});

const getUserCase = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const linked = await doctorModel.isDoctorLinkedToUser(req.user.username, username);
  if (!linked) return errorResponse(res, "Doctor is not linked to this user", 403);

  const user = await userModel.getUserProfileByUsername(username);
  const requirements = await requirementModel.getRequirementsByUsername(username);
  const medical_history = await medicalModel.getMedicalHistoryByUsername(username);
  const plans = await planModel.getPlansByUsername(username);
  const exercise_plans = await planModel.getExercisePlansByUsername(username);

  // Medical records with files
  const pool = require('../config/db');
  const [medical_records] = await pool.query(
    `SELECT record_id, condition_name, condition_type, extra_info, file_name, file_type, file_path, created_at
     FROM user_medical_record WHERE user_username=? ORDER BY created_at DESC`,
    [username]
  );

  return successResponse(
    res,
    { user, requirements, medical_history, medical_records, plans, exercise_plans },
    "User case fetched"
  );
});

// ── Doctor updates patient targets (macros / sleep / water) ──────────────────
const updatePatientTargets = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const linked = await doctorModel.isDoctorLinkedToUser(req.user.username, username);
  if (!linked) return errorResponse(res, "Not authorized for this patient", 403);

  const { target_calories, target_protein_g, target_carbs_g, target_fat_g, sleep_hours_target, water_cups_target } = req.body;
  await requirementModel.patchTargetsByUsername(username, {
    target_calories, target_protein_g, target_carbs_g, target_fat_g, sleep_hours_target, water_cups_target
  });

  // Notify the patient
  const parts = [];
  if (target_calories) parts.push(`${target_calories} kcal`);
  if (sleep_hours_target) parts.push(`${sleep_hours_target}h sleep`);
  if (water_cups_target) parts.push(`${water_cups_target} cups water`);
  const detail = parts.length ? ` (${parts.join(', ')})` : '';
  await sendNotification(username, `Dr. ${req.user.username} updated your daily health targets${detail}.`);

  return successResponse(res, null, "Patient targets updated");
});

const listAllDoctors = asyncHandler(async (req, res) => {
  const db = require('../config/db');
  const [rows] = await db.query(
    `SELECT doctor_username, first_name, last_name, address, certification FROM doctor ORDER BY first_name ASC`
  );
  return successResponse(res, rows, 'Doctors listed');
});

const getRequests = asyncHandler(async (req, res) => {
  const requests = await doctorModel.getPendingRequests(req.user.username);
  return successResponse(res, requests, 'Requests fetched');
});

const respondRequest = asyncHandler(async (req, res) => {
  const { user_username, status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return errorResponse(res, 'Invalid status', 400);
  }

  await doctorModel.updateRequestStatus(req.user.username, user_username, status);

  if (status === 'accepted') {
    const pool = require('../config/db');
    await pool.query('UPDATE user_account SET assigned_doctor_username = ? WHERE user_username = ?', [req.user.username, user_username]);
  } else {
    await doctorModel.clearUserDoctorLinks(user_username);
  }

  const msg = `Dr. ${req.user.username} has ${status} your subscription request.`;
  await sendNotification(user_username, msg);

  return successResponse(res, null, `Request ${status}`);
});

const updateDoctorProfile = asyncHandler(async (req, res) => {
  await doctorModel.updateDoctorProfileByUsername(req.user.username, req.body);
  return successResponse(res, null, "Profile updated");
});

const bcrypt = require("bcrypt");

const updateDoctorPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return errorResponse(res, "Current and new passwords are required", 400);
  }
  const pool = require('../config/db');
  const [rows] = await pool.query('SELECT password_hash FROM doctor WHERE doctor_username = ?', [req.user.username]);
  if (!rows.length || !rows[0].password_hash) return errorResponse(res, "Doctor not found", 404);

  const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!isMatch) return errorResponse(res, "Incorrect current password", 401);

  const newHash = await bcrypt.hash(newPassword, 10);
  await doctorModel.updateDoctorPassword(req.user.username, newHash);
  return successResponse(res, null, "Password updated successfully");
});

const getUserLogs = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const linked = await doctorModel.isDoctorLinkedToUser(req.user.username, username);
  if (!linked) return errorResponse(res, "Doctor is not linked to this user", 403);

  const pool = require('../config/db');
  const [food] = await pool.query(
    `SELECT * FROM food_log WHERE user_username = ? ORDER BY logged_at DESC`,
    [username]
  );
  const [sleep] = await pool.query(
    `SELECT * FROM sleep_log WHERE user_username = ? ORDER BY log_date DESC`,
    [username]
  );
  const [water] = await pool.query(
    `SELECT * FROM water_log WHERE user_username = ? ORDER BY log_date DESC`,
    [username]
  );

  const [weight] = await pool.query(
    `SELECT * FROM weight_log WHERE user_username = ? ORDER BY logged_at DESC`,
    [username]
  );

  return successResponse(res, { food, sleep, water, weight }, "User logs fetched");
});

module.exports = {
  getDoctorProfile, searchUsers, linkUserDoctor, getUserCase,
  updatePatientTargets, listAllDoctors, getRequests, respondRequest,
  updateDoctorProfile, updateDoctorPassword, getUserLogs
};