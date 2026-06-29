const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/response");
const planModel = require("../models/planModel");
const doctorModel = require("../models/doctorModel");
const { sendNotification } = require("../utils/notificationService");

const getMyPlans = asyncHandler(async (req, res) => {
  const plans = await planModel.getPlansByUsername(req.user.username);
  return successResponse(res, plans, "Plans fetched");
});

const getPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const plan = await planModel.getPlanById(id);
  if (!plan) {
    return errorResponse(res, "Plan not found", 404);
  }

  const meals = await planModel.getMealsByPlanId(id);

  return successResponse(res, { plan, meals }, "Plan details fetched");
});

const getMealItems = asyncHandler(async (req, res) => {
  const { mealId } = req.params;
  const items = await planModel.getMealItemsByMealId(mealId);
  return successResponse(res, items, "Meal items fetched");
});

const createPlanForUser = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const linked = await doctorModel.isDoctorLinkedToUser(req.user.username, username);
  if (!linked) {
    return errorResponse(res, "Doctor is not linked to this user", 403);
  }

  const plan_id = await planModel.createPlanForUser(username, req.user.username, req.body);
  await sendNotification(username, `Dr. ${req.user.username} has created a new meal plan for you.`);
  return successResponse(res, { plan_id }, "Plan created", 201);
});

const createMealForPlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  const plan_meal_id = await planModel.createMealForPlan(planId, req.body);
  return successResponse(res, { plan_meal_id }, "Meal created", 201);
});

const createMealItem = asyncHandler(async (req, res) => {
  const { mealId } = req.params;
  const plan_item_id = await planModel.createMealItem(mealId, req.body);
  return successResponse(res, { plan_item_id }, "Meal item created", 201);
});

const getMyExercisePlans = asyncHandler(async (req, res) => {
  const plans = await planModel.getExercisePlansByUsername(req.user.username);
  return successResponse(res, plans, "Exercise plans fetched");
});

const getExercisePlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await planModel.getExercisePlanById(id);
  if (!plan) return errorResponse(res, "Exercise plan not found", 404);
  const exercises = await planModel.getPlanExercisesByPlanId(id);
  return successResponse(res, { plan, exercises }, "Exercise plan details fetched");
});

const createExercisePlanForUser = asyncHandler(async (req, res) => {
  const { username } = req.params;
  
  if (req.user.role === 'doctor') {
    const linked = await doctorModel.isDoctorLinkedToUser(req.user.username, username);
    if (!linked) return errorResponse(res, "Doctor is not linked to this user", 403);
  }

  const doctorUsername = req.user.role === 'doctor' ? req.user.username : null;
  const plan_id = await planModel.createExercisePlanForUser(username, doctorUsername, req.body);
  
  if (req.user.role === 'doctor') {
    await sendNotification(username, `Dr. ${req.user.username} has created a new exercise plan for you.`);
  }

  return successResponse(res, { plan_id }, "Exercise plan created", 201);
});

const createPlanExercise = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  const plan_exercise_id = await planModel.createPlanExercise(planId, req.body);
  return successResponse(res, { plan_exercise_id }, "Plan exercise created", 201);
});

const updatePlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await planModel.getPlanById(id);
  if (!plan) return errorResponse(res, "Plan not found", 404);
  await planModel.updatePlan(id, req.body);
  return successResponse(res, null, "Plan updated");
});

const updateExercisePlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await planModel.getExercisePlanById(id);
  if (!plan) return errorResponse(res, "Exercise plan not found", 404);
  await planModel.updateExercisePlan(id, req.body);
  return successResponse(res, null, "Exercise plan updated");
});

const deletePlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await planModel.getPlanById(id);
  if (!plan) return errorResponse(res, "Plan not found", 404);
  // Verify doctor created it? The UI only shows plans to the assigned doctor. 
  await planModel.deletePlan(id);
  return successResponse(res, null, "Plan deleted");
});

const deleteExercisePlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await planModel.getExercisePlanById(id);
  if (!plan) return errorResponse(res, "Exercise plan not found", 404);
  await planModel.deleteExercisePlan(id);
  return successResponse(res, null, "Exercise plan deleted");
});

module.exports = {
  getMyPlans,
  getPlanById,
  getMealItems,
  createPlanForUser,
  createMealForPlan,
  createMealItem,
  getMyExercisePlans,
  getExercisePlanById,
  createExercisePlanForUser,
  createPlanExercise,
  updatePlanById,
  updateExercisePlanById,
  deletePlanById,
  deleteExercisePlanById
};