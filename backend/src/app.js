const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const workOrderRoutes = require("./routes/workOrderRoutes");
const trackingRoutes = require("./routes/trackingRoutes");

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
app.use("/api/tracking", trackingRoutes);

app.use((req, res) => {
  res.status(404).json({
    detail: "Route not found.",
  });
});

app.use(errorHandler);

module.exports = app;