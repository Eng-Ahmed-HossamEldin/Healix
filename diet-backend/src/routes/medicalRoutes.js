const express = require("express");
const router = express.Router();

const medicalController = require("../controllers/medicalController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const validate = require("../middlewares/validate");
const {
  createConditionValidator,
  addMedicalHistoryValidator,
  conditionIdValidator,
  createRuleValidator
} = require("../validators/medicalValidator");

router.get("/my-history", authMiddleware, roleMiddleware("user"), medicalController.getMyMedicalHistory);
router.get("/conditions", authMiddleware, medicalController.getConditions);
router.post("/conditions", authMiddleware, roleMiddleware("doctor"), createConditionValidator, validate, medicalController.createCondition);

router.get("/conditions/:conditionId/rules", authMiddleware, conditionIdValidator, validate, medicalController.getRulesByConditionId);
router.post("/conditions/:conditionId/rules", authMiddleware, roleMiddleware("doctor"), conditionIdValidator, createRuleValidator, validate, medicalController.createRuleForCondition);

router.post("/users/:username/history", authMiddleware, roleMiddleware("doctor"), addMedicalHistoryValidator, validate, medicalController.addMedicalHistoryForUser);

module.exports = router;