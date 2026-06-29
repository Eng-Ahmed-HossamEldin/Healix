require("dotenv").config();
const app = require("./app");
const pool = require("./config/db");
const cron = require("node-cron");
const { sendNotification } = require("./utils/notificationService");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("MySQL connected successfully");
    conn.release();
    const http = require("http");
    const { Server } = require("socket.io");

    const server = http.createServer(app);
    const io = new Server(server, { cors: { origin: "*" } });

    io.on("connection", (socket) => {
      console.log("Client connected via Socket.io:", socket.id);
      
      socket.on("join_chat", ({ myUsername, partnerUsername }) => {
        // Create a unique room name for this pair
        const room = [myUsername, partnerUsername].sort().join("_");
        socket.join(room);
        console.log(`Socket ${socket.id} joined chat room: ${room}`);
      });

      socket.on("send_message", async (data) => {
        const { sender_username, receiver_username, message } = data;
        const room = [sender_username, receiver_username].sort().join("_");
        
        // Save message to DB
        try {
          const [result] = await pool.query(
            `INSERT INTO doctor_patient_chat (sender_username, receiver_username, message) VALUES (?, ?, ?)`,
            [sender_username, receiver_username, message]
          );
          
          const msgObj = {
            id: result.insertId,
            sender_username,
            receiver_username,
            message,
            created_at: new Date(),
            is_read: false
          };
          
          // Broadcast message to everyone in the chat room (including sender = delivery confirm)
          io.to(room).emit("receive_message", msgObj);

          // Also send a notification to the recipient's notification room
          // so their bell lights up if they are NOT currently in the chat
          const notifMsg = `New message from ${sender_username}: "${message.length > 40 ? message.slice(0, 40) + '…' : message}"`;
          const [notifResult] = await pool.query(
            `INSERT INTO notification (user_username, message) VALUES (?, ?)`,
            [receiver_username, notifMsg]
          );
          io.to(`notif_${receiver_username}`).emit("receive_notification", {
            id: notifResult.insertId,
            message: notifMsg,
            created_at: new Date(),
            is_read: false
          });

        } catch (e) {
          console.error("Error saving message", e);
        }
      });

      socket.on("join_notifications", (username) => {
        socket.join(`notif_${username}`);
        console.log(`Socket ${socket.id} joined notif room: notif_${username}`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    // Make io accessible globally if needed, e.g. for REST APIs to emit notifications
    global.io = io;

    // ─── Scheduled Jobs ────────────────────────────────────────────────────────

    // 1. Reset AI tokens to 50 every midnight UTC
    cron.schedule("0 0 * * *", async () => {
      try {
        await pool.query(`UPDATE user_ai_tokens SET tokens_left = 50, last_reset_at = CURDATE()`);
        console.log("[CRON] AI tokens reset to 50 for all users");
      } catch (e) { console.error("[CRON] Token reset error:", e.message); }
    }, { timezone: "UTC" });

    // 2. Daily food log reminder — 8 PM UTC
    cron.schedule("0 20 * * *", async () => {
      try {
        const [users] = await pool.query(
          `SELECT user_username FROM user_account WHERE subscription_tier != 'default'`
        );
        for (const u of users) {
          await sendNotification(u.user_username, "🍽️ Don't forget to log your meals today!");
        }
        console.log(`[CRON] Food log reminders sent to ${users.length} users`);
      } catch (e) { console.error("[CRON] Food log reminder error:", e.message); }
    }, { timezone: "UTC" });

    // 3. Weekly weigh-in reminder — every Monday 9 AM UTC
    cron.schedule("0 9 * * 1", async () => {
      try {
        const [users] = await pool.query(
          `SELECT user_username FROM user_account WHERE subscription_tier != 'default'`
        );
        for (const u of users) {
          await sendNotification(u.user_username, "📊 Time for your weekly weigh-in! Track your progress.");
        }
        console.log(`[CRON] Weekly weigh-in reminders sent to ${users.length} users`);
      } catch (e) { console.error("[CRON] Weigh-in reminder error:", e.message); }
    }, { timezone: "UTC" });

    // 4. Subscription expiry checks — runs daily at 9:05 AM UTC
    cron.schedule("5 9 * * *", async () => {
      try {
        const today = new Date();
        const in3Days = new Date(today); in3Days.setDate(today.getDate() + 3);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

        // Format as YYYY-MM-DD
        const fmt = d => d.toISOString().split('T')[0];

        // 3-day warning
        const [expiring3] = await pool.query(
          `SELECT user_username FROM user_account WHERE subscription_tier != 'default' AND DATE(subscription_end_date) = ?`,
          [fmt(in3Days)]
        );
        for (const u of expiring3) {
          await sendNotification(u.user_username, "⚠️ Your Healix subscription expires in 3 days! Renew to keep your plans active.");
        }

        // Last day warning
        const [expiringToday] = await pool.query(
          `SELECT user_username FROM user_account WHERE subscription_tier != 'default' AND DATE(subscription_end_date) = ?`,
          [fmt(tomorrow)]
        );
        for (const u of expiringToday) {
          await sendNotification(u.user_username, "🚨 Your Healix subscription expires tomorrow! This is your last day.");
        }

        // Auto-downgrade expired
        const [expired] = await pool.query(
          `SELECT user_username FROM user_account WHERE subscription_tier != 'default' AND subscription_end_date < NOW()`
        );
        for (const u of expired) {
          await pool.query(
            `UPDATE user_account SET subscription_tier='default', subscription_end_date=NULL, assigned_doctor_username=NULL WHERE user_username=?`,
            [u.user_username]
          );
          await sendNotification(u.user_username, "❌ Your Healix subscription has expired. You've been moved to the Free plan.");
        }
        if (expired.length) console.log(`[CRON] Auto-downgraded ${expired.length} expired subscriptions`);
      } catch (e) { console.error("[CRON] Subscription expiry error:", e.message); }
    }, { timezone: "UTC" });

    // Get local network IP for display
    function getLocalIP() {
      const os = require("os");
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === "IPv4" && !iface.internal) {
            return iface.address;
          }
        }
      }
      return "localhost";
    }

    server.listen(PORT, "0.0.0.0", () => {
      const localIP = getLocalIP();
      console.log(`\n  Healix Backend Server\n`);
      console.log(`  Local:    http://localhost:${PORT}`);
      console.log(`  Network:  http://${localIP}:${PORT}\n`);
    });
  } catch (error) {
    console.error("Failed to connect to MySQL:", error.message);
    process.exit(1);
  }
};

startServer();