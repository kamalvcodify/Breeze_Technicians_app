const app = require("./app");
const config = require("./config/env");
const { startAutoEndShiftJob } = require("./jobs/autoEndShiftJob");

app.listen(config.port, "0.0.0.0", () => {
  console.log(`Breeze backend listening on http://0.0.0.0:${config.port}`);

  startAutoEndShiftJob();
});