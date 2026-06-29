const { GoogleGenAI, Type } = require("@google/genai");
const pool = require("../config/db");
const userModel = require("../models/userModel");
const medicalModel = require("../models/medicalModel");
const planModel = require("../models/planModel");
const requirementModel = require("../models/requirementModel");
const trackingModel = require("../models/trackingModel");
const { sendNotification } = require("../utils/notificationService");

// ── Validate API key at startup ──────────────────────────────────────────────
const _geminiKey = process.env.GEMINI_API_KEY || '';
if (!_geminiKey) {
  console.warn('[AI Agent] WARNING: GEMINI_API_KEY is not set. AI features will return an error until a key is added to .env');
}

// ─── BMR / TDEE / Macro Calculations ────────────────────────────────────────

/**
 * Mifflin-St Jeor BMR
 * @param {number} weight_kg
 * @param {number} height_cm
 * @param {number} age
 * @param {string} gender - 'Male' | 'Female'
 */
function calcBMR(weight_kg, height_cm, age, gender) {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return gender === "Female" ? base - 161 : base + 5;
}

const ACTIVITY_MULTIPLIERS = {
  sedentary:    1.2,
  light:        1.375,
  moderate:     1.55,
  active:       1.725,
  very_active:  1.9,
};

function calcTDEE(bmr, activity_rate) {
  const multiplier = ACTIVITY_MULTIPLIERS[activity_rate] || 1.55;
  return Math.round(bmr * multiplier);
}

function calcMacros(tdee, goal) {
  let calories = tdee;
  let proteinPct, carbsPct, fatPct;

  if (goal === "fat_loss" || goal === "weight_loss") {
    calories = tdee - 500;
    proteinPct = 0.35; carbsPct = 0.40; fatPct = 0.25;
  } else if (goal === "muscle_gain" || goal === "bulking") {
    calories = tdee + 300;
    proteinPct = 0.30; carbsPct = 0.50; fatPct = 0.20;
  } else {
    // maintenance
    proteinPct = 0.25; carbsPct = 0.50; fatPct = 0.25;
  }

  return {
    calories: Math.max(calories, 1200),
    protein_g: Math.round((calories * proteinPct) / 4),
    carbs_g:   Math.round((calories * carbsPct)   / 4),
    fat_g:     Math.round((calories * fatPct)      / 9),
  };
}

function calcAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─── DB History Helpers ──────────────────────────────────────────────────────

async function loadHistory(username, limit = 20) {
  const [rows] = await pool.query(
    `SELECT role, message FROM ai_chat_history
     WHERE user_username = ?
     ORDER BY created_at DESC LIMIT ?`,
    [username, limit]
  );
  // Return in chronological order (oldest first)
  return rows.reverse();
}

async function saveHistory(username, role, message) {
  await pool.query(
    `INSERT INTO ai_chat_history (user_username, role, message) VALUES (?, ?, ?)`,
    [username, role, message]
  );
}

// ─── Reference Data Loader ───────────────────────────────────────────────────

async function loadFoodSample(limit = 30) {
  const [rows] = await pool.query(
    `SELECT f.food_id, f.food_name, n.calories, n.protein_g as protein, n.total_carbs_g as carbs, n.total_fat_g as fat, f.serving_size
     FROM food f
     LEFT JOIN nutrition_facts n ON f.food_id = n.food_id
     ORDER BY f.food_id LIMIT ?`,
    [limit]
  );
  return rows;
}

async function loadExerciseSample(limit = 20) {
  const [rows] = await pool.query(
    `SELECT exercise_id, name, category, instructions FROM exercises LIMIT ?`,
    [limit]
  );
  return rows;
}

