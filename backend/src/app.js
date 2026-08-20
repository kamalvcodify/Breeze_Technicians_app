const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const workOrderRoutes = require("./routes/workOrderRoutes");
const rehabOrderRoutes = require("./routes/rehabOrderRoutes");
const checkInOutRoutes = require("./routes/checkInOutRoutes");
const moveOutRoutes = require("./routes/moveOutRoutes");
const rentReadyChecklistRoutes = require("./routes/rentReadyChecklistRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const simpleShiftRoutes = require("./routes/simpleShiftRoutes");

const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/work-orders", workOrderRoutes);
app.use("/api/rehab-orders", rehabOrderRoutes);
app.use("/api/check-in-out", checkInOutRoutes);
app.use("/api/move-out", moveOutRoutes);
app.use("/api/rent-ready-checklist", rentReadyChecklistRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/simple-shift", simpleShiftRoutes);

app.use((req, res) => {
  res.status(404).json({
    detail: "Route not found.",
  });
});

app.use(errorHandler);

module.exports = app;