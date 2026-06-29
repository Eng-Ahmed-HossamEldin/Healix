const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/medicalRecordController');

// ── Multer storage ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/medical', req.user.username);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `record_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// User routes
router.get('/records',       authMiddleware, ctrl.getMyRecords);
router.post('/records',      authMiddleware, upload.single('file'), ctrl.createRecord);
router.delete('/records/:id', authMiddleware, ctrl.deleteRecord);

// Doctor route — get patient records
router.get('/records/patient/:username', authMiddleware, ctrl.getPatientRecords);

module.exports = router;
