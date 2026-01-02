import frontend from "../src/index.html";
import { app } from "./server.ts";

const port = process.env.PORT;
const server = Bun.serve({
  idleTimeout: 0,
  port: port ? parseInt(port) : 8000,
  ...( process.env.NODE_ENV === "development" ? {
    development: true,
    console: true,
  } : {}),
  routes: {
    "/api/*": app.fetch,
    "/*": frontend,
  },
});

console.log(`Server running on http://localhost:${server.port}`);