// ─── Gemini Tool Declarations ────────────────────────────────────────────────
const AGENT_TOOLS = [
  {
    name: "recommend_doctors_near_address",
    description: "Search for doctors near a given address or keyword location and return a list.",
    parameters: { type: Type.OBJECT, properties: { location_keyword: { type: Type.STRING, description: "City, district or address keyword" } }, required: ["location_keyword"] }
  },
  {
    name: "forward_to_doctor",
    description: "Link the user to a specific doctor for real-time chat and medical supervision.",
    parameters: { type: Type.OBJECT, properties: { doctor_username: { type: Type.STRING, description: "The doctor's username in the system" } }, required: ["doctor_username"] }
  },
  {
    name: "create_meal_plan",
    description: "Create a personalized diet/meal plan for the user and save it to the database. Use the food IDs provided in the system context.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        goal_type:        { type: Type.STRING,  description: "E.g. 'Fat Loss', 'Muscle Gain', 'Maintenance'" },
        target_calories:  { type: Type.NUMBER },
        target_protein_g: { type: Type.NUMBER },
        target_carbs_g:   { type: Type.NUMBER },
        target_fat_g:     { type: Type.NUMBER },
        notes:            { type: Type.STRING },
        start_date:       { type: Type.STRING,  description: "YYYY-MM-DD" },
        end_date:         { type: Type.STRING,  description: "YYYY-MM-DD" },
        meals: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              meal_name: { type: Type.STRING },
              meal_time: { type: Type.STRING, description: "HH:MM:SS format" },
              day_no:    { type: Type.NUMBER },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    food_id:     { type: Type.NUMBER },
                    qty:         { type: Type.NUMBER },
                    unit:        { type: Type.STRING },
                    instruction: { type: Type.STRING }
                  },
                  required: ["food_id", "qty", "unit"]
                }
              }
            },
            required: ["meal_name", "day_no"]
          }
        }
      },
      required: ["goal_type", "meals"]
    }
  },
  {
    name: "create_exercise_plan",
    description: "Create a personalized workout/exercise plan for the user and save it to the database. Use the exercise IDs provided in the system context.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        goal_type: { type: Type.STRING },
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              exercise_id: { type: Type.NUMBER },
              day_number:  { type: Type.NUMBER, description: "1=Mon ... 7=Sun" },
              sets:        { type: Type.NUMBER },
              reps:        { type: Type.STRING },
              instruction: { type: Type.STRING }
            },
            required: ["exercise_id", "day_number"]
          }
        }
      },
      required: ["goal_type", "exercises"]
    }
  },
  {
    name: "get_my_meal_plans",
    description: "Fetch the user's existing meal plans with all meals and food items. Use this BEFORE modifying a plan.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "modify_meal_plan",
    description: "Modify an existing meal plan by replacing its meals entirely. MUST call get_my_meal_plans first to get the plan_id.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        plan_id: { type: Type.NUMBER },
        change_summary: { type: Type.STRING },
        meals: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              meal_name: { type: Type.STRING },
              meal_time: { type: Type.STRING },
              day_no:    { type: Type.NUMBER },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { food_id: { type: Type.NUMBER }, qty: { type: Type.NUMBER }, unit: { type: Type.STRING }, instruction: { type: Type.STRING } },
                  required: ["food_id", "qty", "unit"]
                }
              }
            },
            required: ["meal_name", "day_no"]
          }
        }
      },
      required: ["plan_id", "meals", "change_summary"]
    }
  },
  {
    name: "get_my_exercise_plans",
    description: "Fetch the user's existing exercise plans. Use this BEFORE modifying an exercise plan.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "modify_exercise_plan",
    description: "Modify an existing exercise plan. MUST call get_my_exercise_plans first.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        plan_id: { type: Type.NUMBER },
        change_summary: { type: Type.STRING },
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { exercise_id: { type: Type.NUMBER }, day_number: { type: Type.NUMBER }, sets: { type: Type.NUMBER }, reps: { type: Type.STRING }, instruction: { type: Type.STRING } },
            required: ["exercise_id", "day_number"]
          }
        }
      },
      required: ["plan_id", "exercises", "change_summary"]
    }
  },
  {
    name: "update_user_targets",
    description: "Update the user's daily nutrition targets, sleep hours goal, or water cups goal.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        target_calories:    { type: Type.NUMBER },
        target_protein_g:   { type: Type.NUMBER },
        target_carbs_g:     { type: Type.NUMBER },
        target_fat_g:       { type: Type.NUMBER },
        sleep_hours_target: { type: Type.NUMBER },
        water_cups_target:  { type: Type.NUMBER },
        weight_kg:          { type: Type.NUMBER },
        height_cm:          { type: Type.NUMBER },
        activity_rate:      { type: Type.NUMBER },
        goal:               { type: Type.STRING },
        change_summary:     { type: Type.STRING }
      },
      required: ["change_summary"]
    }
  }
];


// ─── Tool Executor ───────────────────────────────────────────────────────────

