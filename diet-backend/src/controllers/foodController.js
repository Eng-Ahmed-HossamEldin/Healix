const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/response");
const foodModel = require("../models/foodModel");

const getFoods = asyncHandler(async (req, res) => {
  const search = req.query.search || "";
  const foods = await foodModel.getFoods(search);
  return successResponse(res, foods, "Foods fetched");
});

const getFoodById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const food = await foodModel.getFoodById(id);
  if (!food) {
    return errorResponse(res, "Food not found", 404);
  }

  const nutrition = await foodModel.getNutritionByFoodId(id);
  const medical_tags = await foodModel.getMedicalTagsByFoodId(id);
  const mealtimes = await foodModel.getMealtimesByFoodId(id);

  return successResponse(
    res,
    { food, nutrition, medical_tags, mealtimes },
    "Food details fetched"
  );
});

const createFood = asyncHandler(async (req, res) => {
  const food_id = await foodModel.createFood(req.body);
  return successResponse(res, { food_id }, "Food created", 201);
});

const upsertNutrition = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const result = await foodModel.upsertNutrition(foodId, req.body);

  if (result === "created") {
    return successResponse(res, null, "Nutrition created", 201);
  }

  return successResponse(res, null, "Nutrition updated");
});

module.exports = {
  getFoods,
  getFoodById,
  createFood,
  upsertNutrition
};