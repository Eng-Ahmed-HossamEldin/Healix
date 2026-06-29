const { body, param } = require("express-validator");
const { WEEKDAYS } = require("../constants/enums");

const createPlanValidator = [
  param("username").notEmpty().withMessage("username is required"),
  body("start_date").optional().isISO8601().withMessage("start_date must be a valid date"),
  body("end_date").optional().isISO8601().withMessage("end_date must be a valid date"),
  body("target_calories").optional().isFloat({ min: 0 }).withMessage("target_calories must be >= 0"),
  body("target_protein_g").optional().isFloat({ min: 0 }).withMessage("target_protein_g must be >= 0"),
  body("target_carbs_g").optional().isFloat({ min: 0 }).withMessage("target_carbs_g must be >= 0"),
  body("target_fat_g").optional().isFloat({ min: 0 }).withMessage("target_fat_g must be >= 0"),
  body("target_water_cups").optional().isInt({ min: 0 }).withMessage("target_water_cups must be >= 0")
];

const planIdValidator = [
  param("id").optional().isInt({ gt: 0 }).withMessage("id must be a positive integer"),
  param("planId").optional().isInt({ gt: 0 }).withMessage("planId must be a positive integer"),
  param("mealId").optional().isInt({ gt: 0 }).withMessage("mealId must be a positive integer")
];

const createMealValidator = [
  body("weekday").optional().isIn(WEEKDAYS).withMessage("Invalid weekday"),
  body("day_no").optional().isInt({ gt: 0 }).withMessage("day_no must be greater than 0")
];

const createMealItemValidator = [
  body("food_id").isInt({ gt: 0 }).withMessage("food_id must be a positive integer"),
  body("qty").optional().isFloat({ gt: 0 }).withMessage("qty must be greater than 0")
];

module.exports = {
  createPlanValidator,
  planIdValidator,
  createMealValidator,
  createMealItemValidator
};