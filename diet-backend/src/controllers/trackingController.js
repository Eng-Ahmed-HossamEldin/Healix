const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/response");
const trackingModel = require("../models/trackingModel");

// ─── FOOD LOG ─────────────────────────────────────────────────────────────────

const getFoodLog = asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().split("T")[0];
  const logs = await trackingModel.getFoodLog(req.user.username, date);
  return successResponse(res, logs, "Food log fetched");
});

const addFoodLog = asyncHandler(async (req, res) => {
  const logId = await trackingModel.addFoodLog(req.user.username, req.body);
  return successResponse(res, { log_id: logId }, "Food logged", 201);
});

const deleteFoodLog = asyncHandler(async (req, res) => {
  const deleted = await trackingModel.deleteFoodLog(req.params.id, req.user.username);
  if (!deleted) return errorResponse(res, "Log not found", 404);
  return successResponse(res, null, "Food log deleted");
});

// ─── WEIGHT ───────────────────────────────────────────────────────────────────

const getWeightLog = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const logs = await trackingModel.getWeightLog(req.user.username, limit);
  return successResponse(res, logs, "Weight log fetched");
});

const addWeightLog = asyncHandler(async (req, res) => {
  if (!req.body.weight_kg) return errorResponse(res, "weight_kg is required", 400);
  const logId = await trackingModel.addWeightLog(req.user.username, req.body);
  return successResponse(res, { log_id: logId }, "Weight logged", 201);
});

// ─── WATER ────────────────────────────────────────────────────────────────────

const getWaterLog = asyncHandler(async (req, res) => {
  const data = await trackingModel.getWaterLog(req.user.username);
  return successResponse(res, data, "Water log fetched");
});

const logWater = asyncHandler(async (req, res) => {
  const { cups } = req.body;
  if (cups === undefined) return errorResponse(res, "cups is required", 400);
  await trackingModel.upsertWaterLog(req.user.username, cups);
  return successResponse(res, null, "Water logged");
});

// ─── SLEEP ────────────────────────────────────────────────────────────────────

const getSleepLog = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 7;
  const logs = await trackingModel.getSleepLog(req.user.username, limit);
  return successResponse(res, logs, "Sleep log fetched");
});

const addSleepLog = asyncHandler(async (req, res) => {
  if (!req.body.hours) return errorResponse(res, "hours is required", 400);
  const logId = await trackingModel.addSleepLog(req.user.username, req.body);
  return successResponse(res, { log_id: logId }, "Sleep logged", 201);
});

// ─── STEPS ────────────────────────────────────────────────────────────────────

const getStepLog = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 7;
  const logs = await trackingModel.getStepLog(req.user.username, limit);
  return successResponse(res, logs, "Step log fetched");
});

const logSteps = asyncHandler(async (req, res) => {
  if (!req.body.steps) return errorResponse(res, "steps is required", 400);
  await trackingModel.upsertStepLog(req.user.username, req.body);
  return successResponse(res, null, "Steps logged");
});

// ─── EXERCISE ─────────────────────────────────────────────────────────────────

const getExerciseLog = asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().split("T")[0];
  const logs = await trackingModel.getExerciseLog(req.user.username, date);
  return successResponse(res, logs, "Exercise log fetched");
});

const addExerciseLog = asyncHandler(async (req, res) => {
  if (!req.body.exercise_name) return errorResponse(res, "exercise_name is required", 400);
  const logId = await trackingModel.addExerciseLog(req.user.username, req.body);
  return successResponse(res, { log_id: logId }, "Exercise logged", 201);
});

const deleteExerciseLog = asyncHandler(async (req, res) => {
  const deleted = await trackingModel.deleteExerciseLog(req.params.id, req.user.username);
  if (!deleted) return errorResponse(res, "Log not found", 404);
  return successResponse(res, null, "Exercise log deleted");
});

// ─── DASHBOARD SUMMARY ────────────────────────────────────────────────────────

const getDailySummary = asyncHandler(async (req, res) => {
  const summary = await trackingModel.getDailySummary(req.user.username, req.query.date);
  return successResponse(res, summary, "Daily summary fetched");
});

module.exports = {
  getFoodLog, addFoodLog, deleteFoodLog,
  getWeightLog, addWeightLog,
  getWaterLog, logWater,
  getSleepLog, addSleepLog,
  getStepLog, logSteps,
  getExerciseLog, addExerciseLog, deleteExerciseLog,
  getDailySummary,
};
