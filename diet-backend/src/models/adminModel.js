const pool = require('../config/db');

const getAllUsers = async () => {
  const [rows] = await pool.query(
    `SELECT user_username, email, first_name, last_name, phone_no,
            subscription_tier, subscription_end_date, assigned_doctor_username,
            created_at
     FROM user_account
     ORDER BY created_at DESC`
  );
  return rows;
};

const getAllDoctors = async () => {
  const [rows] = await pool.query(
    `SELECT doctor_username, email, first_name, last_name, phone_no, address, certification, created_at
     FROM doctor
     ORDER BY created_at DESC`
  );
  return rows;
};

const listAllDoctors = async () => {
  const [rows] = await pool.query(
    `SELECT doctor_username, first_name, last_name, address, certification
     FROM doctor
     ORDER BY first_name ASC`
  );
  return rows;
};

const updateUserSubscription = async (username, tier, durationDays, doctor_username = null) => {
  let end_date = null;
  if (durationDays > 0) {
    end_date = new Date();
    end_date.setDate(end_date.getDate() + durationDays);
  }
  await pool.query(
    `UPDATE user_account
     SET subscription_tier = ?, subscription_end_date = ?, assigned_doctor_username = ?
     WHERE user_username = ?`,
    [tier, end_date, doctor_username, username]
  );
};

const deleteUser = async (username) => {
  await pool.query(`DELETE FROM user_account WHERE user_username = ?`, [username]);
};

const deleteDoctor = async (username) => {
  await pool.query(`DELETE FROM doctor WHERE doctor_username = ?`, [username]);
};

const addFood = async (data) => {
  const { food_name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_size } = data;
  const [result] = await pool.query(
    `INSERT INTO food (food_name, category, serving_size)
     VALUES (?, ?, ?)`,
    [food_name, category || null, serving_size || '100g']
  );
  const foodId = result.insertId;
  await pool.query(
    `INSERT INTO nutrition_facts (food_id, calories, protein_g, total_carbs_g, total_fat_g)
     VALUES (?, ?, ?, ?, ?)`,
    [foodId, calories_per_100g || 0, protein_per_100g || 0, carbs_per_100g || 0, fat_per_100g || 0]
  );
  return foodId;
};

const getAllFoods = async () => {
  const [rows] = await pool.query(
    `SELECT f.food_id, f.food_name, f.category, 
            n.calories as calories_per_100g, 
            n.protein_g as protein_per_100g, 
            n.total_carbs_g as carbs_per_100g, 
            n.total_fat_g as fat_per_100g, 
            f.serving_size
     FROM food f
     LEFT JOIN nutrition_facts n ON f.food_id = n.food_id
     ORDER BY f.food_name ASC`
  );
  return rows;
};

const updateFood = async (foodId, data) => {
  const { food_name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_size } = data;
  await pool.query(
    `UPDATE food 
     SET food_name = ?, category = ?, serving_size = ?
     WHERE food_id = ?`,
    [food_name, category || null, serving_size || '100g', foodId]
  );
  const [existing] = await pool.query(`SELECT nutrition_id FROM nutrition_facts WHERE food_id = ?`, [foodId]);
  if (existing.length > 0) {
    await pool.query(
      `UPDATE nutrition_facts
       SET calories = ?, protein_g = ?, total_carbs_g = ?, total_fat_g = ?
       WHERE food_id = ?`,
      [calories_per_100g || 0, protein_per_100g || 0, carbs_per_100g || 0, fat_per_100g || 0, foodId]
    );
  } else {
    await pool.query(
      `INSERT INTO nutrition_facts (food_id, calories, protein_g, total_carbs_g, total_fat_g)
       VALUES (?, ?, ?, ?, ?)`,
      [foodId, calories_per_100g || 0, protein_per_100g || 0, carbs_per_100g || 0, fat_per_100g || 0]
    );
  }
};

const deleteFood = async (foodId) => {
  await pool.query(`DELETE FROM food WHERE food_id = ?`, [foodId]);
};

const getAllRecipes = async () => {
  const [rows] = await pool.query(
    `SELECT recipe_id, name, calories, prep_time_min, instructions, image_url, video_url, thumbnail_url, created_at
     FROM recipes
     ORDER BY name ASC`
  );
  return rows;
};

