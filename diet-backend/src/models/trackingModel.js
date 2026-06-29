const pool = require("../config/db");
const foodModel = require("./foodModel");

// ─── FOOD LOG ─────────────────────────────────────────────────────────────────

const getFoodLog = async (username, date) => {
  const [rows] = await pool.query(
    `SELECT * FROM food_log WHERE user_username = ? AND DATE(logged_at) = ? ORDER BY logged_at DESC`,
    [username, date]
  );
  return rows;
};

const addFoodLog = async (username, data) => {
  let { food_id, food_name, meal_type, calories, protein_g, carbs_g, fat_g, quantity, unit, date } = data;

  // If a food_id is provided, always fetch real macros from the DB
  if (food_id) {
    const nutrition = await foodModel.getNutritionByFoodId(food_id);
    if (nutrition) {
      calories  = nutrition.calories  ?? calories  ?? 0;
      protein_g = nutrition.protein_g ?? protein_g ?? 0;
      carbs_g   = nutrition.total_carbs_g ?? nutrition.carbs_g ?? carbs_g ?? 0;
      fat_g     = nutrition.total_fat_g   ?? nutrition.fat_g   ?? fat_g   ?? 0;
    }
  }

  if (date) {
    const loggedAt = `${date} 12:00:00`;
    const [result] = await pool.query(
      `INSERT INTO food_log (user_username, food_name, meal_type, calories, protein_g, carbs_g, fat_g, quantity, unit, logged_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, food_name, meal_type || "Snack", calories || 0, protein_g || 0, carbs_g || 0, fat_g || 0, quantity || 1, unit || "serving", loggedAt]
    );
    return result.insertId;
  } else {
    const [result] = await pool.query(
      `INSERT INTO food_log (user_username, food_name, meal_type, calories, protein_g, carbs_g, fat_g, quantity, unit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, food_name, meal_type || "Snack", calories || 0, protein_g || 0, carbs_g || 0, fat_g || 0, quantity || 1, unit || "serving"]
    );
    return result.insertId;
  }
};

const deleteFoodLog = async (logId, username) => {
  const [result] = await pool.query(
    `DELETE FROM food_log WHERE log_id = ? AND user_username = ?`,
    [logId, username]
  );
  return result.affectedRows > 0;
};

// ─── WEIGHT LOG ───────────────────────────────────────────────────────────────

const getWeightLog = async (username, limit = 30) => {
  const [rows] = await pool.query(
    `SELECT * FROM weight_log WHERE user_username = ? ORDER BY logged_at DESC LIMIT ?`,
    [username, limit]
  );
  return rows;
};

const addWeightLog = async (username, data) => {
  const { weight_kg, notes } = data;
  const [result] = await pool.query(
    `INSERT INTO weight_log (user_username, weight_kg, notes) VALUES (?, ?, ?)`,
    [username, weight_kg, notes || null]
  );
  return result.insertId;
};

// ─── WATER LOG ────────────────────────────────────────────────────────────────

const getWaterLog = async (username) => {
  const today = new Date().toISOString().split("T")[0];
  const [todayRows] = await pool.query(
    `SELECT * FROM water_log WHERE user_username = ? AND log_date = ?`,
    [username, today]
  );
  const [weekRows] = await pool.query(
    `SELECT * FROM water_log WHERE user_username = ? ORDER BY log_date DESC LIMIT 7`,
    [username]
  );
  return { today: todayRows[0] || null, week: weekRows };
};

const upsertWaterLog = async (username, cups) => {
  const today = new Date().toISOString().split("T")[0];
  const ml = cups * 250;
  await pool.query(
    `INSERT INTO water_log (user_username, cups, ml, log_date) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE cups = ?, ml = ?`,
    [username, cups, ml, today, cups, ml]
  );
};

// ─── SLEEP LOG ────────────────────────────────────────────────────────────────

const getSleepLog = async (username, limit = 7) => {
  const [rows] = await pool.query(
    `SELECT * FROM sleep_log WHERE user_username = ? ORDER BY log_date DESC LIMIT ?`,
    [username, limit]
  );
  return rows;
};

