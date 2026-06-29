const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response");
const contentModel = require("../models/contentModel");

const getRecipes = asyncHandler(async (req, res) => {
  const recipes = await contentModel.getRecipes();
  return successResponse(res, recipes, "Recipes fetched");
});

const getExercises = asyncHandler(async (req, res) => {
  const exercises = await contentModel.getExercises();
  return successResponse(res, exercises, "Exercises fetched");
});

module.exports = {
  getRecipes,
  getExercises
};
