const express = require("express");
const multer = require("multer");
const fs = require("fs");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  handleAgentChat,
  getAgentHistory,
  clearAgentHistory,
  generateMealPlan,
  generateExercisePlan,
} = require("../controllers/aiAgentController");

const router = express.Router();

// Multer for optional file attachment in chat
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// POST /api/agent/chat  — main conversational agent
router.post("/chat", authMiddleware, upload.single("file"), handleAgentChat);

// GET  /api/agent/history — fetch conversation history
router.get("/history", authMiddleware, getAgentHistory);

// DELETE /api/agent/history — clear conversation history
router.delete("/history", authMiddleware, clearAgentHistory);

// POST /api/agent/generate-meal-plan — one-shot meal plan generation
router.post("/generate-meal-plan", authMiddleware, generateMealPlan);

// POST /api/agent/generate-exercise-plan — one-shot exercise plan generation
router.post("/generate-exercise-plan", authMiddleware, generateExercisePlan);

// GET /api/agent/tokens — get remaining AI tokens for today
router.get("/tokens", authMiddleware, async (req, res) => {
  const pool = require("../config/db");
  const username = req.user.username;
  await pool.query(
    `INSERT INTO user_ai_tokens (user_username, tokens_left, last_reset_at)
     VALUES (?, 50, CURDATE())
     ON DUPLICATE KEY UPDATE
       tokens_left   = IF(last_reset_at < CURDATE(), 50, tokens_left),
       last_reset_at = IF(last_reset_at < CURDATE(), CURDATE(), last_reset_at)`,
    [username]
  );
  const [[row]] = await pool.query(`SELECT tokens_left FROM user_ai_tokens WHERE user_username=?`, [username]);
  res.json({ success: true, tokens_left: row.tokens_left });
});

module.exports = router;
