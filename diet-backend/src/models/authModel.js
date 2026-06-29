const pool = require("../config/db");

const findUserByUsernameOrEmail = async (loginId) => {
  const [rows] = await pool.query(
    `SELECT user_username AS username, email, password_hash
     FROM user_account
     WHERE user_username = ? OR email = ?`,
    [loginId, loginId]
  );
  return rows[0] || null;
};

const findDoctorByUsernameOrEmail = async (loginId) => {
  const [rows] = await pool.query(
    `SELECT doctor_username AS username, email, password_hash
     FROM doctor
     WHERE doctor_username = ? OR email = ?`,
    [loginId, loginId]
  );
  return rows[0] || null;
};

const findAdminByUsernameOrEmail = async (loginId) => {
  const [rows] = await pool.query(
    `SELECT admin_username AS username, email, password_hash
     FROM admin_account
     WHERE admin_username = ? OR email = ?`,
    [loginId, loginId]
  );
  return rows[0] || null;
};

const userExists = async (user_username, email) => {
  const [rows] = await pool.query(
    `SELECT user_username FROM user_account WHERE user_username = ? OR email = ?`,
    [user_username, email]
  );
  return rows.length > 0;
};

const doctorExists = async (doctor_username, email) => {
  const [rows] = await pool.query(
    `SELECT doctor_username FROM doctor WHERE doctor_username = ? OR email = ?`,
    [doctor_username, email]
  );
  return rows.length > 0;
};

const createUser = async (data) => {
  const {
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
  } = data;

  await pool.query(
    `INSERT INTO user_account
    (user_username, email, phone_no, address, gender, job, dob, password_hash, first_name, last_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_username,
      email,
      phone_no || null,
      address || null,
      gender || null,
      job || null,
      dob || null,
      password_hash,
      first_name || null,
      last_name || null
    ]
  );
};

const createDoctor = async (data) => {
  const {
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
  } = data;

  await pool.query(
    `INSERT INTO doctor
    (doctor_username, email, phone_no, address, gender, dob, password_hash, first_name, last_name, certification)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      doctor_username,
      email,
      phone_no || null,
      address || null,
      gender || null,
      dob || null,
      password_hash,
      first_name || null,
      last_name || null,
      certification || null
    ]
  );
};

module.exports = {
  findUserByUsernameOrEmail,
  findDoctorByUsernameOrEmail,
  findAdminByUsernameOrEmail,
  userExists,
  doctorExists,
  createUser,
  createDoctor
};