async function executeTool(call, username) {
  const args = call.args;

  if (call.name === "recommend_doctors_near_address") {
    const keyword = args.location_keyword || "";
    const [docs] = await pool.query(
      `SELECT doctor_username, first_name, last_name, address, certification
       FROM doctor WHERE address LIKE ? LIMIT 5`,
      [`%${keyword}%`]
    );
    if (docs.length === 0) {
      return { success: false, message: `No doctors found near "${keyword}".` };
    }
    const list = docs.map(d =>
      `Dr. ${d.first_name || ""} ${d.last_name || ""} (@${d.doctor_username}) — ${d.certification || "General"} — ${d.address || "No address"}`
    ).join("\n");
    return { success: true, message: `Found ${docs.length} doctor(s) near "${keyword}":\n${list}` };
  }

  if (call.name === "forward_to_doctor") {
    try {
      await pool.query(
        `INSERT IGNORE INTO user_doctor_consultation (user_username, doctor_username, status) VALUES (?, ?, 'accepted')`,
        [username, args.doctor_username]
      );
      return { success: true, message: `You have been linked to Dr. ${args.doctor_username}. You can now chat with them directly in the Clinician Chat section.` };
    } catch (e) {
      return { success: false, message: "Failed to link to doctor: " + e.message };
    }
  }

  if (call.name === "create_meal_plan") {
    try {
      const planId = await planModel.createPlanForUser(username, null, {
        goal_type:        args.goal_type,
        target_calories:  args.target_calories,
        target_protein_g: args.target_protein_g,
        target_carbs_g:   args.target_carbs_g,
        target_fat_g:     args.target_fat_g,
        notes:            args.notes,
        start_date:       args.start_date,
        end_date:         args.end_date,
      });

      if (args.meals && Array.isArray(args.meals)) {
        for (const meal of args.meals) {
          const mealId = await planModel.createMealForPlan(planId, meal);
          if (meal.items && Array.isArray(meal.items)) {
            for (const item of meal.items) {
              await planModel.createMealItem(mealId, item);
            }
          }
        }
      }
      return { success: true, plan_id: planId, message: `Meal plan created successfully (Plan ID: ${planId}).` };
    } catch (e) {
      return { success: false, message: "Failed to create meal plan: " + e.message };
    }
  }

  if (call.name === "create_exercise_plan") {
    try {
      const planId = await planModel.createExercisePlanForUser(username, null, { goal_type: args.goal_type });

      if (args.exercises && Array.isArray(args.exercises)) {
        for (const ex of args.exercises) {
          await planModel.createPlanExercise(planId, ex);
        }
      }
      return { success: true, exercise_plan_id: planId, message: `Exercise plan created successfully (Plan ID: ${planId}).` };
    } catch (e) {
      return { success: false, message: "Failed to create exercise plan: " + e.message };
    }
  }

  if (call.name === "get_my_meal_plans") {
    try {
      const plans = await planModel.getPlansByUsername(username);
      if (plans.length === 0) return { success: true, message: "The user has no meal plans yet.", plans: [] };
      const detailed = [];
      for (const p of plans) {
        const full = await planModel.getFullPlanWithItems(p.plan_id);
        detailed.push(full);
      }
      const summary = detailed.map(p => {
        const mealSummary = (p.meals || []).map(m =>
          `    Day ${m.day_no} — ${m.meal_name}: ` +
          (m.items || []).map(i => `${i.food_name} (${i.qty} ${i.unit})`).join(", ")
        ).join("\n");
        return `Plan ID:${p.plan_id} | ${p.goal_type || "Custom"} | ${p.target_calories || "?"}kcal\n${mealSummary}`;
      }).join("\n\n");
      return { success: true, message: `User has ${detailed.length} meal plan(s):\n\n${summary}`, plans: detailed };
    } catch (e) {
      return { success: false, message: "Failed to fetch meal plans: " + e.message };
    }
  }

  if (call.name === "modify_meal_plan") {
    try {
      // Verify the plan belongs to this user
      const plan = await planModel.getPlanById(args.plan_id);
      if (!plan || plan.user_username !== username) {
        return { success: false, message: "Plan not found or you do not have permission to modify it." };
      }
      await planModel.replacePlanMeals(args.plan_id, args.meals);
      return {
        success: true,
        plan_id: args.plan_id,
        action: "meal_plan_modified",
        message: `✅ Meal plan updated! Changes: ${args.change_summary}`
      };
    } catch (e) {
      return { success: false, message: "Failed to modify meal plan: " + e.message };
    }
  }

  if (call.name === "get_my_exercise_plans") {
    try {
      const plans = await planModel.getExercisePlansByUsername(username);
      if (plans.length === 0) return { success: true, message: "The user has no exercise plans yet.", plans: [] };
      const detailed = [];
      for (const p of plans) {
        const full = await planModel.getFullExercisePlanWithExercises(p.plan_id);
        detailed.push(full);
      }
      const summary = detailed.map(p => {
        const exSummary = (p.exercises || []).map(e =>
          `    Day ${e.day_number} — ${e.name}: ${e.sets || "?"}×${e.reps || "?"}`
        ).join("\n");
        return `Plan ID:${p.plan_id} | ${p.goal_type || "Workout"}\n${exSummary}`;
      }).join("\n\n");
      return { success: true, message: `User has ${detailed.length} exercise plan(s):\n\n${summary}`, plans: detailed };
    } catch (e) {
      return { success: false, message: "Failed to fetch exercise plans: " + e.message };
    }
  }

  if (call.name === "modify_exercise_plan") {
    try {
      const plan = await planModel.getExercisePlanById(args.plan_id);
      if (!plan || plan.user_username !== username) {
        return { success: false, message: "Exercise plan not found or permission denied." };
      }
      await planModel.replaceExercisePlanExercises(args.plan_id, args.exercises);
      return {
        success: true,
        exercise_plan_id: args.plan_id,
        action: "exercise_plan_modified",
        message: `✅ Workout plan updated! Changes: ${args.change_summary}`
      };
    } catch (e) {
      return { success: false, message: "Failed to modify exercise plan: " + e.message };
    }
  }

  if (call.name === "update_user_targets") {
    try {
      const { change_summary, ...fields } = args;
      await requirementModel.patchTargetsByUsername(username, fields);
      const parts = [];
      if (fields.target_calories) parts.push(`${fields.target_calories} kcal`);
      if (fields.target_protein_g) parts.push(`protein ${fields.target_protein_g}g`);
      if (fields.target_carbs_g) parts.push(`carbs ${fields.target_carbs_g}g`);
      if (fields.target_fat_g) parts.push(`fat ${fields.target_fat_g}g`);
      if (fields.sleep_hours_target) parts.push(`sleep ${fields.sleep_hours_target}h`);
      if (fields.water_cups_target) parts.push(`water ${fields.water_cups_target} cups`);
      if (fields.weight_kg) parts.push(`weight ${fields.weight_kg}kg`);
      if (fields.height_cm) parts.push(`height ${fields.height_cm}cm`);
      if (fields.goal) parts.push(`goal ${fields.goal}`);
      const detail = parts.length ? ` → ${parts.join(', ')}` : '';
      return {
        success: true,
        action: "targets_updated",
        message: `✅ Your daily targets have been updated${detail}. Changes: ${change_summary}`
      };
    } catch (e) {
      return { success: false, message: "Failed to update targets: " + e.message };
    }
  }

  return { success: false, message: "Unknown tool: " + call.name };
}

