const express = require("express");
const router = express.Router();

const planController = require("../controllers/planController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const validate = require("../middlewares/validate");
const {
  createPlanValidator,
  planIdValidator,
  createMealValidator,
  createMealItemValidator
} = require("../validators/planValidator");

router.get("/my-plans", authMiddleware, roleMiddleware("user"), planController.getMyPlans);
router.get("/meals/:mealId/items", authMiddleware, planIdValidator, validate, planController.getMealItems);

// Exercise plan routes must come before the generic "/:id" matcher.
router.get("/my-exercise-plans", authMiddleware, roleMiddleware("user"), planController.getMyExercisePlans);
router.get("/exercise-plans/:id", authMiddleware, planController.getExercisePlanById);
router.delete("/exercise-plans/:id", authMiddleware, roleMiddleware("doctor"), planController.deleteExercisePlanById);
router.post("/users/:username/exercise-plans", authMiddleware, planController.createExercisePlanForUser);
router.post("/exercise-plans/:planId/exercises", authMiddleware, planController.createPlanExercise);

router.get("/:id", authMiddleware, planIdValidator, validate, planController.getPlanById);
router.put("/:id", authMiddleware, roleMiddleware("doctor"), planIdValidator, validate, planController.updatePlanById);
router.delete("/:id", authMiddleware, roleMiddleware("doctor"), planIdValidator, validate, planController.deletePlanById);
router.put("/exercise-plans/:id", authMiddleware, roleMiddleware("doctor"), planController.updateExercisePlanById);

router.post("/users/:username", authMiddleware, roleMiddleware("doctor"), createPlanValidator, validate, planController.createPlanForUser);
router.post("/:planId/meals", authMiddleware, roleMiddleware("doctor"), planIdValidator, createMealValidator, validate, planController.createMealForPlan);
router.post("/meals/:mealId/items", authMiddleware, roleMiddleware("doctor"), planIdValidator, createMealItemValidator, validate, planController.createMealItem);

module.exports = router;
