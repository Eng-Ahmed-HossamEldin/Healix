const express = require("express");
const router = express.Router();

const contentController = require("../controllers/contentController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/recipes", authMiddleware, contentController.getRecipes);
router.get("/exercises", authMiddleware, contentController.getExercises);

module.exports = router;
