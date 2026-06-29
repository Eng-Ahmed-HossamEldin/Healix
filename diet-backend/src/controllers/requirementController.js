const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response");
const requirementModel = require("../models/requirementModel");

const getMyRequirements = asyncHandler(async (req, res) => {
  const requirements = await requirementModel.getRequirementsByUsername(req.user.username);
  return successResponse(res, requirements, "Requirements fetched");
});

const upsertMyRequirements = asyncHandler(async (req, res) => {
  const result = await requirementModel.upsertRequirementsByUsername(req.user.username, req.body);

  // Always return the saved row so the frontend has accurate DB state
  const saved = await requirementModel.getRequirementsByUsername(req.user.username);

  if (result === "created") {
    return successResponse(res, saved, "Requirements created", 201);
  }

  return successResponse(res, saved, "Requirements updated");
});

module.exports = {
  getMyRequirements,
  upsertMyRequirements
};