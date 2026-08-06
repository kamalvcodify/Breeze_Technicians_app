const app = require("./app");
const config = require("./config/env");

app.listen(config.port, "0.0.0.0", () => {
  console.log(`Breeze backend listening on http://0.0.0.0:${config.port}`);
});
