const { body, param } = require("express-validator");

const createFoodValidator = [
  body().custom((_, { req }) => {
    if (!req.body.food_name && !req.body.name) {
      throw new Error("food_name is required");
    }
    return true;
  })
];

const foodIdValidator = [
  param("id").optional().isInt({ gt: 0 }).withMessage("id must be a positive integer"),
  param("foodId").optional().isInt({ gt: 0 }).withMessage("foodId must be a positive integer")
];

const upsertNutritionValidator = [
  body("calories").optional().isFloat({ min: 0 }).withMessage("calories must be >= 0"),
  body("protein_g").optional().isFloat({ min: 0 }).withMessage("protein_g must be >= 0"),
  body("total_carbs_g").optional().isFloat({ min: 0 }).withMessage("total_carbs_g must be >= 0"),
  body("total_fat_g").optional().isFloat({ min: 0 }).withMessage("total_fat_g must be >= 0"),
  body("saturated_fat_g").optional().isFloat({ min: 0 }).withMessage("saturated_fat_g must be >= 0"),
  body("sugar_g").optional().isFloat({ min: 0 }).withMessage("sugar_g must be >= 0"),
  body("fiber_g").optional().isFloat({ min: 0 }).withMessage("fiber_g must be >= 0"),
  body("cholesterol_mg").optional().isFloat({ min: 0 }).withMessage("cholesterol_mg must be >= 0"),
  body("sodium_mg").optional().isFloat({ min: 0 }).withMessage("sodium_mg must be >= 0"),
  body("potassium_mg").optional().isFloat({ min: 0 }).withMessage("potassium_mg must be >= 0"),
  body("calcium_mg").optional().isFloat({ min: 0 }).withMessage("calcium_mg must be >= 0"),
  body("iron_mg").optional().isFloat({ min: 0 }).withMessage("iron_mg must be >= 0"),
  body("vitamin_a_mcg").optional().isFloat({ min: 0 }).withMessage("vitamin_a_mcg must be >= 0"),
  body("vitamin_c_mg").optional().isFloat({ min: 0 }).withMessage("vitamin_c_mg must be >= 0")
];

module.exports = {
  createFoodValidator,
  foodIdValidator,
  upsertNutritionValidator
};
