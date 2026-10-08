import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
  console.log(`Swagger UI at http://localhost:${env.PORT}/api-docs`);
});
