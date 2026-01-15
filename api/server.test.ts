import { beforeEach, describe, expect, test } from "bun:test";
import { evaluateBoardQuality, generateBoard } from "./game.ts";
import { Room } from "./room.ts";
import { app } from "./server.ts";

describe("Room", () => {
  let room: Room;

  beforeEach(() => {
    room = new Room();
  });

  describe("member management", () => {
    test("should add a member and return a uid", () => {
      const uid = room.addMember("player1", () => {});
      expect(uid).toBeDefined();
      expect(typeof uid).toBe("string");
      expect(uid.length).toBeGreaterThan(0);
    });

    test("should track members correctly", () => {
      room.addMember("player1", () => {});
      room.addMember("player2", () => {});

      expect(room.hasMember("player1")).toBe(true);
      expect(room.hasMember("player2")).toBe(true);
      expect(room.hasMember("player3")).toBe(false);
    });

    test("should remove members correctly", () => {
      room.addMember("player1", () => {});
      expect(room.hasMember("player1")).toBe(true);

      room.removeMember("player1");
      expect(room.hasMember("player1")).toBe(false);
    });

    test("should reset state when all members leave", () => {
      room.addMember("player1", () => {});
      room.removeMember("player1");

      expect(room.state).toBe("pending");
      expect(room.board).toEqual([]);
      expect(Object.keys(room.persistentScores)).toHaveLength(0);
    });

    test("should include players in state", () => {
      room.addMember("Alice", () => {});
      room.addMember("Bob", () => {});

      const state = room.getState();
      expect(state.players).toContain("Alice");
      expect(state.players).toContain("Bob");
      expect(state.players).toHaveLength(2);
    });
  });

  describe("game flow", () => {
    test("should start with pending state", () => {
      expect(room.state).toBe("pending");
    });

    test("should not start game without valid initiator", () => {
      room.addMember("player1", () => {});
      room.start("invalid-token");

      expect(room.state).toBe("pending");
    });

    test("should transition to starting state when initiated by valid member", () => {
      const uid = room.addMember("player1", () => {});
      room.start(uid);

      expect(room.state).toBe("starting");
      expect(room.board).toHaveLength(16);
    });

    test("should set game options when starting", () => {
      const uid = room.addMember("player1", () => {});
      room.start(uid, { wordLength: 4, time: 3 });

      expect(room.minWordLength).toBe(4);
      expect(room.gameDuration).toBe(3);
    });

    test("should generate a board on game start", () => {
      const uid = room.addMember("player1", () => {});
      room.start(uid);

      expect(room.board).toHaveLength(16);
      room.board.forEach((letter) => {
        expect(typeof letter).toBe("string");
        expect(letter.length).toBeGreaterThanOrEqual(1);
      });
    });

    test("should solve the board and populate wordList", () => {
      const uid = room.addMember("player1", () => {});
      room.start(uid);

      expect(Object.keys(room.wordList).length).toBeGreaterThan(0);
    });
  });

  describe("playing words", () => {
    let uid: string;

    beforeEach(() => {
      uid = room.addMember("player1", () => {});
      room.start(uid);
      // Manually set state to started for testing
      room.state = "started";
    });

    test("should reject word when game is not started", () => {
      room.state = "pending";
      const result = room.playWord(uid, "test");
      expect(result).toBe(false);
    });

    test("should reject word from invalid player", () => {
      const result = room.playWord("invalid-uid", "test");
      expect(result).toBe(false);
    });

    test("should accept valid word from valid player", () => {
      const result = room.playWord(uid, "test");
      expect(result).toBe(true);
    });

    test("should reject word shorter than minimum length", () => {
      room.minWordLength = 4;
      const result = room.playWord(uid, "cat");
      expect(result).toBe(false);
    });

    test("should return duplicate when playing same word twice", () => {
      room.playWord(uid, "test");
      const result = room.playWord(uid, "test");
      expect(result).toBe("duplicate");
    });
  });

  describe("score calculation", () => {
    test("should calculate scores correctly", () => {
      const uid1 = room.addMember("player1", () => {});
      const uid2 = room.addMember("player2", () => {});
      room.start(uid1);
      room.state = "started";

      room.playWord(uid1, "test");
      room.playWord(uid1, "word");
      room.playWord(uid2, "game");

      room.calculateScores();

      expect(room.scores.foundWords["player1"]).toContain("test");
      expect(room.scores.foundWords["player1"]).toContain("word");
      expect(room.scores.foundWords["player2"]).toContain("game");
    });

    test("should identify duplicate words", () => {
      const uid1 = room.addMember("player1", () => {});
      const uid2 = room.addMember("player2", () => {});
      room.start(uid1);
      room.state = "started";

      room.playWord(uid1, "same");
      room.playWord(uid2, "same");

      room.calculateScores();

      expect(room.scores.duplicateWords).toContain("same");
    });

    test("should update persistent scores after game", () => {
      const uid = room.addMember("player1", () => {});
      room.start(uid);
      room.state = "started";

      room.playWord(uid, "test"); // 4 letters = 2 points
      room.playWord(uid, "word"); // 4 letters = 2 points

      room.calculateScores();

      expect(room.persistentScores["player1"]).toBe(4);
    });

    test("should calculate current game score correctly", () => {
      const uid = room.addMember("player1", () => {});
      room.start(uid);
      room.state = "started";

      room.playWord(uid, "cat"); // 3 letters = 1 point
      room.playWord(uid, "test"); // 4 letters = 2 points
      room.playWord(uid, "words"); // 5 letters = 3 points

      room.calculateScores();

      const score = room.calculateCurrentGameScore("player1");
      expect(score).toBe(6); // 1 + 2 + 3
    });
  });

  describe("contesting words", () => {
    let uid1: string;
    let uid2: string;

    beforeEach(() => {
      uid1 = room.addMember("player1", () => {});
      uid2 = room.addMember("player2", () => {});
      room.start(uid1);
      room.state = "started";
      room.playWord(uid1, "test");
      room.playWord(uid2, "word");
      room.state = "finished";
      room.calculateScores();
    });

    test("should allow contesting words when game is finished", () => {
      const result = room.toggleContestWord(uid2, "player1", "test");
      expect(result).toBe(true);
      expect(room.contestedWords.has("test")).toBe(true);
    });

    test("should not allow contesting when game is not finished", () => {
      room.state = "started";
      const result = room.toggleContestWord(uid2, "player1", "test");
      expect(result).toBe(false);
    });

    test("should toggle contest status on repeated calls", () => {
      room.toggleContestWord(uid2, "player1", "test");
      expect(room.contestedWords.has("test")).toBe(true);

      room.toggleContestWord(uid2, "player1", "test");
      expect(room.contestedWords.has("test")).toBe(false);
    });

    test("should reject contesting with invalid user token", () => {
      const result = room.toggleContestWord("invalid", "player1", "test");
      expect(result).toBe(false);
    });

    test("should reject contesting word that player doesn't have", () => {
      const result = room.toggleContestWord(uid1, "player1", "nonexistent");
      expect(result).toBe(false);
    });

    test("should update persistent scores when word is contested", () => {
      const scoreBefore = room.persistentScores["player1"];
      room.toggleContestWord(uid2, "player1", "test");
      const scoreAfter = room.persistentScores["player1"];

      // Contested word should reduce the score
      expect(scoreAfter).toBeLessThan(scoreBefore);
    });
  });

  describe("reset functionality", () => {
    test("should reset scores when valid initiator requests", () => {
      const uid = room.addMember("player1", () => {});
      room.persistentScores["player1"] = 100;

      room.resetScores(uid);

      expect(room.persistentScores).toEqual({});
    });

    test("should not reset scores for invalid initiator", () => {
      room.addMember("player1", () => {});
      room.persistentScores["player1"] = 100;

      room.resetScores("invalid-token");

      expect(room.persistentScores["player1"]).toBe(100);
    });

    test("should configure game (reset to pending) for valid initiator", () => {
      const uid = room.addMember("player1", () => {});
      room.start(uid);
      room.state = "finished";

      room.configureGame(uid);

      expect(room.state as string).toBe("pending");
      expect(room.board).toEqual([]);
    });
  });
});

