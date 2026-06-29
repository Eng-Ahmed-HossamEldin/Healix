const pool = require("../config/db");

const getFoods = async (search) => {
  const [rows] = await pool.query(
    `SELECT f.food_id, f.food_name, f.category, f.description, f.serving_size,
            f.food_name AS name,
            COALESCE(n.calories, 0)       AS calories,
            COALESCE(n.protein_g, 0)      AS protein_g,
            COALESCE(n.total_carbs_g, 0)  AS total_carbs_g,
            COALESCE(n.total_fat_g, 0)    AS total_fat_g,
            COALESCE(n.total_carbs_g, 0)  AS carbs_g,
            COALESCE(n.total_fat_g, 0)    AS fat_g
     FROM food f
     INNER JOIN nutrition_facts n ON f.food_id = n.food_id
     WHERE (f.food_name LIKE ? OR f.category LIKE ?)
     ORDER BY f.food_name ASC
     LIMIT 50`,
    [`%${search}%`, `%${search}%`]
  );
  return rows;
};

const getFoodById = async (foodId) => {
  const [rows] = await pool.query(
    `SELECT food_id, food_name, category, description, serving_size
     FROM food
     WHERE food_id = ?`,
    [foodId]
  );
  return rows[0] || null;
};

const getNutritionByFoodId = async (foodId) => {
  const [rows] = await pool.query(
    `SELECT *
     FROM nutrition_facts
     WHERE food_id = ?`,
    [foodId]
  );
  return rows[0] || null;
};

const getMedicalTagsByFoodId = async (foodId) => {
  const [rows] = await pool.query(
    `SELECT foodmed_id, foodmed_name
     FROM food_medical
     WHERE food_id = ?`,
    [foodId]
  );
  return rows;
};

const getMealtimesByFoodId = async (foodId) => {
  const [rows] = await pool.query(
    `SELECT mealtime_id, mealtime_name
     FROM mealtime
     WHERE food_id = ?`,
    [foodId]
  );
  return rows;
};

const createFood = async (data) => {
  const { category, description, serving_size } = data;
  const food_name = data.food_name || data.name;

  const [result] = await pool.query(
    `INSERT INTO food (food_name, category, description, serving_size)
     VALUES (?, ?, ?, ?)`,
    [food_name, category || null, description || null, serving_size || null]
  );

  return result.insertId;
};

const upsertNutrition = async (foodId, data) => {
  const calories = data.calories ?? 0;
  const protein_g = data.protein_g ?? 0;
  const total_carbs_g = data.total_carbs_g ?? data.carbs_g ?? 0;
  const total_fat_g = data.total_fat_g ?? data.fat_g ?? 0;
  const saturated_fat_g = data.saturated_fat_g ?? null;
  const sugar_g = data.sugar_g ?? null;
  const fiber_g = data.fiber_g ?? null;
  const cholesterol_mg = data.cholesterol_mg ?? null;
  const sodium_mg = data.sodium_mg ?? null;
  const potassium_mg = data.potassium_mg ?? null;
  const calcium_mg = data.calcium_mg ?? null;
  const iron_mg = data.iron_mg ?? null;
  const vitamin_a_mcg = data.vitamin_a_mcg ?? null;
  const vitamin_c_mg = data.vitamin_c_mg ?? null;

  const [existing] = await pool.query(
    `SELECT nutrition_id
     FROM nutrition_facts
     WHERE food_id = ?`,
    [foodId]
  );

  if (existing.length > 0) {
    await pool.query(
      `UPDATE nutrition_facts
       SET calories = ?, protein_g = ?, total_carbs_g = ?, total_fat_g = ?, saturated_fat_g = ?,
           sugar_g = ?, fiber_g = ?, cholesterol_mg = ?, sodium_mg = ?, potassium_mg = ?,
           calcium_mg = ?, iron_mg = ?, vitamin_a_mcg = ?, vitamin_c_mg = ?
       WHERE food_id = ?`,
      [
        calories, protein_g, total_carbs_g, total_fat_g, saturated_fat_g,
        sugar_g, fiber_g, cholesterol_mg, sodium_mg, potassium_mg,
        calcium_mg, iron_mg, vitamin_a_mcg, vitamin_c_mg, foodId
      ]
    );
    return "updated";
  }

  await pool.query(
    `INSERT INTO nutrition_facts
     (food_id, calories, protein_g, total_carbs_g, total_fat_g, saturated_fat_g,
      sugar_g, fiber_g, cholesterol_mg, sodium_mg, potassium_mg, calcium_mg,
      iron_mg, vitamin_a_mcg, vitamin_c_mg)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      foodId, calories, protein_g, total_carbs_g, total_fat_g, saturated_fat_g,
      sugar_g, fiber_g, cholesterol_mg, sodium_mg, potassium_mg, calcium_mg,
      iron_mg, vitamin_a_mcg, vitamin_c_mg
    ]
  );

  return "created";
};

module.exports = {
  getFoods,
  getFoodById,
  getNutritionByFoodId,
  getMedicalTagsByFoodId,
  getMealtimesByFoodId,
  createFood,
  upsertNutrition
};