// ─── Main Chat Handler ───────────────────────────────────────────────────────

// ─── Token Helpers ───────────────────────────────────────────────────────────
async function checkAndDeductToken(username) {
  // Ensure row exists
  await pool.query(
    `INSERT INTO user_ai_tokens (user_username, tokens_left, last_reset_at)
     VALUES (?, 50, CURDATE())
     ON DUPLICATE KEY UPDATE
       tokens_left   = IF(last_reset_at < CURDATE(), 50, tokens_left),
       last_reset_at = IF(last_reset_at < CURDATE(), CURDATE(), last_reset_at)`,
    [username]
  );
  const [[row]] = await pool.query(`SELECT tokens_left FROM user_ai_tokens WHERE user_username=?`, [username]);
  if (row.tokens_left <= 0) return { allowed: false, tokens_left: 0 };
  await pool.query(`UPDATE user_ai_tokens SET tokens_left = tokens_left - 1 WHERE user_username=?`, [username]);
  return { allowed: true, tokens_left: row.tokens_left - 1 };
}

async function getTokens(username) {
  await pool.query(
    `INSERT INTO user_ai_tokens (user_username, tokens_left, last_reset_at)
     VALUES (?, 50, CURDATE())
     ON DUPLICATE KEY UPDATE
       tokens_left   = IF(last_reset_at < CURDATE(), 50, tokens_left),
       last_reset_at = IF(last_reset_at < CURDATE(), CURDATE(), last_reset_at)`,
    [username]
  );
  const [[row]] = await pool.query(`SELECT tokens_left FROM user_ai_tokens WHERE user_username=?`, [username]);
  return row.tokens_left;
}

