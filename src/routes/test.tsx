import { ConnectionProvider } from "@/ConnectionProvider.tsx";
import { Handle, RemixNode } from "@remix-run/component";
import { TypedEventTarget } from "@remix-run/interaction";
import { ToastContainer, showToast } from "../toast.tsx";
import { Board } from "./board.tsx";
import { Home } from "./home.tsx";
import { Lobby } from "./lobby.tsx";
import { GameTimer, StartTimer } from "./timer.tsx";

type MockConnectionEvents = {
  stateChange: Event;
  connectionChange: Event;
};

// Mock connection class for testing
class MockConnection extends TypedEventTarget<MockConnectionEvents> {
  uuid = "test-uuid";
  state:
    | {
        board: string[];
        state: string;
        players: string[];
        startTime: number;
        endTime: number;
        minWordLength: number;
        gameDuration: number;
        scores: {
          duplicateWords: string[];
          foundWords: Record<string, string[]>;
        };
        persistentScores: Record<string, number>;
        contestedWords: string[];
        wordList: Record<
          number,
          { word: string; path: string; common: boolean }[]
        >;
      }
    | undefined = undefined;
  isConnected = true;

  constructor(initialState?: any) {
    super();
    this.state = initialState;
  }

  get connected() {
    return this.isConnected;
  }

  // Mock methods
  async connect(name: string) {
    return true;
  }
  start(options: any) {
    console.log("Mock start:", options);
  }
  playAgain() {
    console.log("Mock play again");
  }
  configureGame() {
    console.log("Mock configure game");
  }
  resetScores() {
    console.log("Mock reset scores");
  }
  contestWord(playerName: string, word: string) {
    console.log("Mock contest word:", playerName, word);
  }
  isWordValid(word: string) {
    return true;
  }
  async playWord(word: number[]) {
    return true;
  }
  disconnect() {}
}

// Mock data for different states
const mockPlayers = ["Alice", "Bob", "Charlie"];
const mockBoard = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
];

const mockWordList = {
  3: [
    { word: "cat", path: "0,1,2", common: true },
    { word: "dog", path: "3,4,5", common: true },
  ],
  4: [
    { word: "word", path: "0,1,2,3", common: true },
    { word: "test", path: "4,5,6,7", common: false },
  ],
};

const mockScores = {
  duplicateWords: ["cat"],
  foundWords: {
    Alice: ["word", "test", "cat"],
    Bob: ["dog", "cat"],
    Charlie: ["word"],
  },
};

const mockPersistentScores = {
  Alice: 15,
  Bob: 8,
  Charlie: 12,
};

// Create mock connections for different states
const createMockConnection = (state: string, additionalProps = {}) => {
  const baseState = {
    board: mockBoard,
    state,
    players: mockPlayers,
    startTime: Date.now() + 5000, // 5 seconds from now
    endTime: Date.now() + 120000, // 2 minutes from now
    minWordLength: 4,
    gameDuration: 2,
    scores: mockScores,
    persistentScores: mockPersistentScores,
    contestedWords: [],
    wordList: mockWordList,
    ...additionalProps,
  };

  return new MockConnection(baseState);
};

// Component wrapper for visual separation
function ComponentShowcase(this: Handle, { title }: { title: string }) {
  return ({ children }: { children: RemixNode }) => (
    <div class="mb-12">
      <h2 class="text-2xl font-bold mb-4 text-gray-800 pb-2">{title}</h2>
      <div class="">{children}</div>
    </div>
  );
}