describe("Board Generation", () => {
  test("should generate a 16-letter board", () => {
    const board = generateBoard();
    expect(board).toHaveLength(16);
  });

  test("should generate valid letters from dice", () => {
    const board = generateBoard();
    board.forEach((letter) => {
      expect(typeof letter).toBe("string");
      expect(letter.length).toBeGreaterThanOrEqual(1);
      expect(letter.length).toBeLessThanOrEqual(2); // "Qu" is the longest
    });
  });

  test("should evaluate board quality", () => {
    const board = generateBoard();
    const quality = evaluateBoardQuality(board);

    expect(quality).toHaveProperty("totalWords");
    expect(quality).toHaveProperty("commonWords");
    expect(quality).toHaveProperty("wordsByLength");
    expect(quality).toHaveProperty("averageWordLength");
    expect(quality).toHaveProperty("longestWord");
    expect(quality).toHaveProperty("score");

    expect(quality.totalWords).toBeGreaterThan(0);
    expect(quality.score).toBeGreaterThanOrEqual(0);
    expect(quality.score).toBeLessThanOrEqual(100);
  });

  test("should generate boards with reasonable quality", () => {
    // Generate multiple boards and check they meet minimum quality
    const qualities: number[] = [];
    for (let i = 0; i < 5; i++) {
      const board = generateBoard(50, 5);
      const quality = evaluateBoardQuality(board);
      qualities.push(quality.score);
    }

    const avgQuality = qualities.reduce((a, b) => a + b, 0) / qualities.length;
    expect(avgQuality).toBeGreaterThan(30);
  });
});

describe("API Endpoints", () => {
  describe("GET /api/connect/:name", () => {
    test("should return 400 without SSE accept header", async () => {
      const res = await app.request("/api/connect/testuser");
      expect(res.status).toBe(400);
    });

    test("should establish SSE connection with proper header", async () => {
      const res = await app.request("/api/connect/testuser", {
        headers: { Accept: "text/event-stream" },
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("text/event-stream");
    });
  });

  describe("POST /api/start", () => {
    test("should accept start request", async () => {
      const res = await app.request("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "test-token" }),
      });
      // Will return ok but won't actually start without valid token
      expect(res.status).toBe(200);
    });

    test("should accept start with options", async () => {
      const res = await app.request("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "test-token",
          wordLength: 4,
          time: 3,
        }),
      });
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/play-word", () => {
    test("should return bad when game not started", async () => {
      const res = await app.request("/api/play-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "test", word: "test" }),
      });
      expect(res.status).toBe(400);
      expect(await res.text()).toBe("bad");
    });
  });

  describe("POST /api/play-again", () => {
    test("should accept play-again request", async () => {
      const res = await app.request("/api/play-again", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "test-token" }),
      });
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/configure-game", () => {
    test("should accept configure-game request", async () => {
      const res = await app.request("/api/configure-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "test-token" }),
      });
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/reset-scores", () => {
    test("should accept reset-scores request", async () => {
      const res = await app.request("/api/reset-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "test-token" }),
      });
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/contest-word", () => {
    test("should return bad when conditions not met", async () => {
      const res = await app.request("/api/contest-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "test",
          playerName: "player1",
          word: "test",
        }),
      });
      expect(res.status).toBe(400);
    });
  });
});