const handleAgentChat = async (req, res) => {
  try {
    // Guard: reject early if key is clearly invalid
    if (!_geminiKey) {
      return res.status(503).json({
        success: false,
        type: 'config_error',
        message: '⚠️ The AI assistant is not configured yet. Please ask the administrator to set a valid GEMINI_API_KEY in the server .env file.'
      });
    }
    const client = new GoogleGenAI({ apiKey: _geminiKey });
    const username = req.user.username;

    // 0. Token gate (only for paid tiers)
    const tier = req.user.subscription_tier ||
      (await pool.query(`SELECT subscription_tier FROM user_account WHERE user_username=?`, [username]).then(([r]) => r[0]?.subscription_tier || 'default'));
    if (tier !== 'default') {
      const tokenCheck = await checkAndDeductToken(username);
      if (!tokenCheck.allowed) {
        return res.json({
          success: false,
          type: 'token_limit',
          tokens_left: 0,
          message: '⚠️ You have used all 50 AI tokens for today. Tokens reset at midnight UTC. Come back tomorrow!'
        });
      }
    }

    // 1. Load user context
    const [userProfile, medicalHistory, requirements, weightLogs] = await Promise.all([
      userModel.getUserProfileByUsername(username),
      medicalModel.getMedicalHistoryByUsername(username),
      pool.query(`SELECT * FROM user_requirement WHERE user_username = ?`, [username]).then(([r]) => r[0] || null),
      trackingModel.getWeightLog(username, 5)
    ]);

    // 2. Calculate BMR/TDEE/Macros if we have enough data
    let nutritionContext = "";
    if (requirements && userProfile) {
      const age = calcAge(userProfile.dob);
      if (requirements.weight_kg && requirements.height_cm && age) {
        const bmr  = calcBMR(requirements.weight_kg, requirements.height_cm, age, userProfile.gender || "Male");
        const tdee = calcTDEE(bmr, requirements.activity_rate);
        const macros = calcMacros(tdee, requirements.goal);
        nutritionContext = `
CALCULATED NUTRITION TARGETS (use these exact numbers, do not invent):
  BMR:      ${Math.round(bmr)} kcal/day
  TDEE:     ${tdee} kcal/day
  Goal:     ${requirements.goal || "maintenance"}
  Target Calories: ${macros.calories} kcal
  Protein:  ${macros.protein_g}g | Carbs: ${macros.carbs_g}g | Fat: ${macros.fat_g}g
  Current Weight: ${requirements.weight_kg}kg | Height: ${requirements.height_cm}cm
  Target Weight:  ${requirements.target_weight_kg || "Not set"}kg`;
      }
    }

    // 3. Load reference data for AI to use
    const [foods, exercises] = await Promise.all([loadFoodSample(40), loadExerciseSample(25)]);
    const foodList    = foods.map(f    => `  ID:${f.food_id} | ${f.food_name} | ${f.calories || "?"}kcal/serving | P:${f.protein || 0}g C:${f.carbs || 0}g F:${f.fat || 0}g`).join("\n");
    const exerciseList = exercises.map(e => `  ID:${e.exercise_id} | ${e.name} | ${e.category || "General"}`).join("\n");

    // 3b. Load user's medical records (uploaded files / diabetes info)
    const [medicalRecords] = await pool.query(
      `SELECT condition_name, condition_type, extra_info FROM user_medical_record WHERE user_username=? ORDER BY created_at DESC`,
      [username]
    );
    const medRecCtx = medicalRecords.length > 0
      ? medicalRecords.map(r => `  - ${r.condition_name} (${r.condition_type || 'other'}): ${r.extra_info || 'No extra info'}`).join("\n")
      : "  None uploaded.";

    const weightLogCtx = weightLogs && weightLogs.length > 0
      ? weightLogs.map(w => `  - ${new Date(w.logged_at).toISOString().split('T')[0]}: ${w.weight_kg}kg (${w.notes || ''})`).join("\n")
      : "  No past weight logs.";

    // 4. Medical/allergy context
    const allergyCtx = medicalHistory.length > 0
      ? medicalHistory.map(h => `  - ${h.condition_name} (Severity: ${h.severity})`).join("\n")
      : "  None reported.";

    // 5. Build rich system instruction
    // Get current token count to show in context
    const tokensLeft = tier !== 'default' ? await getTokens(username) : 50;

    const systemInstruction = `You are Healix AI, an intelligent personal health and nutrition assistant.

USER PROFILE:
  Name:         ${userProfile ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() || username : username}
  Username:     ${username}
  Age:          ${userProfile?.dob ? calcAge(userProfile.dob) : "Unknown"}
  Gender:       ${userProfile?.gender || "Not specified"}
  Activity Lvl: ${requirements?.activity_rate || "sedentary"}
  Location:     ${userProfile?.address || "Not provided"}
  Subscription: ${userProfile?.subscription_tier || "default"}
AI Tokens Remaining Today: ${tokensLeft}/50
${nutritionContext}

PAST WEIGHT LOGS:
${weightLogCtx}

MEDICAL CONDITIONS & ALLERGIES (from doctor records):
${allergyCtx}

USER-UPLOADED MEDICAL RECORDS (diabetes, diseases, etc. — CRITICAL: always respect these when creating plans):
${medRecCtx}

AVAILABLE FOODS IN DATABASE (use these food_ids when creating meal plans):
${foodList || "  No foods in database yet."}

AVAILABLE EXERCISES IN DATABASE (use these exercise_ids when creating exercise plans):
${exerciseList || "  No exercises in database yet."}

YOUR CAPABILITIES:
  1. Answer nutrition, fitness, and health questions
  2. Create personalized meal plans using create_meal_plan tool
  3. Modify existing meal plans using get_my_meal_plans then modify_meal_plan tool
  4. Create personalized exercise plans using create_exercise_plan tool
  5. Modify existing exercise plans using get_my_exercise_plans then modify_exercise_plan tool
  6. Recommend doctors using recommend_doctors_near_address tool
  7. Link the user to a doctor using forward_to_doctor tool
  8. Update the user's daily targets (calories, macros, sleep, water) using update_user_targets tool

RULES:
  - ALWAYS use the calculated nutrition targets above (never invent calorie numbers)
  - ONLY use food_ids and exercise_ids that appear in the lists above
  - CRITICAL: Always check BOTH medical history and user-uploaded medical records. For diabetes, heart disease, kidney issues, or any serious condition — adjust plans accordingly (e.g., low sugar for diabetics, low sodium for heart patients)
  - DO NOT ask the user for their weight, height, age, or activity level to calculate targets. You already have this data in the profile above. Answer their questions immediately using the data provided.
  - NEVER output raw database IDs (like 'Plan ID: 45' or 'Food ID: 3') in your conversational response. They are for your internal tool use only. Refer to plans naturally as 'your plan' or foods by their name.
  - If asked to CREATE a plan and none exists → use create_meal_plan or create_exercise_plan
  - If asked to CHANGE, UPDATE, MODIFY, or ADJUST an existing plan → ALWAYS call get_my_meal_plans or get_my_exercise_plans FIRST, then call modify_meal_plan or modify_exercise_plan
  - If asked to change calorie goal, sleep target, or water goal → use update_user_targets tool
  - Keep responses concise and friendly
  - Add disclaimer: "This is not medical advice" when giving medical-adjacent recommendations
  - If subscription is 'default', gently remind the user that AI plan generation requires an upgrade`;

    // 6. Build conversation messages from history
    // 6. Build conversation messages from history
    const history = await loadHistory(username, 20);
    const messages = history.map(h => ({
      role: h.role === "assistant" ? "model" : h.role,
      parts: [{ text: h.message }]
    }));

    // 7. Add current user message
    const userMessage = req.body.message || "Hi";
    let userParts = [{ text: userMessage }];
    if (req.file) {
      const fs = require("fs");
      userParts.push({
        inlineData: {
          data: fs.readFileSync(req.file.path).toString("base64"),
          mimeType: req.file.mimetype
        }
      });
    }
    messages.push({ role: "user", parts: userParts });

    // 8. Gemini agentic loop (up to 5 tool rounds)
    let finalText = "";
    let actionType = "text";
    let actionData = {};

    for (let loop = 0; loop < 5; loop++) {
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: messages,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: AGENT_TOOLS }],
          temperature: 0.7
        }
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        messages.push(response.candidates[0].content);
        
        const toolResultsParts = [];
        for (const call of response.functionCalls) {
          const result = await executeTool(call, username);
          toolResultsParts.push({
            functionResponse: {
              name: call.name,
              response: result
            }
          });
          
          if (call.name === "create_meal_plan" && result.success)         { actionType = "meal_plan_created";    actionData = { plan_id: result.plan_id }; }
          else if (call.name === "modify_meal_plan" && result.success)    { actionType = "meal_plan_modified";   actionData = { plan_id: result.plan_id }; }
          else if (call.name === "create_exercise_plan" && result.success){ actionType = "exercise_plan_created"; actionData = { exercise_plan_id: result.exercise_plan_id }; }
          else if (call.name === "modify_exercise_plan" && result.success){ actionType = "exercise_plan_modified"; actionData = { exercise_plan_id: result.exercise_plan_id }; }
          else if (call.name === "forward_to_doctor" && result.success)   { actionType = "doctor_linked"; }
          else if (call.name === "update_user_targets" && result.success) { actionType = "targets_updated"; }
        }
        messages.push({ role: "user", parts: toolResultsParts });
      } else {
        finalText = response.text || "";
        break;
      }
    }

    finalText = finalText || "I'm here to help! Feel free to ask about nutrition, workouts, or your health goals.";

    // 9. Save to history
    await saveHistory(username, "user", userMessage);
    await saveHistory(username, "model", finalText);

    const tokensLeftAfter = tier !== 'default' ? await getTokens(username) : 50;
    res.json({ success: true, type: actionType, message: finalText, data: actionData, tokens_left: tokensLeftAfter });

  } catch (error) {
    console.error("AI Agent Error:", error);
    res.status(500).json({ success: false, error: "Failed to process your request. Please try again." });
  }
};

