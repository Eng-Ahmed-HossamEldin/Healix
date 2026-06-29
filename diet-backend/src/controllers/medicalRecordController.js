const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

// ── List user's medical records ──────────────────────────────────────────────
const getMyRecords = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT record_id, condition_name, condition_type, extra_info,
              file_name, file_type, created_at
       FROM user_medical_record
       WHERE user_username = ?
       ORDER BY created_at DESC`,
      [req.user.username]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// ── Create a new medical record ──────────────────────────────────────────────
const createRecord = async (req, res) => {
  try {
    const { condition_name, condition_type, extra_info } = req.body;
    if (!condition_name) return res.status(400).json({ success: false, error: 'condition_name is required' });

    let file_path = null, file_type = null, file_name = null;
    if (req.file) {
      file_path = req.file.path.replace(/\\/g, '/');
      file_name = req.file.originalname;
      file_type = req.file.mimetype.startsWith('image/') ? 'image' : 'pdf';
    }

    const [result] = await pool.query(
      `INSERT INTO user_medical_record (user_username, condition_name, condition_type, extra_info, file_path, file_type, file_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.username, condition_name, condition_type || 'other', extra_info || null, file_path, file_type, file_name]
    );
    res.json({ success: true, record_id: result.insertId, message: 'Medical record saved.' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// ── Delete a medical record ──────────────────────────────────────────────────
const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT file_path FROM user_medical_record WHERE record_id = ? AND user_username = ?`,
      [id, req.user.username]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });

    // Delete file from disk
    if (rows[0].file_path) {
      try { fs.unlinkSync(rows[0].file_path); } catch (_) {}
    }

    await pool.query(`DELETE FROM user_medical_record WHERE record_id = ?`, [id]);
    res.json({ success: true, message: 'Record deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// ── Doctor: get a patient's medical records ──────────────────────────────────
const getPatientRecords = async (req, res) => {
  try {
    const { username } = req.params;
    const [rows] = await pool.query(
      `SELECT record_id, condition_name, condition_type, extra_info,
              file_name, file_type, file_path, created_at
       FROM user_medical_record
       WHERE user_username = ?
       ORDER BY created_at DESC`,
      [username]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

module.exports = { getMyRecords, createRecord, deleteRecord, getPatientRecords };
