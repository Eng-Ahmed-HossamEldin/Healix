const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const c = require("../controllers/communityController");

// Habits
router.get("/habits", authMiddleware, roleMiddleware("user"), c.getHabits);
router.post("/habits", authMiddleware, roleMiddleware("user"), c.createHabit);
router.delete("/habits/:id", authMiddleware, roleMiddleware("user"), c.deleteHabit);
router.post("/habits/:id/complete", authMiddleware, roleMiddleware("user"), c.completeHabit);
router.delete("/habits/:id/complete", authMiddleware, roleMiddleware("user"), c.uncompleteHabit);

// Fasting
router.get("/fasting/active", authMiddleware, roleMiddleware("user"), c.getActiveFasting);
router.get("/fasting/history", authMiddleware, roleMiddleware("user"), c.getFastingHistory);
router.post("/fasting/start", authMiddleware, roleMiddleware("user"), c.startFasting);
router.post("/fasting/end", authMiddleware, roleMiddleware("user"), c.endFasting);

// Community
router.get("/posts", authMiddleware, c.getPosts);
router.post("/posts", authMiddleware, roleMiddleware("user"), c.createPost);
router.post("/posts/:id/like", authMiddleware, c.likePost);

// Challenges
router.get("/challenges", authMiddleware, c.getChallenges);
router.post("/challenges/:id/join", authMiddleware, roleMiddleware("user"), c.joinChallenge);
router.get("/challenges/my", authMiddleware, roleMiddleware("user"), c.getMyChallenges);

module.exports = router;