// ─── Get Chat History ────────────────────────────────────────────────────────

const getAgentHistory = async (req, res) => {
  try {
    const username = req.user.username;
    const history = await loadHistory(username, 50);
    res.json({ success: true, data: history });
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to fetch history." });
  }
};

// ─── Clear Chat History ──────────────────────────────────────────────────────

const clearAgentHistory = async (req, res) => {
  try {
    const username = req.user.username;
    await pool.query(`DELETE FROM ai_chat_history WHERE user_username = ?`, [username]);
    res.json({ success: true, message: "Chat history cleared." });
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to clear history." });
  }
};

// ─── One-Shot Meal Plan Generation ──────────────────────────────────────────

const generateMealPlan = async (req, res) => {
  try {
    if (!_geminiKey) {
      return res.status(503).json({ success: false, error: '⚠️ AI is not configured. Please set a valid GEMINI_API_KEY in the server .env file.' });
    }
    const username = req.user.username;

    const tier = req.user.subscription_tier ||
      (await pool.query(`SELECT subscription_tier FROM user_account WHERE user_username=?`, [username]).then(([r]) => r[0]?.subscription_tier || 'default'));
    if (tier !== 'default') {
      const tokenCheck = await checkAndDeductToken(username);
      if (!tokenCheck.allowed) {
        return res.json({
          success: false,
          error: '⚠️ You have used all 50 AI tokens for today. Tokens reset at midnight UTC. Come back tomorrow!'
        });
      }
    }

    const [userProfile, requirements, medicalHistory, medicalRecords] = await Promise.all([
      userModel.getUserProfileByUsername(username),
      pool.query(`SELECT * FROM user_requirement WHERE user_username = ?`, [username]).then(([r]) => r[0] || null),
      medicalModel.getMedicalHistoryByUsername(username),
      pool.query(`SELECT condition_name, condition_type, extra_info FROM user_medical_record WHERE user_username=? ORDER BY created_at DESC`, [username]).then(([r]) => r)
    ]);

    if (!requirements || !requirements.weight_kg || !requirements.height_cm) {
      return res.status(400).json({ success: false, error: "Please set your goals (height, weight, activity level) first in the Goals page." });
    }

    const age = calcAge(userProfile?.dob) || 25;
    const bmr  = calcBMR(requirements.weight_kg, requirements.height_cm, age, userProfile?.gender || "Male");
    const tdee = calcTDEE(bmr, requirements.activity_rate);
    const macros = calcMacros(tdee, requirements.goal);

    const foods = await loadFoodSample(40);
    const foodList = foods.map(f => `ID:${f.food_id} | ${f.food_name} | ${f.calories || "?"}kcal | P:${f.protein || 0}g C:${f.carbs || 0}g F:${f.fat || 0}g`).join("\n");

    const medRecCtx = medicalRecords.length > 0
      ? medicalRecords.map(r => `  - ${r.condition_name} (${r.condition_type || 'other'}): ${r.extra_info || 'No extra info'}`).join("\n")
      : "  None uploaded.";

    const allergyCtx = medicalHistory.length > 0
      ? medicalHistory.map(h => `  - ${h.condition_name} (Severity: ${h.severity})`).join("\n")
      : "  None reported.";

    const prompt = `Create a 7-day meal plan for this user.

User Stats:
- Goal: ${requirements.goal || "maintenance"}
- Target Calories: ${macros.calories} kcal/day
- Protein: ${macros.protein_g}g | Carbs: ${macros.carbs_g}g | Fat: ${macros.fat_g}g
- Preferences: ${requirements.preferences || "None"}
- Allergies: ${requirements.allergies || "None"}

MEDICAL CONDITIONS & ALLERGIES:
${allergyCtx}

USER-UPLOADED MEDICAL RECORDS (diabetes, diseases, etc. — CRITICAL: always adapt plans to these, e.g. low sugar for diabetics):
${medRecCtx}

AVAILABLE FOODS (use ONLY these IDs):
${foodList}

Create a 7-day plan with 4 meals per day (Breakfast, Lunch, Dinner, Snack).
IMPORTANT: When outputting serving sizes and creating meal items, output serving sizes in grams (e.g. unit="g") instead of arbitrary units (like "slice", "bowl", etc.) where possible.
Use the create_meal_plan tool with these exact food IDs.`;

    const client2 = new GoogleGenAI({ apiKey: _geminiKey });
    const response = await client2.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        tools: [{ functionDeclarations: AGENT_TOOLS }],
        temperature: 0.5
      }
    });

    let planId = null;
    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const call of response.functionCalls) {
        if (call.name === "create_meal_plan") {
          call.args.target_calories  = macros.calories;
          call.args.target_protein_g = macros.protein_g;
          call.args.target_carbs_g   = macros.carbs_g;
          call.args.target_fat_g     = macros.fat_g;
          const result = await executeTool({ name: call.name, args: call.args }, username);
          if (result.success) planId = result.plan_id;
        }
      }
    }

    await saveHistory(username, "user", "Generate a meal plan for me.");
    await saveHistory(username, "model", planId
      ? `✅ I've created a 7-day meal plan for you (${macros.calories} kcal/day targeting ${requirements.goal || "your goals"})! You can view it in the Meal Plans section.`
      : "I had trouble creating your meal plan. Please try asking me in the chat.");

    res.json({ success: !!planId, plan_id: planId, macros });

  } catch (e) {
    console.error("Generate meal plan error:", e);
    res.status(500).json({ success: false, error: "Failed to generate meal plan." });
  }
};

