const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/response");
const communityModel = require("../models/communityModel");

// ─── HABITS ───────────────────────────────────────────────────────────────────

const getHabits = asyncHandler(async (req, res) => {
  const habits = await communityModel.getHabits(req.user.username);
  return successResponse(res, habits, "Habits fetched");
});

const createHabit = asyncHandler(async (req, res) => {
  if (!req.body.habit_name) return errorResponse(res, "habit_name is required", 400);
  const id = await communityModel.createHabit(req.user.username, req.body);
  return successResponse(res, { habit_id: id }, "Habit created", 201);
});

const deleteHabit = asyncHandler(async (req, res) => {
  const deleted = await communityModel.deleteHabit(req.params.id, req.user.username);
  if (!deleted) return errorResponse(res, "Habit not found", 404);
  return successResponse(res, null, "Habit deleted");
});

const completeHabit = asyncHandler(async (req, res) => {
  await communityModel.completeHabit(req.params.id, req.user.username);
  return successResponse(res, null, "Habit completed");
});

const uncompleteHabit = asyncHandler(async (req, res) => {
  await communityModel.uncompleteHabit(req.params.id, req.user.username);
  return successResponse(res, null, "Habit uncompleted");
});

// ─── FASTING ─────────────────────────────────────────────────────────────────

const getActiveFasting = asyncHandler(async (req, res) => {
  const session = await communityModel.getActiveFasting(req.user.username);
  return successResponse(res, session, "Active fast fetched");
});

const getFastingHistory = asyncHandler(async (req, res) => {
  const history = await communityModel.getFastingHistory(req.user.username);
  return successResponse(res, history, "Fasting history fetched");
});

const startFasting = asyncHandler(async (req, res) => {
  const id = await communityModel.startFasting(req.user.username, req.body);
  return successResponse(res, { session_id: id }, "Fasting started", 201);
});

const endFasting = asyncHandler(async (req, res) => {
  const ended = await communityModel.endFasting(req.user.username);
  if (!ended) return errorResponse(res, "No active fasting session", 404);
  return successResponse(res, null, "Fasting completed");
});

// ─── COMMUNITY ───────────────────────────────────────────────────────────────

const getPosts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const posts = await communityModel.getPosts(limit, offset);
  return successResponse(res, posts, "Posts fetched");
});

const createPost = asyncHandler(async (req, res) => {
  if (!req.body.content) return errorResponse(res, "content is required", 400);
  const id = await communityModel.createPost(req.user.username, req.body);
  return successResponse(res, { post_id: id }, "Post created", 201);
});

const likePost = asyncHandler(async (req, res) => {
  await communityModel.likePost(req.params.id);
  return successResponse(res, null, "Post liked");
});

const getChallenges = asyncHandler(async (req, res) => {
  const challenges = await communityModel.getChallenges();
  return successResponse(res, challenges, "Challenges fetched");
});

const joinChallenge = asyncHandler(async (req, res) => {
  await communityModel.joinChallenge(req.params.id, req.user.username);
  return successResponse(res, null, "Joined challenge");
});

const getMyChallenges = asyncHandler(async (req, res) => {
  const challenges = await communityModel.getMyChallenges(req.user.username);
  return successResponse(res, challenges, "My challenges fetched");
});

module.exports = {
  getHabits, createHabit, deleteHabit, completeHabit, uncompleteHabit,
  getActiveFasting, getFastingHistory, startFasting, endFasting,
  getPosts, createPost, likePost, getChallenges, joinChallenge, getMyChallenges,
};
