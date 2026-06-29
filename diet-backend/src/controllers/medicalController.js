const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/response");
const medicalModel = require("../models/medicalModel");
const doctorModel = require("../models/doctorModel");

const getMyMedicalHistory = asyncHandler(async (req, res) => {
  const history = await medicalModel.getMedicalHistoryByUsername(req.user.username);
  return successResponse(res, history, "Medical history fetched");
});

const getConditions = asyncHandler(async (req, res) => {
  const conditions = await medicalModel.getConditions();
  return successResponse(res, conditions, "Conditions fetched");
});

const createCondition = asyncHandler(async (req, res) => {
  const condition_id = await medicalModel.createCondition(req.body);
  return successResponse(res, { condition_id }, "Condition created", 201);
});

const getRulesByConditionId = asyncHandler(async (req, res) => {
  const { conditionId } = req.params;
  const rules = await medicalModel.getRulesByConditionId(conditionId);
  return successResponse(res, rules, "Condition diet rules fetched");
});

const createRuleForCondition = asyncHandler(async (req, res) => {
  const { conditionId } = req.params;
  const rule_id = await medicalModel.createRuleForCondition(conditionId, req.body);
  return successResponse(res, { rule_id }, "Condition diet rule created", 201);
});

const addMedicalHistoryForUser = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const linked = await doctorModel.isDoctorLinkedToUser(req.user.username, username);
  if (!linked) {
    return errorResponse(res, "Doctor is not linked to this user", 403);
  }

  await medicalModel.addMedicalHistoryForUser(username, req.user.username, req.body);
  return successResponse(res, null, "Medical history entry added", 201);
});

module.exports = {
  getMyMedicalHistory,
  getConditions,
  createCondition,
  getRulesByConditionId,
  createRuleForCondition,
  addMedicalHistoryForUser
};