const bcrypt = require("bcrypt");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/response");
const { signToken } = require("../utils/jwt");
const authModel = require("../models/authModel");
const userModel = require("../models/userModel");
const doctorModel = require("../models/doctorModel");

const registerUser = asyncHandler(async (req, res) => {
  const {
    user_username,
    email,
    phone_no,
    address,
    gender,
    job,
    dob,
    password,
    first_name,
    last_name
  } = req.body;

  const exists = await authModel.userExists(user_username, email);
  if (exists) {
    return errorResponse(res, "Username or email already exists", 409);
  }

  const password_hash = await bcrypt.hash(password, 10);

  await authModel.createUser({
    user_username,
    email,
    phone_no,
    address,
    gender,
    job,
    dob,
    password_hash,
    first_name,
    last_name
  });

  return successResponse(res, null, "User registered successfully", 201);
});

const registerDoctor = asyncHandler(async (req, res) => {
  const {
    doctor_username,
    email,
    phone_no,
    address,
    gender,
    dob,
    password,
    first_name,
    last_name,
    certification
  } = req.body;

  const exists = await authModel.doctorExists(doctor_username, email);
  if (exists) {
    return errorResponse(res, "Username or email already exists", 409);
  }

  const password_hash = await bcrypt.hash(password, 10);

  await authModel.createDoctor({
    doctor_username,
    email,
    phone_no,
    address,
    gender,
    dob,
    password_hash,
    first_name,
    last_name,
    certification
  });

  // Notify admin for approval
  const { sendNotification } = require('../utils/notificationService');
  await sendNotification('admin', `New doctor registered: ${doctor_username}. Please review their profile for approval.`);

  return successResponse(res, null, "Doctor registered successfully (pending admin review)", 201);
});

const login = asyncHandler(async (req, res) => {
  const { loginId, password, role } = req.body;

  let account = null;

  if (role === 'user') {
    account = await authModel.findUserByUsernameOrEmail(loginId);
  } else if (role === 'doctor') {
    account = await authModel.findDoctorByUsernameOrEmail(loginId);
  } else if (role === 'admin') {
    account = await authModel.findAdminByUsernameOrEmail(loginId);
  }

  if (!account) {
    return errorResponse(res, 'Invalid credentials', 401);
  }

  const isMatch = await bcrypt.compare(password, account.password_hash);

  if (!isMatch) {
    return errorResponse(res, 'Invalid credentials', 401);
  }

  const token = signToken({
    username: account.username,
    role
  });

  return successResponse(
    res,
    { token, role, username: account.username },
    'Login successful'
  );
});

const me = asyncHandler(async (req, res) => {
  if (req.user.role === 'user') {
    let profile = await userModel.getUserProfileByUsername(req.user.username);

    // ── Auto-downgrade expired subscriptions ──────────────────────────────
    if (
      profile &&
      profile.subscription_tier !== 'default' &&
      profile.subscription_end_date &&
      new Date(profile.subscription_end_date) < new Date()
    ) {
      const pool = require('../config/db');
      await pool.query(
        `UPDATE user_account SET subscription_tier='default', subscription_end_date=NULL, assigned_doctor_username=NULL WHERE user_username=?`,
        [req.user.username]
      );
      profile.subscription_tier = 'default';
      profile.subscription_end_date = null;
      profile.assigned_doctor_username = null;
    }

    if (profile) profile.username = profile.user_username;
    return successResponse(res, profile, 'User profile fetched');
  }
  if (req.user.role === 'doctor') {
    const profile = await doctorModel.getDoctorProfileByUsername(req.user.username);
    if (profile) profile.username = profile.doctor_username;
    return successResponse(res, profile, 'Doctor profile fetched');
  }
  if (req.user.role === 'admin') {
    return successResponse(res, { username: req.user.username, role: 'admin' }, 'Admin profile fetched');
  }
  return errorResponse(res, 'Invalid role', 400);
});

module.exports = {
  registerUser,
  registerDoctor,
  login,
  me
};