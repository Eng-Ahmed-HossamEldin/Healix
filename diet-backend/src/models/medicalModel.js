const pool = require("../config/db");

const getConditions = async () => {
  const [rows] = await pool.query(
    `SELECT condition_id, condition_name, description
     FROM medical_condition
     ORDER BY condition_name ASC`
  );
  return rows;
};

const createCondition = async (data) => {
  const { condition_name, description } = data;

  const [result] = await pool.query(
    `INSERT INTO medical_condition (condition_name, description)
     VALUES (?, ?)`,
    [condition_name, description || null]
  );

  return result.insertId;
};

const getRulesByConditionId = async (conditionId) => {
  const [rows] = await pool.query(
    `SELECT rule_id, condition_id, nutrient_key, rule_type, threshold_value, threshold_unit, notes
     FROM condition_diet_rule
     WHERE condition_id = ?
     ORDER BY nutrient_key ASC`,
    [conditionId]
  );
  return rows;
};

const createRuleForCondition = async (conditionId, data) => {
  const { nutrient_key, rule_type, threshold_value, threshold_unit, notes } = data;

  const [result] = await pool.query(
    `INSERT INTO condition_diet_rule
     (condition_id, nutrient_key, rule_type, threshold_value, threshold_unit, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [conditionId, nutrient_key, rule_type, threshold_value || null, threshold_unit || null, notes || null]
  );

  return result.insertId;
};

const getMedicalHistoryByUsername = async (username) => {
  const [rows] = await pool.query(
    `SELECT umh.history_id, umh.diagnosis_date, umh.severity, umh.notes,
            mc.condition_id, mc.condition_name,
            umh.diagnosed_by_doctor_username
     FROM user_medical_history umh
     JOIN medical_condition mc ON umh.condition_id = mc.condition_id
     WHERE umh.user_username = ?
     ORDER BY umh.diagnosis_date DESC`,
    [username]
  );
  return rows;
};

const addMedicalHistoryForUser = async (username, doctorUsername, data) => {
  const { condition_id, diagnosis_date, severity, notes } = data;

  await pool.query(
    `INSERT INTO user_medical_history
     (user_username, condition_id, diagnosed_by_doctor_username, diagnosis_date, severity, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [username, condition_id, doctorUsername, diagnosis_date || null, severity || null, notes || null]
  );
};

module.exports = {
  getConditions,
  createCondition,
  getRulesByConditionId,
  createRuleForCondition,
  getMedicalHistoryByUsername,
  addMedicalHistoryForUser
};