export function TestPage(this: Handle) {
  // Mock connections for different states
  const homeConnection = new MockConnection();
  homeConnection.isConnected = false;

  const pendingConnection = createMockConnection("pending");
  const startingConnection = createMockConnection("starting", {
    startTime: Date.now() + 3000, // 3 seconds from now
  });
  const startedConnection = createMockConnection("started");
  const finishedConnection = createMockConnection("finished");

  return (
    <div class="max-w-6xl mx-auto p-4">
      {/* Back to main app link */}
      <div class="mb-4">
        <a
          href="#"
          class="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
          on={{
            click: () => {
              window.location.hash = "";
            },
          }}
        >
          ← Back to Game
        </a>
      </div>

      <h1 class="text-4xl font-bold text-center mb-8 text-gray-900">
        Component Test Page
      </h1>
      <p class="text-center text-gray-600 mb-8">
        Visual testing for all Boggle game components with mock data
      </p>

      {/* Home Component */}
      <ComponentShowcase title="Home Component (Not Connected)">
        <ConnectionProvider connection={homeConnection as any}>
          <Home />
        </ConnectionProvider>
      </ComponentShowcase>

      {/* Lobby - Pending State */}
      <ComponentShowcase title="Lobby Component - Pending State">
        <ConnectionProvider connection={pendingConnection as any}>
          <Lobby />
        </ConnectionProvider>
      </ComponentShowcase>

      {/* Lobby - Starting State with Timer */}
      <ComponentShowcase title="Lobby Component - Starting State (with StartTimer)">
        <ConnectionProvider connection={startingConnection as any}>
          <Lobby />
        </ConnectionProvider>
      </ComponentShowcase>

      {/* Standalone StartTimer */}
      <ComponentShowcase title="StartTimer Component (Standalone)">
        <ConnectionProvider connection={startingConnection as any}>
          <StartTimer />
        </ConnectionProvider>
      </ComponentShowcase>

      {/* Board Component */}
      <ComponentShowcase title="Board Component - Active Game">
        <ConnectionProvider connection={startedConnection as any}>
          <Board />
        </ConnectionProvider>
      </ComponentShowcase>

      {/* Standalone GameTimer */}
      <ComponentShowcase title="GameTimer Component (Standalone)">
        <ConnectionProvider connection={startedConnection as any}>
          <GameTimer />
        </ConnectionProvider>
      </ComponentShowcase>

      {/* Lobby - Finished State */}
      <ComponentShowcase title="Lobby Component - Finished State (Scores)">
        <ConnectionProvider connection={finishedConnection as any}>
          <Lobby />
        </ConnectionProvider>
      </ComponentShowcase>

      {/* Additional Visual States */}
      <ComponentShowcase title="Board with Different Selection States">
        <ConnectionProvider connection={startedConnection as any}>
          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Note: Selection states require interaction - this shows the base
              board
            </p>
            <Board />
          </div>
        </ConnectionProvider>
      </ComponentShowcase>

      {/* Timer Variations */}
      <ComponentShowcase title="Timer Variations">
        <div class="space-y-4">
          <div>
            <h3 class="font-semibold mb-2">Normal Time (Green)</h3>
            <ConnectionProvider
              connection={
                createMockConnection("started", {
                  endTime: Date.now() + 90000, // 1.5 minutes remaining
                }) as any
              }
            >
              <GameTimer />
            </ConnectionProvider>
          </div>

          <div>
            <h3 class="font-semibold mb-2">Low Time (Yellow)</h3>
            <ConnectionProvider
              connection={
                createMockConnection("started", {
                  endTime: Date.now() + 25000, // 25 seconds remaining
                }) as any
              }
            >
              <GameTimer />
            </ConnectionProvider>
          </div>

          <div>
            <h3 class="font-semibold mb-2">Very Low Time (Red, Pulsing)</h3>
            <ConnectionProvider
              connection={
                createMockConnection("started", {
                  endTime: Date.now() + 8000, // 8 seconds remaining
                }) as any
              }
            >
              <GameTimer />
            </ConnectionProvider>
          </div>
        </div>
      </ComponentShowcase>

      {/* Different Player Counts */}
      <ComponentShowcase title="Lobby with Different Player Counts">
        <div class="space-y-4">
          <div>
            <h3 class="font-semibold mb-2">Single Player</h3>
            <ConnectionProvider
              connection={
                createMockConnection("pending", {
                  players: ["Solo Player"],
                  persistentScores: { "Solo Player": 25 },
                }) as any
              }
            >
              <Lobby />
            </ConnectionProvider>
          </div>

          <div>
            <h3 class="font-semibold mb-2">Many Players</h3>
            <ConnectionProvider
              connection={
                createMockConnection("pending", {
                  players: ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"],
                  persistentScores: {
                    Alice: 45,
                    Bob: 32,
                    Charlie: 28,
                    Diana: 51,
                    Eve: 19,
                    Frank: 37,
                  },
                }) as any
              }
            >
              <Lobby />
            </ConnectionProvider>
          </div>
        </div>
      </ComponentShowcase>

      {/* Toast System Testing */}
      <ComponentShowcase title="Toast System">
        <div class="space-y-4">
          <p class="text-sm text-gray-600 mb-4">
            Test the toast notification system used for word validation feedback
          </p>
          <div class="flex gap-2 flex-wrap">
            <button
              class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              on={{
                click: () => showToast("WORD - Good word!", "success"),
              }}
            >
              Success Toast
            </button>
            <button
              class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              on={{
                click: () => showToast("INVALID - Not a valid word!", "error"),
              }}
            >
              Error Toast
            </button>
            <button
              class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              on={{
                click: () =>
                  showToast("Word too short! Minimum 4 letters.", "error"),
              }}
            >
              Length Error
            </button>
            <button
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              on={{
                click: () => showToast("DUPLICATE - Already found!", "error"),
              }}
            >
              Duplicate Error
            </button>
          </div>
        </div>
      </ComponentShowcase>

      {/* Toast Container for testing */}
      <ToastContainer />
    </div>
  );
}
