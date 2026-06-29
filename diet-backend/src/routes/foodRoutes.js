const express = require("express");
const router = express.Router();

const foodController = require("../controllers/foodController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const validate = require("../middlewares/validate");
const {
  createFoodValidator,
  foodIdValidator,
  upsertNutritionValidator
} = require("../validators/foodValidator");

router.get("/", authMiddleware, foodController.getFoods);
router.get("/:id", authMiddleware, foodIdValidator, validate, foodController.getFoodById);
router.post("/", authMiddleware, createFoodValidator, validate, foodController.createFood);
router.post("/:foodId/nutrition", authMiddleware, foodIdValidator, upsertNutritionValidator, validate, foodController.upsertNutrition);
router.put("/:foodId/nutrition", authMiddleware, foodIdValidator, upsertNutritionValidator, validate, foodController.upsertNutrition);

module.exports = router;