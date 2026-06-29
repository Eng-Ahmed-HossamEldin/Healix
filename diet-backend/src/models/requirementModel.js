const pool = require("../config/db");

const getRequirementsByUsername = async (username) => {
  const [rows] = await pool.query(
    `SELECT * FROM user_requirement WHERE user_username = ?`,
    [username]
  );
  return rows[0] || null;
};

const upsertRequirementsByUsername = async (username, data) => {
  const {
    height_cm, weight_kg, target_weight_kg, activity_rate,
    goal, target_date, preferences, allergies,
    target_calories, target_protein_g, target_carbs_g, target_fat_g,
    sleep_hours_target, water_cups_target
  } = data;

  const [existing] = await pool.query(
    `SELECT req_id FROM user_requirement WHERE user_username = ?`,
    [username]
  );

  if (existing.length > 0) {
    await pool.query(
      `UPDATE user_requirement
       SET height_cm=?, weight_kg=?, target_weight_kg=?, activity_rate=?,
           goal=?, target_date=?, preferences=?, allergies=?,
           target_calories=?, target_protein_g=?, target_carbs_g=?, target_fat_g=?,
           sleep_hours_target=?, water_cups_target=?
       WHERE user_username=?`,
      [
        height_cm||null, weight_kg||null, target_weight_kg||null, activity_rate||null,
        goal||null, target_date||null, preferences||null, allergies||null,
        target_calories||null, target_protein_g||null, target_carbs_g||null, target_fat_g||null,
        sleep_hours_target||null, water_cups_target||null,
        username
      ]
    );
    return "updated";
  }

  await pool.query(
    `INSERT INTO user_requirement
     (user_username, height_cm, weight_kg, target_weight_kg, activity_rate,
      goal, target_date, preferences, allergies,
      target_calories, target_protein_g, target_carbs_g, target_fat_g,
      sleep_hours_target, water_cups_target)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      username,
      height_cm||null, weight_kg||null, target_weight_kg||null, activity_rate||null,
      goal||null, target_date||null, preferences||null, allergies||null,
      target_calories||null, target_protein_g||null, target_carbs_g||null, target_fat_g||null,
      sleep_hours_target||null, water_cups_target||null
    ]
  );
  return "created";
};

// Doctor/AI partial update — only updates specified macro/lifestyle fields
const patchTargetsByUsername = async (username, fields) => {
  const allowed = ['target_calories','target_protein_g','target_carbs_g','target_fat_g','sleep_hours_target','water_cups_target', 'weight_kg', 'height_cm', 'activity_rate', 'goal'];
  const sets = [], vals = [];
  for (const k of allowed) {
    if (fields[k] !== undefined && fields[k] !== null) {
      sets.push(`${k} = ?`);
      vals.push(fields[k]);
    }
  }
  if (!sets.length) return;
  vals.push(username);

  const [existing] = await pool.query(`SELECT req_id FROM user_requirement WHERE user_username=?`, [username]);
  if (existing.length > 0) {
    await pool.query(`UPDATE user_requirement SET ${sets.join(', ')} WHERE user_username=?`, vals);
  } else {
    // Create a minimal row first
    await pool.query(`INSERT IGNORE INTO user_requirement (user_username) VALUES (?)`, [username]);
    await pool.query(`UPDATE user_requirement SET ${sets.join(', ')} WHERE user_username=?`, vals);
  }
};

module.exports = { getRequirementsByUsername, upsertRequirementsByUsername, patchTargetsByUsername };