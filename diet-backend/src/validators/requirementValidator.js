const { body } = require("express-validator");

const upsertRequirementValidator = [
  body("height_cm").optional().isFloat({ gt: 0 }).withMessage("height_cm must be greater than 0"),
  body("weight_kg").optional().isFloat({ gt: 0 }).withMessage("weight_kg must be greater than 0"),
  body("target_weight_kg").optional().isFloat({ gt: 0 }).withMessage("target_weight_kg must be greater than 0"),
  body("activity_rate").optional().isFloat({ gt: 0 }).withMessage("activity_rate must be a positive number"),
  body("target_date").optional().isISO8601().withMessage("target_date must be a valid date")
];

module.exports = {
  upsertRequirementValidator
};