require("dotenv").config();
const pool = require("../config/db");
const bcrypt = require("bcrypt");

const run = async () => {
  try {
    const password_hash = await bcrypt.hash("12345678", 10);

    await pool.query(
      `INSERT IGNORE INTO doctor
       (doctor_username, email, password_hash, first_name, last_name, certification)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["demo_doctor", "demo_doctor@example.com", password_hash, "Demo", "Doctor", "Clinical Nutrition"]
    );

    await pool.query(
      `INSERT IGNORE INTO user_account
       (user_username, email, password_hash, first_name, last_name, gender, job)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["demo_user", "demo_user@example.com", password_hash, "Demo", "User", "Female", "Student"]
    );

    await pool.query(
      `INSERT IGNORE INTO user_doctor_consultation (user_username, doctor_username)
       VALUES (?, ?)`,
      ["demo_user", "demo_doctor"]
    );

    const [existingPlans] = await pool.query(
      `SELECT plan_id FROM diet_plan WHERE user_username = ? AND doctor_username = ?`,
      ["demo_user", "demo_doctor"]
    );

    if (existingPlans.length > 0) {
      console.log("Sample plan already exists");
      process.exit(0);
    }

    const [planResult] = await pool.query(
      `INSERT INTO diet_plan
       (user_username, doctor_username, goal_type, start_date, end_date, notes,
        target_calories, target_protein_g, target_carbs_g, target_fat_g)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "demo_user",
        "demo_doctor",
        "Weight loss",
        "2026-03-01",
        "2026-03-31",
        "Sample balanced plan",
        1600,
        100,
        170,
        50
      ]
    );

    const planId = planResult.insertId;

    const [breakfastMeal] = await pool.query(
      `INSERT INTO plan_meal (plan_id, meal_name, meal_time, weekday, day_no)
       VALUES (?, ?, ?, ?, ?)`,
      [planId, "Breakfast", "08:00:00", "Sunday", 1]
    );

    const breakfastId = breakfastMeal.insertId;

    const [lunchMeal] = await pool.query(
      `INSERT INTO plan_meal (plan_id, meal_name, meal_time, weekday, day_no)
       VALUES (?, ?, ?, ?, ?)`,
      [planId, "Lunch", "13:00:00", "Sunday", 1]
    );

    const lunchId = lunchMeal.insertId;

    const [snackMeal] = await pool.query(
      `INSERT INTO plan_meal (plan_id, meal_name, meal_time, weekday, day_no)
       VALUES (?, ?, ?, ?, ?)`,
      [planId, "Snack", "17:00:00", "Sunday", 1]
    );

    const snackId = snackMeal.insertId;

    const [appleRows] = await pool.query(`SELECT food_id FROM food WHERE food_name = ? LIMIT 1`, ["Apple"]);
    const [riceRows] = await pool.query(`SELECT food_id FROM food WHERE food_name = ? LIMIT 1`, ["Brown Rice"]);
    const [chickenRows] = await pool.query(`SELECT food_id FROM food WHERE food_name = ? LIMIT 1`, ["Chicken Breast"]);
    const [broccoliRows] = await pool.query(`SELECT food_id FROM food WHERE food_name = ? LIMIT 1`, ["Broccoli"]);
    const [yogurtRows] = await pool.query(`SELECT food_id FROM food WHERE food_name = ? LIMIT 1`, ["Low-Fat Yogurt"]);

    if (appleRows[0]) {
      await pool.query(
        `INSERT INTO plan_meal_item (plan_meal_id, food_id, qty, unit, instruction)
         VALUES (?, ?, ?, ?, ?)`,
        [breakfastId, appleRows[0].food_id, 1, "piece", "Eat fresh"]
      );
    }

    if (yogurtRows[0]) {
      await pool.query(
        `INSERT INTO plan_meal_item (plan_meal_id, food_id, qty, unit, instruction)
         VALUES (?, ?, ?, ?, ?)`,
        [breakfastId, yogurtRows[0].food_id, 1, "cup", "Plain unsweetened yogurt"]
      );
    }

    if (riceRows[0]) {
      await pool.query(
        `INSERT INTO plan_meal_item (plan_meal_id, food_id, qty, unit, instruction)
         VALUES (?, ?, ?, ?, ?)`,
        [lunchId, riceRows[0].food_id, 150, "g", "Cooked portion"]
      );
    }

    if (chickenRows[0]) {
      await pool.query(
        `INSERT INTO plan_meal_item (plan_meal_id, food_id, qty, unit, instruction)
         VALUES (?, ?, ?, ?, ?)`,
        [lunchId, chickenRows[0].food_id, 120, "g", "Grilled or baked"]
      );
    }

    if (broccoliRows[0]) {
      await pool.query(
        `INSERT INTO plan_meal_item (plan_meal_id, food_id, qty, unit, instruction)
         VALUES (?, ?, ?, ?, ?)`,
        [lunchId, broccoliRows[0].food_id, 100, "g", "Steamed"]
      );
    }

    if (appleRows[0]) {
      await pool.query(
        `INSERT INTO plan_meal_item (plan_meal_id, food_id, qty, unit, instruction)
         VALUES (?, ?, ?, ?, ?)`,
        [snackId, appleRows[0].food_id, 1, "piece", "Afternoon snack"]
      );
    }

    console.log("Sample plan seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();