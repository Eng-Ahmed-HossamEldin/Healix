const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.get("/me", authMiddleware, roleMiddleware("user"), userController.getMyProfile);
router.put("/me", authMiddleware, roleMiddleware("user"), userController.updateMyProfile);
router.put("/me/password", authMiddleware, roleMiddleware("user"), userController.changeMyPassword);
router.get("/conditions", authMiddleware, userController.getConditions);
router.post("/subscribe", authMiddleware, roleMiddleware("user"), userController.subscribe);
router.post("/request-doctor", authMiddleware, roleMiddleware("user"), userController.requestDoctor);
router.post("/select-doctor", authMiddleware, roleMiddleware("user"), userController.selectDoctor);
router.post("/cancel-doctor-request", authMiddleware, roleMiddleware("user"), userController.cancelDoctorRequest);

module.exports = router;