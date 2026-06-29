const express = require("express");
const router = express.Router();

const messagingController = require("../controllers/messagingController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/history/:partner_username", authMiddleware, messagingController.getChatHistory);
router.post("/send", authMiddleware, messagingController.sendMessage);
router.get("/notifications", authMiddleware, messagingController.getNotifications);
router.post("/notifications/read", authMiddleware, messagingController.markNotificationsRead);

module.exports = router;