const addSleepLog = async (username, data) => {
  const { hours, bedtime, wake_time, quality, stress_level, notes } = data;
  const today = new Date().toISOString().split("T")[0];
  const [result] = await pool.query(
    `INSERT INTO sleep_log (user_username, hours, bedtime, wake_time, quality, stress_level, notes, log_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [username, hours, bedtime || null, wake_time || null, quality || "Good", stress_level || 5, notes || null, today]
  );
  return result.insertId;
};

// ─── STEP LOG ─────────────────────────────────────────────────────────────────

const getStepLog = async (username, limit = 7) => {
  const [rows] = await pool.query(
    `SELECT * FROM step_log WHERE user_username = ? ORDER BY log_date DESC LIMIT ?`,
    [username, limit]
  );
  return rows;
};

const upsertStepLog = async (username, data) => {
  const { steps, distance_km, calories_burned } = data;
  const today = new Date().toISOString().split("T")[0];
  await pool.query(
    `INSERT INTO step_log (user_username, steps, distance_km, calories_burned, log_date)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE steps = ?, distance_km = ?, calories_burned = ?`,
    [username, steps, distance_km || 0, calories_burned || 0, today, steps, distance_km || 0, calories_burned || 0]
  );
};

// ─── EXERCISE LOG ─────────────────────────────────────────────────────────────

const getExerciseLog = async (username, date) => {
  const [rows] = await pool.query(
    `SELECT * FROM exercise_log WHERE user_username = ? AND DATE(logged_at) = ? ORDER BY logged_at DESC`,
    [username, date]
  );
  return rows;
};

const addExerciseLog = async (username, data) => {
  const { exercise_name, category, duration_min, intensity, calories_burned, notes } = data;
  const [result] = await pool.query(
    `INSERT INTO exercise_log (user_username, exercise_name, category, duration_min, intensity, calories_burned, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [username, exercise_name, category || "General", duration_min || 0, intensity || "Moderate", calories_burned || 0, notes || null]
  );
  return result.insertId;
};

const deleteExerciseLog = async (logId, username) => {
  const [result] = await pool.query(
    `DELETE FROM exercise_log WHERE log_id = ? AND user_username = ?`,
    [logId, username]
  );
  return result.affectedRows > 0;
};

// ─── SUMMARY (for dashboard) ──────────────────────────────────────────────────

const getDailySummary = async (username, dateParam) => {
  const today = dateParam || new Date().toISOString().split("T")[0];

  const [[caloriesRow]] = await pool.query(
    `SELECT COALESCE(SUM(calories),0) as total_calories,
            COALESCE(SUM(protein_g),0) as total_protein,
            COALESCE(SUM(carbs_g),0) as total_carbs,
            COALESCE(SUM(fat_g),0) as total_fat
     FROM food_log WHERE user_username = ? AND DATE(logged_at) = ?`,
    [username, today]
  );

  const [[waterRow]] = await pool.query(
    `SELECT COALESCE(cups,0) as cups FROM water_log WHERE user_username = ? AND log_date = ?`,
    [username, today]
  );

  const [[stepRow]] = await pool.query(
    `SELECT COALESCE(steps,0) as steps FROM step_log WHERE user_username = ? AND log_date = ?`,
    [username, today]
  );

  const [[exerciseRow]] = await pool.query(
    `SELECT COALESCE(SUM(calories_burned),0) as calories_burned, COALESCE(SUM(duration_min),0) as duration_min
     FROM exercise_log WHERE user_username = ? AND DATE(logged_at) = ?`,
    [username, today]
  );

  const [sleepRow] = await pool.query(
    `SELECT hours, quality FROM sleep_log WHERE user_username = ? ORDER BY log_date DESC LIMIT 1`,
    [username]
  );

  return {
    calories: caloriesRow,
    water: waterRow,
    steps: stepRow,
    exercise: exerciseRow,
    sleep: sleepRow[0] || null,
  };
};

module.exports = {
  getFoodLog, addFoodLog, deleteFoodLog,
  getWeightLog, addWeightLog,
  getWaterLog, upsertWaterLog,
  getSleepLog, addSleepLog,
  getStepLog, upsertStepLog,
  getExerciseLog, addExerciseLog, deleteExerciseLog,
  getDailySummary,
};
