const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const requirementRoutes = require("./routes/requirementRoutes");
const foodRoutes = require("./routes/foodRoutes");
const medicalRoutes = require("./routes/medicalRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const planRoutes = require("./routes/planRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messagingRoutes = require("./routes/messagingRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const communityRoutes = require("./routes/communityRoutes");
const contentRoutes = require("./routes/contentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const aiAgentRoutes = require("./routes/aiAgentRoutes");
const errorHandler = require("./middlewares/errorHandler");

const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
// Serve frontend static files
app.use("/healix", express.static(path.join(__dirname, "../../healix_frontend")));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Healix API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/requirements", requirementRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/medical", medicalRoutes);
app.use("/api/medical", medicalRecordRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/messaging", messagingRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/agent", aiAgentRoutes);

app.use(errorHandler);

module.exports = app;