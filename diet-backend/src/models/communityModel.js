const pool = require("../config/db");

// ─── HABITS ───────────────────────────────────────────────────────────────────

const getHabits = async (username) => {
  const [habits] = await pool.query(
    `SELECT h.*, 
     (SELECT COUNT(*) FROM habit_log hl WHERE hl.habit_id = h.habit_id AND hl.completed_date = CURDATE()) as completed_today,
     (SELECT COUNT(*) FROM habit_log hl WHERE hl.habit_id = h.habit_id AND hl.completed_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as streak_week
     FROM habit h WHERE h.user_username = ? ORDER BY h.created_at DESC`,
    [username]
  );
  return habits;
};

const createHabit = async (username, data) => {
  const { habit_name, description, frequency, reminder_time, color, icon } = data;
  const [result] = await pool.query(
    `INSERT INTO habit (user_username, habit_name, description, frequency, reminder_time, color, icon)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [username, habit_name, description || null, frequency || "daily", reminder_time || null, color || "#4DC3E8", icon || "star"]
  );
  return result.insertId;
};

const deleteHabit = async (habitId, username) => {
  const [result] = await pool.query(
    `DELETE FROM habit WHERE habit_id = ? AND user_username = ?`,
    [habitId, username]
  );
  return result.affectedRows > 0;
};

const completeHabit = async (habitId, username) => {
  const today = new Date().toISOString().split("T")[0];
  await pool.query(
    `INSERT IGNORE INTO habit_log (habit_id, user_username, completed_date) VALUES (?, ?, ?)`,
    [habitId, username, today]
  );
};

const uncompleteHabit = async (habitId, username) => {
  const today = new Date().toISOString().split("T")[0];
  await pool.query(
    `DELETE FROM habit_log WHERE habit_id = ? AND user_username = ? AND completed_date = ?`,
    [habitId, username, today]
  );
};

const getHabitHistory = async (habitId, username) => {
  const [rows] = await pool.query(
    `SELECT completed_date FROM habit_log WHERE habit_id = ? AND user_username = ? ORDER BY completed_date DESC LIMIT 30`,
    [habitId, username]
  );
  return rows;
};

// ─── FASTING ─────────────────────────────────────────────────────────────────

const getActiveFasting = async (username) => {
  const [rows] = await pool.query(
    `SELECT * FROM fasting_session WHERE user_username = ? AND status = 'active' ORDER BY start_time DESC LIMIT 1`,
    [username]
  );
  return rows[0] || null;
};

const getFastingHistory = async (username, limit = 10) => {
  const [rows] = await pool.query(
    `SELECT * FROM fasting_session WHERE user_username = ? ORDER BY start_time DESC LIMIT ?`,
    [username, limit]
  );
  return rows;
};

const startFasting = async (username, data) => {
  const { protocol, target_hours } = data;
  // End any active session first
  await pool.query(
    `UPDATE fasting_session SET status = 'broken', end_time = NOW(), 
     actual_hours = TIMESTAMPDIFF(MINUTE, start_time, NOW()) / 60
     WHERE user_username = ? AND status = 'active'`,
    [username]
  );
  const [result] = await pool.query(
    `INSERT INTO fasting_session (user_username, protocol, start_time, target_hours, status)
     VALUES (?, ?, NOW(), ?, 'active')`,
    [username, protocol || "16:8", target_hours || 16]
  );
  return result.insertId;
};

const endFasting = async (username) => {
  const [result] = await pool.query(
    `UPDATE fasting_session SET status = 'completed', end_time = NOW(),
     actual_hours = TIMESTAMPDIFF(MINUTE, start_time, NOW()) / 60
     WHERE user_username = ? AND status = 'active'`,
    [username]
  );
  return result.affectedRows > 0;
};

// ─── COMMUNITY ───────────────────────────────────────────────────────────────

const getPosts = async (limit = 20, offset = 0) => {
  const [rows] = await pool.query(
    `SELECT cp.*, CONCAT(ua.first_name, ' ', ua.last_name) as display_name
     FROM community_post cp
     JOIN user_account ua ON cp.user_username = ua.user_username
     ORDER BY cp.created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
};

const createPost = async (username, data) => {
  const { content, post_type } = data;
  const [result] = await pool.query(
    `INSERT INTO community_post (user_username, content, post_type) VALUES (?, ?, ?)`,
    [username, content, post_type || "motivation"]
  );
  return result.insertId;
};

const likePost = async (postId) => {
  await pool.query(`UPDATE community_post SET likes = likes + 1 WHERE post_id = ?`, [postId]);
};

const getChallenges = async () => {
  const [rows] = await pool.query(
    `SELECT * FROM challenge ORDER BY start_date DESC`
  );
  return rows;
};

const joinChallenge = async (challengeId, username) => {
  await pool.query(
    `INSERT IGNORE INTO challenge_participant (challenge_id, user_username) VALUES (?, ?)`,
    [challengeId, username]
  );
  await pool.query(
    `UPDATE challenge SET participant_count = participant_count + 1 WHERE challenge_id = ?`,
    [challengeId]
  );
};

const getMyChallenges = async (username) => {
  const [rows] = await pool.query(
    `SELECT c.*, cp.progress, cp.joined_at FROM challenge c
     JOIN challenge_participant cp ON c.challenge_id = cp.challenge_id
     WHERE cp.user_username = ?`,
    [username]
  );
  return rows;
};

module.exports = {
  getHabits, createHabit, deleteHabit, completeHabit, uncompleteHabit, getHabitHistory,
  getActiveFasting, getFastingHistory, startFasting, endFasting,
  getPosts, createPost, likePost, getChallenges, joinChallenge, getMyChallenges,
};
