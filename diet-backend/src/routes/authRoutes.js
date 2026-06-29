const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const {
  registerUserValidator,
  registerDoctorValidator,
  loginValidator
} = require("../validators/authValidator");

router.post("/register/user", registerUserValidator, validate, authController.registerUser);
router.post("/register/doctor", registerDoctorValidator, validate, authController.registerDoctor);
router.post("/login", loginValidator, validate, authController.login);
router.get("/me", authMiddleware, authController.me);

module.exports = router;