const pool = require("../config/db");

const getDoctorProfileByUsername = async (username) => {
  const [rows] = await pool.query(
    `SELECT doctor_username, email, phone_no, address, gender, dob, first_name, last_name, certification
     FROM doctor
     WHERE doctor_username = ?`,
    [username]
  );
  return rows[0] || null;
};

const searchUsers = async (search, doctor_username = null) => {
  if (doctor_username) {
    const [rows] = await pool.query(
      `SELECT u.user_username, u.email, u.phone_no, u.first_name, u.last_name
       FROM user_account u
       JOIN user_doctor_consultation c ON u.user_username = c.user_username
       WHERE c.doctor_username = ?
         AND c.status = 'accepted'
         AND (u.user_username LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)
       ORDER BY u.first_name ASC`,
      [doctor_username, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]
    );
    return rows;
  }

  const [rows] = await pool.query(
    `SELECT user_username, email, phone_no, first_name, last_name
     FROM user_account
     WHERE user_username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?`,
    [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]
  );
  return rows;
};

const linkUserDoctor = async (user_username, doctor_username, status = 'pending') => {
  await pool.query(
    `INSERT IGNORE INTO user_doctor_consultation (user_username, doctor_username, status)
     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?, created_at = NOW()`,
    [user_username, doctor_username, status, status]
  );
};

const clearUserDoctorLinks = async (user_username) => {
  await pool.query(
    `DELETE FROM user_doctor_consultation WHERE user_username = ?`,
    [user_username]
  );
};

const replaceUserDoctorLink = async (user_username, doctor_username) => {
  await clearUserDoctorLinks(user_username);
  await linkUserDoctor(user_username, doctor_username);
};

const isDoctorLinkedToUser = async (doctor_username, user_username) => {
  const [rows] = await pool.query(
    `SELECT user_username
     FROM user_doctor_consultation
     WHERE doctor_username = ? AND user_username = ? AND status = 'accepted'`,
    [doctor_username, user_username]
  );
  return rows.length > 0;
};

const searchDoctorsByAddress = async (address_keyword) => {
  const [rows] = await pool.query(
    `SELECT doctor_username, first_name, last_name, address, certification
     FROM doctor
     WHERE address LIKE ?`,
    [`%${address_keyword}%`]
  );
  return rows;
};

const getPendingRequests = async (doctor_username) => {
  const [rows] = await pool.query(
    `SELECT c.user_username, c.status, c.created_at, u.first_name, u.last_name, u.email 
     FROM user_doctor_consultation c 
     JOIN user_account u ON c.user_username = u.user_username 
     WHERE c.doctor_username = ? AND c.status = 'pending' 
     ORDER BY c.created_at DESC`,
    [doctor_username]
  );
  return rows;
};

const updateRequestStatus = async (doctor_username, user_username, status) => {
  await pool.query(
    `UPDATE user_doctor_consultation SET status = ? WHERE doctor_username = ? AND user_username = ?`,
    [status, doctor_username, user_username]
  );
};

const updateDoctorProfileByUsername = async (username, data) => {
  const { first_name, last_name, phone_no, address, gender, dob, certification } = data;
  await pool.query(
    `UPDATE doctor SET 
      first_name = ?, last_name = ?, phone_no = ?, address = ?, gender = ?, dob = ?, certification = ?, updated_at = NOW()
     WHERE doctor_username = ?`,
    [first_name || null, last_name || null, phone_no || null, address || null, gender || null, dob || null, certification || null, username]
  );
};

const updateDoctorPassword = async (username, newHash) => {
  await pool.query(
    `UPDATE doctor SET password_hash = ?, updated_at = NOW() WHERE doctor_username = ?`,
    [newHash, username]
  );
};

module.exports = {
  getDoctorProfileByUsername,
  searchUsers,
  linkUserDoctor,
  clearUserDoctorLinks,
  replaceUserDoctorLink,
  isDoctorLinkedToUser,
  searchDoctorsByAddress,
  getPendingRequests,
  updateRequestStatus,
  updateDoctorProfileByUsername,
  updateDoctorPassword
};
