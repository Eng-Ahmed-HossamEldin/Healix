const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');
const adminModel = require('../models/adminModel');
const foodModel  = require('../models/foodModel');

const getStats = asyncHandler(async (req, res) => {
  const stats = await adminModel.getPlatformStats();
  return successResponse(res, stats, 'Stats fetched');
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await adminModel.getAllUsers();
  return successResponse(res, users, 'Users fetched');
});

const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await adminModel.getAllDoctors();
  return successResponse(res, doctors, 'Doctors fetched');
});

const updateSubscription = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { tier, durationDays, doctor_username } = req.body;
  if (!['default','pro','doctor'].includes(tier)) {
    return errorResponse(res, 'Invalid tier', 400);
  }
  await adminModel.updateUserSubscription(username, tier, durationDays || 30, doctor_username || null);
  return successResponse(res, null, 'Subscription updated');
});

const addFood = asyncHandler(async (req, res) => {
  const food_id = await adminModel.addFood(req.body);
  return successResponse(res, { food_id }, 'Food added', 201);
});

const getAllFoods = asyncHandler(async (req, res) => {
  const foods = await adminModel.getAllFoods();
  return successResponse(res, foods, 'Foods fetched');
});

const updateFood = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  await adminModel.updateFood(foodId, req.body);
  return successResponse(res, null, 'Food updated');
});

const deleteFood = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  await adminModel.deleteFood(foodId);
  return successResponse(res, null, 'Food deleted');
});

const getAllRecipes = asyncHandler(async (req, res) => {
  const recipes = await adminModel.getAllRecipes();
  return successResponse(res, recipes, 'Recipes fetched');
});

const addRecipe = asyncHandler(async (req, res) => {
  const recipe_id = await adminModel.addRecipe(req.body);
  return successResponse(res, { recipe_id }, 'Recipe added', 201);
});

const updateRecipe = asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  await adminModel.updateRecipe(recipeId, req.body);
  return successResponse(res, null, 'Recipe updated');
});

const deleteRecipe = asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  await adminModel.deleteRecipe(recipeId);
  return successResponse(res, null, 'Recipe deleted');
});

const getAllExercises = asyncHandler(async (req, res) => {
  const exercises = await adminModel.getAllExercises();
  return successResponse(res, exercises, 'Exercises fetched');
});

const addExercise = asyncHandler(async (req, res) => {
  const exercise_id = await adminModel.addExercise(req.body);
  return successResponse(res, { exercise_id }, 'Exercise added', 201);
});

const updateExercise = asyncHandler(async (req, res) => {
  const { exerciseId } = req.params;
  await adminModel.updateExercise(exerciseId, req.body);
  return successResponse(res, null, 'Exercise updated');
});

const deleteExercise = asyncHandler(async (req, res) => {
  const { exerciseId } = req.params;
  await adminModel.deleteExercise(exerciseId);
  return successResponse(res, null, 'Exercise deleted');
});

const promoteToDoctor = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { certification } = req.body;
  
  // Get user data
  const [userRows] = await require('../config/db').query(`SELECT * FROM user_account WHERE user_username = ?`, [username]);
  if (userRows.length === 0) return errorResponse(res, 'User not found', 404);
  const u = userRows[0];

  // Insert into doctor table
  await require('../config/db').query(
    `INSERT INTO doctor (doctor_username, email, password_hash, first_name, last_name, phone_no, address, gender, dob, certification)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [u.user_username, u.email, u.password_hash, u.first_name, u.last_name, u.phone_no, u.address, u.gender, u.dob, certification || 'General']
  );

  // Delete from user table to migrate fully
  await require('../config/db').query(`DELETE FROM user_account WHERE user_username = ?`, [username]);

  return successResponse(res, null, 'User promoted to doctor');
});

const downgradeDoctor = asyncHandler(async (req, res) => {
  const { username } = req.params;

  // Get doctor data
  const [docRows] = await require('../config/db').query(`SELECT * FROM doctor WHERE doctor_username = ?`, [username]);
  if (docRows.length === 0) return errorResponse(res, 'Doctor not found', 404);
  const d = docRows[0];

  // Insert into user table
  await require('../config/db').query(
    `INSERT INTO user_account (user_username, email, password_hash, first_name, last_name, phone_no, address, gender, dob)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [d.doctor_username, d.email, d.password_hash, d.first_name, d.last_name, d.phone_no, d.address, d.gender, d.dob]
  );

  // Delete from doctor table to migrate fully
  await require('../config/db').query(`DELETE FROM doctor WHERE doctor_username = ?`, [username]);

  return successResponse(res, null, 'Doctor downgraded to user');
});

const deleteUser = asyncHandler(async (req, res) => {
  const { username } = req.params;
  await adminModel.deleteUser(username);
  return successResponse(res, null, 'User deleted');
});

const deleteDoctor = asyncHandler(async (req, res) => {
  const { username } = req.params;
  await adminModel.deleteDoctor(username);
  return successResponse(res, null, 'Doctor deleted');
});

const getAllDietPlans = asyncHandler(async (req, res) => {
  const plans = await adminModel.getAllDietPlans();
  return successResponse(res, plans, 'Plans fetched');
});

const addDietPlan = asyncHandler(async (req, res) => {
  const planId = await adminModel.addDietPlan(req.body);
  return successResponse(res, { planId }, 'Plan added', 201);
});

const updateDietPlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  await adminModel.updateDietPlan(planId, req.body);
  return successResponse(res, null, 'Plan updated');
});

const deleteDietPlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  await adminModel.deleteDietPlan(planId);
  return successResponse(res, null, 'Plan deleted');
});

module.exports = { 
  getStats, 
  getUsers, 
  getDoctors, 
  updateSubscription, 
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
  promoteToDoctor, 
  downgradeDoctor,
  deleteUser,
  deleteDoctor,
  getAllDietPlans,
  addDietPlan,
  updateDietPlan,
  deleteDietPlan
};
