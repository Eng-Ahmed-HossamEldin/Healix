/**
 * Admin Password Update Script
 * Updates the admin account password to admin@1234
 * Run: node src/seed/updateAdminPassword.js
 */

require('dotenv').config();
const pool = require('../config/db');
const bcrypt = require('bcrypt');

const NEW_PASSWORD = 'admin@1234';
const SALT_ROUNDS = 10;

async function updateAdminPassword() {
  const conn = await pool.getConnection();
  try {
    console.log('🔐 Updating admin password...\n');

    // Check how many admin accounts exist
    const [admins] = await conn.query(`SELECT admin_username, email FROM admin_account`);

    if (admins.length === 0) {
      console.error('❌ No admin accounts found in admin_account table.');
      process.exit(1);
    }

    console.log(`Found ${admins.length} admin account(s):`);
    admins.forEach(a => console.log(`  - ${a.admin_username} (${a.email})`));

    // Hash the new password
    const newHash = await bcrypt.hash(NEW_PASSWORD, SALT_ROUNDS);

    // Update all admin accounts
    const [result] = await conn.query(
      `UPDATE admin_account SET password_hash = ?`,
      [newHash]
    );

    console.log(`\n✅ Password updated for ${result.affectedRows} admin account(s).`);
    console.log(`   New password: ${NEW_PASSWORD}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

updateAdminPassword();
