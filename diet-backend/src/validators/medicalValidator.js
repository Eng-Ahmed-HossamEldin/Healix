const { body, param } = require("express-validator");
const { SEVERITIES, RULE_TYPES } = require("../constants/enums");

const createConditionValidator = [
  body("condition_name").notEmpty().withMessage("condition_name is required")
];

const addMedicalHistoryValidator = [
  param("username").notEmpty().withMessage("username is required"),
  body("condition_id").isInt({ gt: 0 }).withMessage("condition_id must be a positive integer"),
  body("diagnosis_date").optional().isISO8601().withMessage("diagnosis_date must be a valid date"),
  body("severity").optional().isIn(SEVERITIES).withMessage("Invalid severity")
];

const conditionIdValidator = [
  param("conditionId").isInt({ gt: 0 }).withMessage("conditionId must be a positive integer")
];

const createRuleValidator = [
  body("nutrient_key").notEmpty().withMessage("nutrient_key is required"),
  body("rule_type").isIn(RULE_TYPES).withMessage("Invalid rule_type"),
  body("threshold_value").optional().isFloat().withMessage("threshold_value must be numeric")
];

module.exports = {
  createConditionValidator,
  addMedicalHistoryValidator,
  conditionIdValidator,
  createRuleValidator
};