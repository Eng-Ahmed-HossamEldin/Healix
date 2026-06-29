const express = require("express");
const router = express.Router();

const doctorController = require("../controllers/doctorController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.get('/list',                authMiddleware, doctorController.listAllDoctors);
router.get('/me',                  authMiddleware, roleMiddleware('doctor'), doctorController.getDoctorProfile);
router.get('/users',               authMiddleware, roleMiddleware('doctor'), doctorController.searchUsers);
router.post('/link-user',          authMiddleware, roleMiddleware('doctor'), doctorController.linkUserDoctor);
router.get('/users/:username/case',authMiddleware, roleMiddleware('doctor'), doctorController.getUserCase);
router.get('/requests',            authMiddleware, roleMiddleware('doctor'), doctorController.getRequests);
router.post('/respond-request',    authMiddleware, roleMiddleware('doctor'), doctorController.respondRequest);
router.put('/profile',             authMiddleware, roleMiddleware('doctor'), doctorController.updateDoctorProfile);
router.put('/profile/password',    authMiddleware, roleMiddleware('doctor'), doctorController.updateDoctorPassword);
router.put('/users/:username/targets', authMiddleware, roleMiddleware('doctor'), doctorController.updatePatientTargets);
router.get('/users/:username/logs',    authMiddleware, roleMiddleware('doctor'), doctorController.getUserLogs);

module.exports = router;