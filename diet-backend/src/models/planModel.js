const pool = require("../config/db");

const getPlansByUsername = async (username) => {
  const [rows] = await pool.query(
    `SELECT *
     FROM diet_plan
     WHERE user_username = ?
     ORDER BY start_date DESC`,
    [username]
  );
  return rows;
};

const getPlanById = async (planId) => {
  const [rows] = await pool.query(
    `SELECT *
     FROM diet_plan
     WHERE plan_id = ?`,
    [planId]
  );
  return rows[0] || null;
};

const getMealsByPlanId = async (planId) => {
  const [rows] = await pool.query(
    `SELECT *
     FROM plan_meal
     WHERE plan_id = ?
     ORDER BY day_no ASC, meal_time ASC`,
    [planId]
  );
  return rows;
};

const getMealItemsByMealId = async (mealId) => {
  const [rows] = await pool.query(
    `SELECT pmi.plan_item_id, pmi.qty, pmi.unit, pmi.instruction,
            f.food_id, f.food_name, f.category, f.serving_size
     FROM plan_meal_item pmi
     JOIN food f ON pmi.food_id = f.food_id
     WHERE pmi.plan_meal_id = ?`,
    [mealId]
  );
  return rows;
};

const createPlanForUser = async (username, doctorUsername, data) => {
  const {
    goal_type,
    start_date,
    end_date,
    notes,
    target_calories,
    target_protein_g,
    target_carbs_g,
    target_fat_g,
    target_water_cups
  } = data;

  const [result] = await pool.query(
    `INSERT INTO diet_plan
     (user_username, doctor_username, goal_type, start_date, end_date, notes,
      target_calories, target_protein_g, target_carbs_g, target_fat_g, target_water_cups)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      username,
      doctorUsername,
      goal_type || null,
      start_date || null,
      end_date || null,
      notes || null,
      target_calories || null,
      target_protein_g || null,
      target_carbs_g || null,
      target_fat_g || null,
      target_water_cups || null
    ]
  );

  return result.insertId;
};

const createMealForPlan = async (planId, data) => {
  const { meal_name, meal_time, weekday, day_no } = data;

  const [result] = await pool.query(
    `INSERT INTO plan_meal (plan_id, meal_name, meal_time, weekday, day_no)
     VALUES (?, ?, ?, ?, ?)`,
    [planId, meal_name || null, meal_time || null, weekday || null, day_no || null]
  );

  return result.insertId;
};

const createMealItem = async (mealId, data) => {
  const { food_id, qty, unit, instruction } = data;

  const [result] = await pool.query(
    `INSERT INTO plan_meal_item (plan_meal_id, food_id, qty, unit, instruction)
     VALUES (?, ?, ?, ?, ?)`,
    [mealId, food_id, qty || null, unit || null, instruction || null]
  );

  return result.insertId;
};

const updatePlan = async (planId, data) => {
  const { goal_type, start_date, end_date, notes, target_calories, target_protein_g, target_carbs_g, target_fat_g, target_water_cups } = data;
  await pool.query(
    `UPDATE diet_plan SET goal_type=?, start_date=?, end_date=?, notes=?, target_calories=?, target_protein_g=?, target_carbs_g=?, target_fat_g=?, target_water_cups=? WHERE plan_id=?`,
    [goal_type||null, start_date||null, end_date||null, notes||null, target_calories||null, target_protein_g||null, target_carbs_g||null, target_fat_g||null, target_water_cups||null, planId]
  );
};

const updateExercisePlan = async (planId, data) => {
  const { goal_type } = data;
  await pool.query(`UPDATE exercise_plans SET goal_type=? WHERE plan_id=?`, [goal_type||null, planId]);
};

module.exports = {
  getPlansByUsername,
  getPlanById,
  getMealsByPlanId,
  getMealItemsByMealId,
  createPlanForUser,
  createMealForPlan,
  createMealItem,
  updatePlan,
  updateExercisePlan,
  deletePlan: async (planId) => {
    await pool.query(`DELETE FROM diet_plan WHERE plan_id = ?`, [planId]);
  },
  getExercisePlansByUsername: async (username) => {
    const [rows] = await pool.query(`SELECT * FROM exercise_plans WHERE user_username = ? ORDER BY created_at DESC`, [username]);
    return rows;
  },
  getExercisePlanById: async (planId) => {
    const [rows] = await pool.query(`SELECT * FROM exercise_plans WHERE plan_id = ?`, [planId]);
    return rows[0] || null;
  },
  getPlanExercisesByPlanId: async (planId) => {
    const [rows] = await pool.query(
      `SELECT pe.*, e.name, e.category, e.youtube_url 
       FROM plan_exercises pe 
       JOIN exercises e ON pe.exercise_id = e.exercise_id 
       WHERE pe.plan_id = ? ORDER BY pe.day_number ASC`, [planId]);
    return rows;
  },
  createExercisePlanForUser: async (username, doctorUsername, data) => {
    const { goal_type } = data;
    const [result] = await pool.query(
      `INSERT INTO exercise_plans (user_username, doctor_username, goal_type) VALUES (?, ?, ?)`,
      [username, doctorUsername, goal_type || null]
    );
    return result.insertId;
  },
  createPlanExercise: async (planId, data) => {
    const { exercise_id, day_number, sets, reps, instruction } = data;
    const [result] = await pool.query(
      `INSERT INTO plan_exercises (plan_id, exercise_id, day_number, sets, reps, instruction) VALUES (?, ?, ?, ?, ?, ?)`,
      [planId, exercise_id, day_number, sets || null, reps || null, instruction || null]
    );
    return result.insertId;
  },
  deleteExercisePlan: async (planId) => {
    await pool.query(`DELETE FROM exercise_plans WHERE plan_id = ?`, [planId]);
  },

  // ── Read full plan with all meals + items (for AI context) ────────────────
  getFullPlanWithItems: async (planId) => {
    const [planRows] = await pool.query(`SELECT * FROM diet_plan WHERE plan_id = ?`, [planId]);
    if (!planRows[0]) return null;
    const plan = planRows[0];

    const [meals] = await pool.query(
      `SELECT * FROM plan_meal WHERE plan_id = ? ORDER BY day_no ASC, meal_time ASC`,
      [planId]
    );

    for (const meal of meals) {
      const [items] = await pool.query(
        `SELECT pmi.*, f.food_name, f.calories, f.protein, f.carbs, f.fat
         FROM plan_meal_item pmi
         JOIN food f ON pmi.food_id = f.food_id
         WHERE pmi.plan_meal_id = ?`,
        [meal.plan_meal_id]
      );
      meal.items = items;
    }

    plan.meals = meals;
    return plan;
  },

  // ── Replace all meals in a plan (wipe + rewrite) ──────────────────────────
  replacePlanMeals: async (planId, meals) => {
    // Delete all existing meals (cascade deletes plan_meal_item too)
    await pool.query(`DELETE FROM plan_meal WHERE plan_id = ?`, [planId]);

    for (const meal of meals) {
      const [mealResult] = await pool.query(
        `INSERT INTO plan_meal (plan_id, meal_name, meal_time, weekday, day_no) VALUES (?, ?, ?, ?, ?)`,
        [planId, meal.meal_name || null, meal.meal_time || null, meal.weekday || null, meal.day_no || null]
      );
      const mealId = mealResult.insertId;

      if (meal.items && Array.isArray(meal.items)) {
        for (const item of meal.items) {
          await pool.query(
            `INSERT INTO plan_meal_item (plan_meal_id, food_id, qty, unit, instruction) VALUES (?, ?, ?, ?, ?)`,
            [mealId, item.food_id, item.qty || null, item.unit || null, item.instruction || null]
          );
        }
      }
    }
  },

  // ── Get full exercise plan with exercises (for AI context) ────────────────
  getFullExercisePlanWithExercises: async (planId) => {
    const [planRows] = await pool.query(`SELECT * FROM exercise_plans WHERE plan_id = ?`, [planId]);
    if (!planRows[0]) return null;
    const plan = planRows[0];

    const [exercises] = await pool.query(
      `SELECT pe.*, e.name, e.category, e.youtube_url
       FROM plan_exercises pe
       JOIN exercises e ON pe.exercise_id = e.exercise_id
       WHERE pe.plan_id = ? ORDER BY pe.day_number ASC`,
      [planId]
    );
    plan.exercises = exercises;
    return plan;
  },

  // ── Replace all exercises in a plan (wipe + rewrite) ─────────────────────
  replaceExercisePlanExercises: async (planId, exercises) => {
    await pool.query(`DELETE FROM plan_exercises WHERE plan_id = ?`, [planId]);

    for (const ex of exercises) {
      await pool.query(
        `INSERT INTO plan_exercises (plan_id, exercise_id, day_number, sets, reps, instruction) VALUES (?, ?, ?, ?, ?, ?)`,
        [planId, ex.exercise_id, ex.day_number, ex.sets || null, ex.reps || null, ex.instruction || null]
      );
    }
  },
};