// ─── One-Shot Exercise Plan Generation ──────────────────────────────────────

const generateExercisePlan = async (req, res) => {
  try {
    if (!_geminiKey) {
      return res.status(503).json({ success: false, error: '⚠️ AI is not configured. Please set a valid GEMINI_API_KEY in the server .env file.' });
    }
    const username = req.user.username;

    const tier = req.user.subscription_tier ||
      (await pool.query(`SELECT subscription_tier FROM user_account WHERE user_username=?`, [username]).then(([r]) => r[0]?.subscription_tier || 'default'));
    if (tier !== 'default') {
      const tokenCheck = await checkAndDeductToken(username);
      if (!tokenCheck.allowed) {
        return res.json({
          success: false,
          error: '⚠️ You have used all 50 AI tokens for today. Tokens reset at midnight UTC. Come back tomorrow!'
        });
      }
    }

    const [userProfile, requirements, medicalHistory, medicalRecords] = await Promise.all([
      userModel.getUserProfileByUsername(username),
      pool.query(`SELECT * FROM user_requirement WHERE user_username = ?`, [username]).then(([r]) => r[0] || null),
      medicalModel.getMedicalHistoryByUsername(username),
      pool.query(`SELECT condition_name, condition_type, extra_info FROM user_medical_record WHERE user_username=? ORDER BY created_at DESC`, [username]).then(([r]) => r)
    ]);

    const exercises = await loadExerciseSample(25);
    const exerciseList = exercises.map(e => `ID:${e.exercise_id} | ${e.name} | ${e.category || "General"}`).join("\n");

    const medRecCtx = medicalRecords.length > 0
      ? medicalRecords.map(r => `  - ${r.condition_name} (${r.condition_type || 'other'}): ${r.extra_info || 'No extra info'}`).join("\n")
      : "  None uploaded.";

    const allergyCtx = medicalHistory.length > 0
      ? medicalHistory.map(h => `  - ${h.condition_name} (Severity: ${h.severity})`).join("\n")
      : "  None reported.";

    const goal = requirements?.goal || "maintenance";
    const prompt = `Create a 5-day workout plan for this user.

User Stats:
- Goal: ${goal}
- Weight: ${requirements?.weight_kg || "?"}kg

MEDICAL CONDITIONS & ALLERGIES:
${allergyCtx}

USER-UPLOADED MEDICAL RECORDS (injuries, diseases, etc. — CRITICAL: always adapt plans to these, e.g. low impact for joint issues):
${medRecCtx}

AVAILABLE EXERCISES (use ONLY these IDs):
${exerciseList}

Create a structured 5-day plan (Days 1-5). Use the create_exercise_plan tool.
Include sets, reps, and brief instructions for each exercise.`;

    const client3 = new GoogleGenAI({ apiKey: _geminiKey });
    const response = await client3.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        tools: [{ functionDeclarations: AGENT_TOOLS }],
        temperature: 0.5
      }
    });

    let planId = null;
    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const call of response.functionCalls) {
        if (call.name === "create_exercise_plan") {
          const result = await executeTool({ name: call.name, args: call.args }, username);
          if (result.success) planId = result.exercise_plan_id;
        }
      }
    }

    await saveHistory(username, "user", "Generate an exercise plan for me.");
    await saveHistory(username, "model", planId
      ? `✅ I've created a 5-day workout plan for you targeting ${goal}! View it in the Exercise Plans section.`
      : "I had trouble generating your exercise plan. Please try asking in the chat.");

    res.json({ success: !!planId, exercise_plan_id: planId });

  } catch (e) {
    console.error("Generate exercise plan error:", e);
    res.status(500).json({ success: false, error: "Failed to generate exercise plan." });
  }
};

module.exports = {
  handleAgentChat,
  getAgentHistory,
  clearAgentHistory,
  generateMealPlan,
  generateExercisePlan,
};
