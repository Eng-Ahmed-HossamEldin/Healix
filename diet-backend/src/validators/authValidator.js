const { body } = require("express-validator");
const { GENDERS, ROLES } = require("../constants/enums");

const registerUserValidator = [
  body("user_username").notEmpty().withMessage("user_username is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("gender").optional().isIn(GENDERS).withMessage("Invalid gender")
];

const registerDoctorValidator = [
  body("doctor_username").notEmpty().withMessage("doctor_username is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("gender").optional().isIn(GENDERS).withMessage("Invalid gender")
];

const loginValidator = [
  body("loginId").notEmpty().withMessage("loginId is required"),
  body("password").notEmpty().withMessage("password is required"),
  body("role").isIn(ROLES).withMessage("Role must be user, doctor, or admin")
];

module.exports = {
  registerUserValidator,
  registerDoctorValidator,
  loginValidator
};