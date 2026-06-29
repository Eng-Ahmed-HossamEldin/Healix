const express = require("express");
const router = express.Router();

const requirementController = require("../controllers/requirementController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const validate = require("../middlewares/validate");
const { upsertRequirementValidator } = require("../validators/requirementValidator");

router.get("/me", authMiddleware, roleMiddleware("user"), requirementController.getMyRequirements);
router.post("/me", authMiddleware, roleMiddleware("user"), upsertRequirementValidator, validate, requirementController.upsertMyRequirements);
router.put("/me", authMiddleware, roleMiddleware("user"), upsertRequirementValidator, validate, requirementController.upsertMyRequirements);

module.exports = router;