const pool = require("../config/db");

const getUserProfileByUsername = async (username) => {
  const [rows] = await pool.query(
    `SELECT user_username, email, phone_no, address, gender, job, dob, first_name, last_name,
            subscription_tier, subscription_end_date, assigned_doctor_username
     FROM user_account
     WHERE user_username = ?`,
    [username]
  );
  
  if (!rows[0]) return null;
  const user = rows[0];

  // Get the most recent consultation (pending first, then others)
  const [consult] = await pool.query(
    `SELECT c.status, c.doctor_username, d.first_name, d.last_name
     FROM user_doctor_consultation c
     LEFT JOIN doctor d ON c.doctor_username = d.doctor_username
     WHERE c.user_username = ? ORDER BY FIELD(c.status,'pending','accepted','rejected') ASC, c.created_at DESC LIMIT 1`,
    [username]
  );
  user.doctor_request_status = consult[0]?.status || null;
  user.pending_doctor_username = consult[0]?.doctor_username || null;
  user.pending_doctor_name = consult[0]?.first_name ? `Dr. ${consult[0].first_name} ${consult[0].last_name || ''}`.trim() : null;

  const [conds] = await pool.query(
    `SELECT c.condition_id, c.name, c.description 
     FROM conditions c
     JOIN user_conditions uc ON c.condition_id = uc.condition_id
     WHERE uc.user_username = ?`,
    [username]
  );
  
  user.conditions = conds;
  return user;
};


const updateUserProfileByUsername = async (username, data) => {
  const { email, phone_no, address, gender, job, dob, first_name, last_name, conditions } = data;

  await pool.query(
    `UPDATE user_account
     SET email = ?, phone_no = ?, address = ?, gender = ?, job = ?, dob = ?, first_name = ?, last_name = ?
     WHERE user_username = ?`,
    [email, phone_no, address, gender, job, dob, first_name, last_name, username]
  );

  if (Array.isArray(conditions)) {
    await pool.query(`DELETE FROM user_conditions WHERE user_username = ?`, [username]);
    for (const cid of conditions) {
      await pool.query(`INSERT INTO user_conditions (user_username, condition_id) VALUES (?, ?)`, [username, cid]);
    }
  }
};

const updateSubscription = async (username, tier, durationDays, doctor_username = null) => {
  const end_date = new Date();
  end_date.setDate(end_date.getDate() + durationDays);
  
  await pool.query(
    `UPDATE user_account 
     SET subscription_tier = ?, subscription_end_date = ?, assigned_doctor_username = ?
     WHERE user_username = ?`,
    [tier, end_date, doctor_username, username]
  );
};

const getConditionsList = async () => {
  const [rows] = await pool.query(`SELECT * FROM conditions`);
  return rows;
};

module.exports = {
  getUserProfileByUsername,
  updateUserProfileByUsername,
  updateSubscription,
  getConditionsList
};