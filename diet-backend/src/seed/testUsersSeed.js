/**
 * Test Users Seed Script
 * Creates 3 test users:
 *   testUser1@healix.com  — subscribed to doctor plan with doctor1, has 3 months of history + chat
 *   testUser2@healix.com  — AI Pro subscriber, has 1 month of tracking history
 *   testUser3@healix.com  — Free user with basic tracking
 *
 * Password for all: user@1234
 * Run: node src/seed/testUsersSeed.js
 */

require('dotenv').config();
const pool = require('../config/db');
const bcrypt = require('bcrypt');

const PASSWORD = 'user@1234';
const SALT_ROUNDS = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function dateAt(daysAgoN, hour = 12, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgoN);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Main Seed ────────────────────────────────────────────────────────────────
async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('🌱 Starting test users seed...\n');

    const hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

    // ── Check/get doctor1 username ────────────────────────────────────────────
    const [doctors] = await conn.query(
      `SELECT doctor_username FROM doctor ORDER BY created_at ASC LIMIT 1`
    );
    const doctorUsername = doctors[0]?.doctor_username || null;
    if (!doctorUsername) {
      console.warn('⚠️  No doctor found in the database. testUser1 will not have a doctor assigned.');
    } else {
      console.log(`✅ Found doctor: ${doctorUsername}`);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // USER 1 — testuser1 (doctor subscriber, 3 months of history)
    // ══════════════════════════════════════════════════════════════════════════
    const user1 = {
      user_username: 'testuser1',
      email: 'testUser1@healix.com',
      first_name: 'Ahmed',
      last_name: 'Hassan',
      phone_no: '+201001234567',
      address: 'Cairo, Egypt',
      gender: 'Male',
      job: 'Software Engineer',
      dob: '1992-05-14',
      password_hash: hash
    };

    // Delete existing if any (clean slate)
    await conn.query(`DELETE FROM user_account WHERE user_username = ? OR email = ?`, [user1.user_username, user1.email]);

    await conn.query(
      `INSERT INTO user_account
       (user_username, email, phone_no, address, gender, job, dob, password_hash, first_name, last_name,
        subscription_tier, subscription_end_date, assigned_doctor_username, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'doctor', DATE_ADD(NOW(), INTERVAL 7 DAY), ?, DATE_SUB(NOW(), INTERVAL 90 DAY))`,
      [user1.user_username, user1.email, user1.phone_no, user1.address, user1.gender,
       user1.job, user1.dob, user1.password_hash, user1.first_name, user1.last_name, doctorUsername]
    );
    console.log(`✅ Created user: ${user1.user_username} (${user1.email})`);

    // Link user1 to doctor (accepted)
    if (doctorUsername) {
      await conn.query(`DELETE FROM user_doctor_consultation WHERE user_username = ?`, [user1.user_username]);
      await conn.query(
        `INSERT INTO user_doctor_consultation (user_username, doctor_username, status, created_at)
         VALUES (?, ?, 'accepted', DATE_SUB(NOW(), INTERVAL 90 DAY))`,
        [user1.user_username, doctorUsername]
      );
    }

    // Subscription request (approved 3 months ago)
    await conn.query(`DELETE FROM subscription_requests WHERE user_username = ?`, [user1.user_username]);
    await conn.query(
      `INSERT INTO subscription_requests (user_username, requested_tier, doctor_username, status, admin_note, created_at, updated_at)
       VALUES (?, 'doctor', ?, 'approved', 'Welcome to Healix Doctor Plan!', DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 90 DAY))`,
      [user1.user_username, doctorUsername]
    );

    // ── Food logs for user1 (90 days) ─────────────────────────────────────────
    const meals = [
      { food_name: 'Grilled Chicken Breast', meal_type: 'Lunch', calories: 350, protein_g: 42, carbs_g: 0, fat_g: 8 },
      { food_name: 'Brown Rice', meal_type: 'Lunch', calories: 220, protein_g: 5, carbs_g: 45, fat_g: 2 },
      { food_name: 'Oatmeal with Banana', meal_type: 'Breakfast', calories: 310, protein_g: 8, carbs_g: 58, fat_g: 5 },
      { food_name: 'Greek Yogurt', meal_type: 'Snack', calories: 150, protein_g: 12, carbs_g: 8, fat_g: 4 },
      { food_name: 'Mixed Salad', meal_type: 'Dinner', calories: 120, protein_g: 3, carbs_g: 15, fat_g: 5 },
      { food_name: 'Salmon Fillet', meal_type: 'Dinner', calories: 420, protein_g: 48, carbs_g: 0, fat_g: 22 },
      { food_name: 'Whole Wheat Toast', meal_type: 'Breakfast', calories: 180, protein_g: 6, carbs_g: 32, fat_g: 3 },
      { food_name: 'Apple', meal_type: 'Snack', calories: 95, protein_g: 0, carbs_g: 25, fat_g: 0 },
    ];

    console.log('   Adding food logs for testuser1 (90 days)...');
    for (let day = 90; day >= 0; day--) {
      // Randomly skip ~15% of days
      if (Math.random() < 0.15) continue;
      const date = daysAgo(day);
      const dayMeals = meals.slice(0, randomBetween(3, 5));
      for (const meal of dayMeals) {
        await conn.query(
          `INSERT INTO food_log (user_username, food_name, meal_type, calories, protein_g, carbs_g, fat_g, quantity, unit, logged_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'serving', ?)`,
          [user1.user_username, meal.food_name, meal.meal_type, meal.calories, meal.protein_g, meal.carbs_g, meal.fat_g, `${date} 12:00:00`]
        );
      }
    }

    // ── Weight logs for user1 (90 days, every ~5 days) ───────────────────────
    console.log('   Adding weight logs for testuser1...');
    let weight = 92.0; // starting weight
    for (let day = 90; day >= 0; day -= 5) {
      weight = Math.max(78, weight - randomBetween(0, 3) * 0.1 + (Math.random() > 0.7 ? 0.2 : 0));
      await conn.query(
        `INSERT INTO weight_log (user_username, weight_kg, notes, logged_at)
         VALUES (?, ?, ?, ?)`,
        [user1.user_username, weight.toFixed(1), day % 20 === 0 ? 'Feeling good today!' : null, `${daysAgo(day)} 08:00:00`]
      );
    }

    // ── Water logs for user1 ──────────────────────────────────────────────────
    console.log('   Adding water logs for testuser1...');
    for (let day = 90; day >= 0; day--) {
      if (Math.random() < 0.1) continue;
      const cups = randomBetween(5, 10);
      await conn.query(
        `INSERT INTO water_log (user_username, cups, ml, log_date)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE cups = ?, ml = ?`,
        [user1.user_username, cups, cups * 250, daysAgo(day), cups, cups * 250]
      );
    }

    // ── Step logs for user1 ───────────────────────────────────────────────────
    console.log('   Adding step logs for testuser1...');
    for (let day = 90; day >= 0; day--) {
      if (Math.random() < 0.1) continue;
      const steps = randomBetween(5000, 14000);
      await conn.query(
        `INSERT INTO step_log (user_username, steps, distance_km, calories_burned, log_date)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE steps = ?, distance_km = ?, calories_burned = ?`,
        [user1.user_username, steps, (steps * 0.0007).toFixed(2), Math.round(steps * 0.04), daysAgo(day),
         steps, (steps * 0.0007).toFixed(2), Math.round(steps * 0.04)]
      );
    }

    // ── Sleep logs for user1 ──────────────────────────────────────────────────
    console.log('   Adding sleep logs for testuser1...');
    const qualities = ['Excellent', 'Good', 'Fair', 'Poor'];
    for (let day = 90; day >= 0; day--) {
      if (Math.random() < 0.15) continue;
      const hours = (randomBetween(55, 85) / 10).toFixed(1);
      const quality = qualities[randomBetween(0, 3)];
      await conn.query(
        `INSERT INTO sleep_log (user_username, hours, bedtime, wake_time, quality, stress_level, log_date)
         VALUES (?, ?, '23:00:00', '07:00:00', ?, ?, ?)`,
        [user1.user_username, hours, quality, randomBetween(2, 8), daysAgo(day)]
      ).catch(() => {}); // ignore duplicate
    }

    // ── Chat history between testuser1 and doctor1 ────────────────────────────
    if (doctorUsername) {
      console.log(`   Adding chat history between testuser1 and ${doctorUsername}...`);

      const chatConversations = [
        // 3 months ago — initial consultation
        { sender: user1.user_username, receiver: doctorUsername, msg: 'Hello Doctor! I am excited to start my health journey with you.', daysBack: 90 },
        { sender: doctorUsername, receiver: user1.user_username, msg: 'Welcome Ahmed! I have reviewed your profile. Let us start with a comprehensive assessment. How is your current diet?', daysBack: 90 },
        { sender: user1.user_username, receiver: doctorUsername, msg: 'I usually eat a lot of carbs and fast food. I want to lose around 10 kg and build some muscle.', daysBack: 89 },
        { sender: doctorUsername, receiver: user1.user_username, msg: 'Great goals! I will create a customized diet plan for you. First, let me know: do you have any food allergies or medical conditions?', daysBack: 89 },
        { sender: user1.user_username, receiver: doctorUsername, msg: 'No allergies. I have slightly high blood pressure but it is controlled with medication.', daysBack: 89 },
        { sender: doctorUsername, receiver: user1.user_username, msg: 'Understood. I will keep sodium intake moderate. I have prepared a meal plan for you — please check it in your Plans section.', daysBack: 88 },
        { sender: user1.user_username, receiver: doctorUsername, msg: 'Received it! The plan looks very detailed. Thank you so much!', daysBack: 88 },

        // 2 months ago — progress check
        { sender: user1.user_username, receiver: doctorUsername, msg: 'Doctor, I have lost 2.5 kg in the first month! I am so happy!', daysBack: 60 },
        { sender: doctorUsername, receiver: user1.user_username, msg: 'Excellent progress Ahmed! That is right on track. How are you feeling energy-wise?', daysBack: 60 },
        { sender: user1.user_username, receiver: doctorUsername, msg: 'Energy is much better. I am sleeping 7-8 hours now and drinking plenty of water.', daysBack: 60 },
        { sender: doctorUsername, receiver: user1.user_username, msg: 'Perfect! Let us increase the protein slightly and add a light strength training routine. I will update your plan.', daysBack: 59 },
        { sender: user1.user_username, receiver: doctorUsername, msg: 'Sounds great. Also, should I be concerned about my blood pressure readings? They seem lower now.', daysBack: 59 },
        { sender: doctorUsername, receiver: user1.user_username, msg: 'Lower blood pressure is actually a positive sign of your improved lifestyle. Keep monitoring it and report any unusual readings.', daysBack: 58 },

        // 1 month ago — adjustment
        { sender: user1.user_username, receiver: doctorUsername, msg: 'Hi Doctor! I had a cheat week during Eid holidays but I am back on track now.', daysBack: 30 },
        { sender: doctorUsername, receiver: user1.user_username, msg: 'No worries, that is perfectly normal! Consistency over perfection. Just resume your routine.', daysBack: 30 },
        { sender: user1.user_username, receiver: doctorUsername, msg: 'Current weight is 87.5 kg. Down from 92 kg originally!', daysBack: 29 },
        { sender: doctorUsername, receiver: user1.user_username, msg: '4.5 kg down — outstanding work! You are ahead of schedule. Let us fine-tune the plan for the next phase: lean muscle building.', daysBack: 29 },
        { sender: user1.user_username, receiver: doctorUsername, msg: 'I have also started going to the gym 4 times a week. Is that too much?', daysBack: 28 },
        { sender: doctorUsername, receiver: user1.user_username, msg: 'Excellent commitment! 4 times is fine. Make sure to have 2 rest days with light walking. Recovery is just as important.', daysBack: 28 },

        // Recent week
        { sender: user1.user_username, receiver: doctorUsername, msg: 'Quick question — can I have whey protein after workouts?', daysBack: 7 },
        { sender: doctorUsername, receiver: user1.user_username, msg: 'Absolutely! 25-30g of whey protein post-workout is ideal. Look for one with low sugar content.', daysBack: 7 },
        { sender: user1.user_username, receiver: doctorUsername, msg: 'Thank you! Also, I logged my meals consistently for the whole week. Feeling proud!', daysBack: 6 },
        { sender: doctorUsername, receiver: user1.user_username, msg: 'That consistency is the key to success! Keep it up Ahmed. Next check-in in 2 weeks.', daysBack: 6 },
        { sender: user1.user_username, receiver: doctorUsername, msg: 'Will do! See you then, Doctor.', daysBack: 5 },
      ];

      await conn.query(`DELETE FROM doctor_patient_chat WHERE (sender_username = ? AND receiver_username = ?) OR (sender_username = ? AND receiver_username = ?)`,
        [user1.user_username, doctorUsername, doctorUsername, user1.user_username]);

      for (const chat of chatConversations) {
        await conn.query(
          `INSERT INTO doctor_patient_chat (sender_username, receiver_username, message, is_read, created_at)
           VALUES (?, ?, ?, 1, ?)`,
          [chat.sender, chat.receiver, chat.msg, dateAt(chat.daysBack, randomBetween(9, 18), randomBetween(0, 59))]
        );
      }
      console.log(`   ✅ Added ${chatConversations.length} chat messages`);
    }

    // ── Exercise logs for user1 ───────────────────────────────────────────────
    console.log('   Adding exercise logs for testuser1...');
    const exercises = [
      { name: 'Running', category: 'Cardio', duration: 35, intensity: 'Moderate', cals: 320 },
      { name: 'Push-ups', category: 'Strength', duration: 20, intensity: 'Moderate', cals: 120 },
      { name: 'Cycling', category: 'Cardio', duration: 40, intensity: 'High', cals: 380 },
      { name: 'Plank', category: 'Core', duration: 10, intensity: 'Moderate', cals: 60 },
      { name: 'Dumbbell Curls', category: 'Strength', duration: 25, intensity: 'Moderate', cals: 150 },
    ];
    for (let day = 90; day >= 0; day -= 2) {
      if (Math.random() < 0.2) continue;
      const ex = exercises[randomBetween(0, exercises.length - 1)];
      await conn.query(
        `INSERT INTO exercise_log (user_username, exercise_name, category, duration_min, intensity, calories_burned, logged_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user1.user_username, ex.name, ex.category, ex.duration, ex.intensity, ex.cals, `${daysAgo(day)} 18:00:00`]
      );
    }

    console.log(`✅ testuser1 data complete!\n`);

    // ══════════════════════════════════════════════════════════════════════════
    // USER 2 — testuser2 (AI Pro subscriber)
    // ══════════════════════════════════════════════════════════════════════════
    const user2 = {
      user_username: 'testuser2',
      email: 'testUser2@healix.com',
      first_name: 'Sara',
      last_name: 'Ali',
      phone_no: '+201119876543',
      address: 'Alexandria, Egypt',
      gender: 'Female',
      job: 'Teacher',
      dob: '1995-08-22',
      password_hash: hash
    };

    await conn.query(`DELETE FROM user_account WHERE user_username = ? OR email = ?`, [user2.user_username, user2.email]);
    await conn.query(
      `INSERT INTO user_account
       (user_username, email, phone_no, address, gender, job, dob, password_hash, first_name, last_name,
        subscription_tier, subscription_end_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pro', DATE_ADD(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY))`,
      [user2.user_username, user2.email, user2.phone_no, user2.address, user2.gender,
       user2.job, user2.dob, user2.password_hash, user2.first_name, user2.last_name]
    );
    console.log(`✅ Created user: ${user2.user_username} (${user2.email})`);

    // Subscription request for user2 (approved)
    await conn.query(`DELETE FROM subscription_requests WHERE user_username = ?`, [user2.user_username]);
    await conn.query(
      `INSERT INTO subscription_requests (user_username, requested_tier, status, admin_note, created_at, updated_at)
       VALUES (?, 'pro', 'approved', 'Enjoy AI Pro!', DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY))`,
      [user2.user_username]
    );

    // Food logs for user2 (30 days)
    console.log('   Adding food logs for testuser2 (30 days)...');
    const user2meals = [
      { food_name: 'Scrambled Eggs', meal_type: 'Breakfast', calories: 280, protein_g: 18, carbs_g: 5, fat_g: 20 },
      { food_name: 'Avocado Toast', meal_type: 'Breakfast', calories: 340, protein_g: 9, carbs_g: 30, fat_g: 18 },
      { food_name: 'Quinoa Bowl', meal_type: 'Lunch', calories: 420, protein_g: 14, carbs_g: 55, fat_g: 12 },
      { food_name: 'Green Smoothie', meal_type: 'Snack', calories: 180, protein_g: 4, carbs_g: 32, fat_g: 3 },
      { food_name: 'Lentil Soup', meal_type: 'Dinner', calories: 290, protein_g: 16, carbs_g: 40, fat_g: 5 },
    ];
    for (let day = 30; day >= 0; day--) {
      if (Math.random() < 0.1) continue;
      const date = daysAgo(day);
      for (const meal of user2meals.slice(0, randomBetween(3, 5))) {
        await conn.query(
          `INSERT INTO food_log (user_username, food_name, meal_type, calories, protein_g, carbs_g, fat_g, quantity, unit, logged_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'serving', ?)`,
          [user2.user_username, meal.food_name, meal.meal_type, meal.calories, meal.protein_g, meal.carbs_g, meal.fat_g, `${date} 12:00:00`]
        );
      }
    }

    // Weight logs for user2
    console.log('   Adding weight logs for testuser2...');
    let w2 = 65.0;
    for (let day = 30; day >= 0; day -= 7) {
      await conn.query(
        `INSERT INTO weight_log (user_username, weight_kg, logged_at) VALUES (?, ?, ?)`,
        [user2.user_username, w2.toFixed(1), `${daysAgo(day)} 07:30:00`]
      );
      w2 -= Math.random() * 0.4;
    }

    // Water logs for user2
    for (let day = 30; day >= 0; day--) {
      const cups = randomBetween(6, 10);
      await conn.query(
        `INSERT INTO water_log (user_username, cups, ml, log_date) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE cups = ?, ml = ?`,
        [user2.user_username, cups, cups * 250, daysAgo(day), cups, cups * 250]
      );
    }

    // Step logs for user2
    for (let day = 30; day >= 0; day--) {
      const steps = randomBetween(4000, 9000);
      await conn.query(
        `INSERT INTO step_log (user_username, steps, distance_km, calories_burned, log_date)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE steps = ?, distance_km = ?, calories_burned = ?`,
        [user2.user_username, steps, (steps * 0.0007).toFixed(2), Math.round(steps * 0.04), daysAgo(day),
         steps, (steps * 0.0007).toFixed(2), Math.round(steps * 0.04)]
      );
    }

    console.log(`✅ testuser2 data complete!\n`);

    // ══════════════════════════════════════════════════════════════════════════
    // USER 3 — testuser3 (Free user)
    // ══════════════════════════════════════════════════════════════════════════
    const user3 = {
      user_username: 'testuser3',
      email: 'testUser3@healix.com',
      first_name: 'Omar',
      last_name: 'Khaled',
      phone_no: '+201055544433',
      address: 'Giza, Egypt',
      gender: 'Male',
      job: 'Student',
      dob: '2000-12-01',
      password_hash: hash
    };

    await conn.query(`DELETE FROM user_account WHERE user_username = ? OR email = ?`, [user3.user_username, user3.email]);
    await conn.query(
      `INSERT INTO user_account
       (user_username, email, phone_no, address, gender, job, dob, password_hash, first_name, last_name,
        subscription_tier, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'default', DATE_SUB(NOW(), INTERVAL 14 DAY))`,
      [user3.user_username, user3.email, user3.phone_no, user3.address, user3.gender,
       user3.job, user3.dob, user3.password_hash, user3.first_name, user3.last_name]
    );
    console.log(`✅ Created user: ${user3.user_username} (${user3.email})`);

    // Basic food logs for user3 (14 days)
    console.log('   Adding food logs for testuser3 (14 days)...');
    const user3meals = [
      { food_name: 'Ful Medames', meal_type: 'Breakfast', calories: 320, protein_g: 14, carbs_g: 45, fat_g: 8 },
      { food_name: 'Koshary', meal_type: 'Lunch', calories: 480, protein_g: 12, carbs_g: 85, fat_g: 10 },
      { food_name: 'Chicken Shawarma', meal_type: 'Dinner', calories: 520, protein_g: 32, carbs_g: 45, fat_g: 18 },
    ];
    for (let day = 14; day >= 0; day--) {
      if (Math.random() < 0.3) continue;
      const date = daysAgo(day);
      for (const meal of user3meals.slice(0, randomBetween(1, 3))) {
        await conn.query(
          `INSERT INTO food_log (user_username, food_name, meal_type, calories, protein_g, carbs_g, fat_g, quantity, unit, logged_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'serving', ?)`,
          [user3.user_username, meal.food_name, meal.meal_type, meal.calories, meal.protein_g, meal.carbs_g, meal.fat_g, `${date} 12:00:00`]
        );
      }
    }

    // Water logs for user3
    for (let day = 14; day >= 0; day--) {
      if (Math.random() < 0.3) continue;
      const cups = randomBetween(3, 7);
      await conn.query(
        `INSERT INTO water_log (user_username, cups, ml, log_date) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE cups = ?, ml = ?`,
        [user3.user_username, cups, cups * 250, daysAgo(day), cups, cups * 250]
      );
    }

    // Weight entry for user3
    await conn.query(
      `INSERT INTO weight_log (user_username, weight_kg, notes, logged_at) VALUES (?, ?, ?, NOW())`,
      [user3.user_username, '78.5', 'Just started tracking!']
    );

    console.log(`✅ testuser3 data complete!\n`);

    // ─── Summary ──────────────────────────────────────────────────────────────
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Test users seeded successfully!\n');
    console.log('  Email                     | Password   | Plan');
    console.log('  ───────────────────────── | ─────────── | ──────────');
    console.log(`  testUser1@healix.com      | user@1234  | Doctor (subscribed to ${doctorUsername || 'N/A'})`);
    console.log('  testUser2@healix.com      | user@1234  | AI Pro');
    console.log('  testUser3@healix.com      | user@1234  | Free');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