const addRecipe = async (data) => {
  const { name, calories, prep_time_min, instructions, image_url, video_url, thumbnail_url } = data;
  const [result] = await pool.query(
    `INSERT INTO recipes (name, calories, prep_time_min, instructions, image_url, video_url, thumbnail_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, calories || null, prep_time_min || null, instructions || null, image_url || null, video_url || null, thumbnail_url || null]
  );
  return result.insertId;
};

const updateRecipe = async (recipeId, data) => {
  const { name, calories, prep_time_min, instructions, image_url, video_url, thumbnail_url } = data;
  await pool.query(
    `UPDATE recipes 
     SET name = ?, calories = ?, prep_time_min = ?, instructions = ?, image_url = ?, video_url = ?, thumbnail_url = ?
     WHERE recipe_id = ?`,
    [name, calories || null, prep_time_min || null, instructions || null, image_url || null, video_url || null, thumbnail_url || null, recipeId]
  );
};

const deleteRecipe = async (recipeId) => {
  await pool.query(`DELETE FROM recipes WHERE recipe_id = ?`, [recipeId]);
};

const getAllExercises = async () => {
  const [rows] = await pool.query(
    `SELECT exercise_id, name, category, youtube_url, instructions, created_at
     FROM exercises
     ORDER BY name ASC`
  );
  return rows;
};

const addExercise = async (data) => {
  const { name, category, youtube_url, instructions } = data;
  const [result] = await pool.query(
    `INSERT INTO exercises (name, category, youtube_url, instructions)
     VALUES (?, ?, ?, ?)`,
    [name, category || null, youtube_url || null, instructions || null]
  );
  return result.insertId;
};

const updateExercise = async (exerciseId, data) => {
  const { name, category, youtube_url, instructions } = data;
  await pool.query(
    `UPDATE exercises 
     SET name = ?, category = ?, youtube_url = ?, instructions = ?
     WHERE exercise_id = ?`,
    [name, category || null, youtube_url || null, instructions || null, exerciseId]
  );
};

const deleteExercise = async (exerciseId) => {
  await pool.query(`DELETE FROM exercises WHERE exercise_id = ?`, [exerciseId]);
};

const getPlatformStats = async () => {
  const [[{ total_users }]]     = await pool.query(`SELECT COUNT(*) as total_users FROM user_account`);
  const [[{ total_doctors }]]   = await pool.query(`SELECT COUNT(*) as total_doctors FROM doctor`);
  const [[{ pro_users }]]       = await pool.query(`SELECT COUNT(*) as pro_users FROM user_account WHERE subscription_tier = 'pro'`);
  const [[{ coach_users }]]     = await pool.query(`SELECT COUNT(*) as coach_users FROM user_account WHERE subscription_tier = 'doctor'`);
  const [[{ total_foods }]]     = await pool.query(`SELECT COUNT(*) as total_foods FROM food`);
  const [[{ total_plans }]]     = await pool.query(`SELECT COUNT(*) as total_plans FROM diet_plan`);
  const [[{ total_recipes }]]   = await pool.query(`SELECT COUNT(*) as total_recipes FROM recipes`);
  const [[{ total_exercises }]] = await pool.query(`SELECT COUNT(*) as total_exercises FROM exercises`);
  return { total_users, total_doctors, pro_users, coach_users, total_foods, total_plans, total_recipes, total_exercises };
};

const getAllDietPlans = async () => {
  const [rows] = await pool.query(
    `SELECT plan_id, user_username, doctor_username, goal_type, start_date, end_date, 
            target_calories, target_protein_g, target_carbs_g, target_fat_g, created_at
     FROM diet_plan
     ORDER BY created_at DESC`
  );
  return rows;
};

const addDietPlan = async (data) => {
  const { user_username, doctor_username, goal_type, start_date, end_date, target_calories, target_protein_g, target_carbs_g, target_fat_g } = data;
  const [result] = await pool.query(
    `INSERT INTO diet_plan (user_username, doctor_username, goal_type, start_date, end_date, target_calories, target_protein_g, target_carbs_g, target_fat_g)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_username, doctor_username || null, goal_type || null, start_date || null, end_date || null, target_calories || null, target_protein_g || null, target_carbs_g || null, target_fat_g || null]
  );
  return result.insertId;
};

const updateDietPlan = async (planId, data) => {
  const { user_username, doctor_username, goal_type, start_date, end_date, target_calories, target_protein_g, target_carbs_g, target_fat_g } = data;
  await pool.query(
    `UPDATE diet_plan 
     SET user_username = ?, doctor_username = ?, goal_type = ?, start_date = ?, end_date = ?, target_calories = ?, target_protein_g = ?, target_carbs_g = ?, target_fat_g = ?
     WHERE plan_id = ?`,
    [user_username, doctor_username || null, goal_type || null, start_date || null, end_date || null, target_calories || null, target_protein_g || null, target_carbs_g || null, target_fat_g || null, planId]
  );
};

const deleteDietPlan = async (planId) => {
  await pool.query(`DELETE FROM diet_plan WHERE plan_id = ?`, [planId]);
};

module.exports = {
  getAllUsers,
  getAllDoctors,
  listAllDoctors,
  updateUserSubscription,
  addFood,
  getAllFoods,
  updateFood,
  deleteFood,
  getAllRecipes,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  getAllExercises,
  addExercise,
  updateExercise,
  deleteExercise,
  getPlatformStats,
  deleteUser,
  deleteDoctor,
  getAllDietPlans,
  addDietPlan,
  updateDietPlan,
  deleteDietPlan
};
