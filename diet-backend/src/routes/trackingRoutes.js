const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const c = require("../controllers/trackingController");

router.get("/summary", authMiddleware, roleMiddleware("user"), c.getDailySummary);

router.get("/food-log", authMiddleware, roleMiddleware("user"), c.getFoodLog);
router.post("/food-log", authMiddleware, roleMiddleware("user"), c.addFoodLog);
router.delete("/food-log/:id", authMiddleware, roleMiddleware("user"), c.deleteFoodLog);

router.get("/weight", authMiddleware, roleMiddleware("user"), c.getWeightLog);
router.post("/weight", authMiddleware, roleMiddleware("user"), c.addWeightLog);

router.get("/water", authMiddleware, roleMiddleware("user"), c.getWaterLog);
router.post("/water", authMiddleware, roleMiddleware("user"), c.logWater);

router.get("/sleep", authMiddleware, roleMiddleware("user"), c.getSleepLog);
router.post("/sleep", authMiddleware, roleMiddleware("user"), c.addSleepLog);

router.get("/steps", authMiddleware, roleMiddleware("user"), c.getStepLog);
router.post("/steps", authMiddleware, roleMiddleware("user"), c.logSteps);

router.get("/exercise", authMiddleware, roleMiddleware("user"), c.getExerciseLog);
router.post("/exercise", authMiddleware, roleMiddleware("user"), c.addExerciseLog);
router.delete("/exercise/:id", authMiddleware, roleMiddleware("user"), c.deleteExerciseLog);

module.exports = router;
