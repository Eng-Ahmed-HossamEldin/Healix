const express = require("express");
const multer = require("multer");
const { handleChat } = require("../controllers/chatController");
const authMiddleware = require("../middlewares/authMiddleware");

const fs = require("fs");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

// POST /api/chat
// Supports form-data fields: 'message' for text, 'file' for image/audio
router.post("/", authMiddleware, upload.single("file"), handleChat);

module.exports = router;
