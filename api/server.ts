import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { join } from "node:path";
import { Room } from "./room.ts";

const room = new Room();
const app = new Hono();

app.use(cors());

app.get(
  "/assets/*",
  serveStatic({
    root: join(import.meta.dirname ?? "", "../dist/"),
    onNotFound: (what) => {
      console.log(what);
    },
  }),
);

app.get(
  "*",
  serveStatic({
    root: join(import.meta.dirname ?? "", "../dist/"),
    onNotFound: console.log,
  }),
);

app.get("/api/connect/:name", (c) => {
  const name = c.req.param("name");
  if (room.hasMember(name)) {
    return c.text("name already taken", 409);
  }
  if (!c.req.header("Accept")?.includes("text/event-stream")) {
    return c.text("need text/event-stream in accept header", 400);
  }
  const stream = new ReadableStream({
    start(controller) {
      console.log("starting event stream");
      const encoder = new TextEncoder();
      const uid = room.addMember(name, (event) => {
        const data = encoder.encode(
          `event: ${event.type}\ndata: ${event.data}\n\n`,
        );
        controller.enqueue(data);
      });
      controller.enqueue(encoder.encode(`event: connected\ndata: ${uid}\n\n`));
    },
    cancel() {
      room.removeMember(name);
    },
  });

  return c.body(stream, {
    headers: {
      "content-type": "text/event-stream",
      "connection": "keep-alive",
      "cache-control": "no-cache",
    },
  });
});

app.post("/api/start", async (c) => {
  const { token: userToken, wordLength, time } = await c.req.json();
  room.start(userToken ?? "", { wordLength, time });

  return c.text("ok");
});

app.post("/api/play-again", async (c) => {
  const { token: userToken } = await c.req.json();
  room.start(userToken ?? "");

  return c.text("ok");
});

app.post("/api/configure-game", async (c) => {
  const { token: userToken } = await c.req.json();
  room.configureGame(userToken ?? "");

  return c.text("ok");
});

app.post("/api/reset-scores", async (c) => {
  const { token: userToken } = await c.req.json();
  room.resetScores(userToken ?? "");

  return c.text("ok");
});

app.post("/api/play-word", async (c) => {
  const { token: userToken, word } = await c.req.json();

  const result = room.playWord(userToken, word);

  if (result === false) {
    return c.text("bad", 400);
  } else if (result === "duplicate") {
    return c.text("duplicate", 409);
  }
  return c.text("ok");
});

export { app };
