# Boggle Game - Agent Documentation

## Project Overview

This is a real-time multiplayer Boggle game built with modern web technologies. Players connect to a shared lobby, start games together, find words on a 4x4 letter grid, and compete for the highest score.

### Tech Stack
- **Runtime**: Bun
- **Backend**: Hono (TypeScript web framework)
- **Frontend**: @remix-run/component (custom component framework)
- **Styling**: Tailwind CSS
- **State Management**: TypedEventTarget from @remix-run/interaction
- **Real-time Communication**: Server-Sent Events (SSE)

## Architecture

### Project Structure
```
/
├── api/                    # Backend API server
│   ├── main.ts            # Server entry point
│   ├── server.ts          # API routes and middleware
│   ├── room.ts            # Game room management
│   └── game.ts            # Board generation and quality evaluation
├── src/                   # Frontend application
│   ├── app.tsx            # Main app component
│   ├── main.tsx           # Frontend entry point
│   ├── connection.ts      # SSE connection management
│   ├── ConnectionProvider.tsx # Context provider for connection
│   ├── toast.tsx          # Toast notification system
│   ├── selection.ts       # Touch/mouse selection controller for board
│   └── routes/            # Page components
│       ├── home.tsx       # Player name entry
│       ├── lobby.tsx      # Game lobby and score display
│       ├── board.tsx      # Game board interface
│       ├── timer.tsx      # Game timers
│       └── test.tsx       # Component test page
├── solver/                # Word validation and board solving
│   ├── solveBoard.ts      # Board solver algorithm
│   ├── tree.ts           # Radix tree for word lookup
│   └── words.txt         # Dictionary file
└── dist/                  # Built frontend assets
```

## Component Pattern

The frontend uses `@remix-run/component` with a Handle-based pattern:

### Component Structure
```typescript
import { Handle } from "@remix-run/component";

export function MyComponent(this: Handle, { prop }: { prop: string }) {
  // Instance variables (re-created on each mount)
  let localState = 0;

  // Subscribe to events from controllers/connections
  this.on(someEventTarget, {
    eventName: () => this.update(), // Trigger re-render
  });

  // Return a render function (called on each update)
  return () => (
    <div>{prop} - {localState}</div>
  );
}
```

### Key Patterns
- **Components**: Functions with `this: Handle` that return render functions
- **Event Handling**: Use `on={{ eventName: handler }}` syntax on elements
- **State Updates**: Call `this.update()` to trigger re-renders
- **Event Subscriptions**: Use `this.on(target, { event: handler })` to subscribe to TypedEventTarget events
- **Context**: Use `this.context.set(value)` and `this.context.get(ProviderFunction)` for dependency injection

## Game Flow

### 1. Connection Phase
- Players enter their name on the home page
- Client establishes SSE connection to `/api/connect/:name`
- Server assigns unique token and adds player to room
- Players see lobby with connected players list

### 2. Game Setup Phase
- Any player can start the game with configurable options:
  - **Duration**: 2 or 3 minutes
  - **Minimum word length**: 3, 4, or 5 letters
- Server generates a high-quality 4x4 Boggle board using official dice
- Game state transitions: `pending` → `starting` (5s countdown) → `started`

### 3. Active Game Phase
- Players interact with the 4x4 letter grid via touch/mouse
- Words are formed by connecting adjacent letters (including diagonals)
- Real-time word validation and submission
- Toast notifications provide immediate feedback
- Game timer counts down with visual indicators

### 4. Scoring Phase
- Game ends automatically when timer expires
- Server calculates final scores and identifies duplicate words
- Score display shows detailed breakdown per player
- Players can start a new game

## API Endpoints

### GET `/api/connect/:name`
**Purpose**: Establish SSE connection for real-time game updates
- **Headers Required**: `Accept: text/event-stream`
- **Response**: SSE stream with events:
  - `connected`: Player's unique token
  - `state`: Game state updates
- **Error Cases**:
  - `409`: Name already taken
  - `400`: Missing SSE accept header

### POST `/api/start`
**Purpose**: Start a new game with specified options
- **Body**: `{ token: string, wordLength?: number, time?: number }`
- **Response**: `200 "ok"` or error
- **Side Effects**: Generates board, sets timers, broadcasts state

### POST `/api/play-again`
**Purpose**: Restart game with same settings
- **Body**: `{ token: string }`
- **Response**: `200 "ok"`

### POST `/api/play-word`
**Purpose**: Submit a word during active game
- **Body**: `{ token: string, word: string }`
- **Response**: 
  - `200 "ok"`: Valid word accepted
  - `400 "bad"`: Invalid word or game not active
- **Validation**: Checks word length, game state, player membership

## Frontend Components

### Core Components

#### `App` (`src/app.tsx`)
- Root component that creates the ConnectionModal instance
- Provides connection via ConnectionProvider context
- Renders `Home` or `Lobby` based on connection state
- Includes global `ToastContainer`
- Handles routing (including test page at `#test`)

#### `Home` (`src/routes/home.tsx`)
- Player name entry form
- Handles initial connection to game server
- Uses `this.context.get(ConnectionProvider)` to access connection

#### `Lobby` (`src/routes/lobby.tsx`)
- Multi-state component handling:
  - **Pending**: Player list + game configuration
  - **Starting**: Countdown timer
  - **Started**: Game board
  - **Finished**: Score table with detailed breakdown
- Subscribes to connection state changes via `this.on()`
- Complex scoring display with duplicate word handling

#### `Board` (`src/routes/board.tsx`)
- 4x4 interactive letter grid
- Uses `SelectionController` for word formation
- Shows minimum word length and game timer
- Visual feedback for selected letters via `data-selected` attribute

### Controllers and Utilities

#### `SelectionController` (`src/selection.ts`)
- Extends `TypedEventTarget` for event-based state management
- Handles touch interaction with game board
- Validates adjacent letter selection (including diagonals)
- Emits `change` and `wordSelected` events
- Supports backtracking by touching previous letter

#### `ConnectionModal` (`src/connection.ts`)
- Extends `TypedEventTarget` for reactive updates
- Manages SSE connection to server
- Handles all API communication
- Validates words against solved board
- Emits `stateChange` and `connectionChange` events

#### `ConnectionProvider` (`src/ConnectionProvider.tsx`)
- Context provider component for sharing connection instance
- Uses `this.context.set(connection)` to provide to children

#### Toast System (`src/toast.tsx`)
- `ToastController` class extends `TypedEventTarget`
- Global notification system
- Auto-dismissing messages (3s default)
- Success/error/warning states with appropriate styling

#### Timer Components (`src/routes/timer.tsx`)
- `StartTimer`: Countdown before game starts
- `GameTimer`: Game duration countdown with color-coded urgency

## Game Logic

### Board Generation (`api/game.ts`)
- Uses official Boggle dice configuration (16 dice, 6 faces each)
- Quality evaluation system scoring boards 0-100 based on:
  - Total word count (target: 80-150)
  - Word length distribution
  - Common vs. uncommon word ratio
  - Average word length
  - Presence of long words (7+ letters)
- Attempts multiple generations to find high-quality boards

### Word Validation (`solver/`)
- **RadixTree** (`tree.ts`): Efficient word lookup structure
  - Supports common word marking (words ending with `+`)
  - Fast prefix and exact word matching
- **Board Solver** (`solveBoard.ts`): Finds all valid words
  - Recursive depth-first search
  - Validates adjacent connections (8-directional)
  - Prevents revisiting same cell in single word
  - Returns words with paths and common word flags

### Scoring System
- **3-letter words**: 1 point
- **4+ letter words**: 1 point + 1 per additional letter
  - 4 letters = 2 points
  - 5 letters = 3 points
  - 6 letters = 4 points, etc.
- **Duplicate words**: 0 points (crossed out in UI)
- **Invalid words**: Rejected with toast notification

### Room Management (`api/room.ts`)
- Single shared room for all players
- Game states: `pending` → `starting` → `started` → `finished`
- Automatic game progression with timers
- Score calculation with duplicate detection
- Real-time state broadcasting via SSE

## Development

### Commands
```bash
# Development server (with hot reload)
bun run dev

# Type checking
bun run type-check
bun run type-check:watch

# Production build
bun run build

# Production server
bun run serve
```

### Key Files for Modifications

#### Adding New Game Features
- `api/room.ts`: Game state and logic
- `src/routes/lobby.tsx`: UI for different game phases
- `api/server.ts`: New API endpoints

#### UI/UX Changes
- `src/routes/`: Page components
- `src/index.css`: Global styles (Tailwind + custom)
- `src/toast.tsx`: Notification system

#### Game Rules/Scoring
- `src/routes/lobby.tsx`: Score calculation and display
- `api/room.ts`: Server-side validation
- `solver/`: Word validation logic

#### Board Generation
- `api/game.ts`: Dice configuration and quality metrics
- `solver/solveBoard.ts`: Word finding algorithm

## Common Agent Tasks

### Adding New Features
1. **New API endpoint**: Add to `api/server.ts`, update `Room` class if needed
2. **UI changes**: Modify relevant component in `src/routes/`
3. **Game logic**: Update `api/room.ts` for server-side, `src/connection.ts` for client-side
4. **Real-time updates**: Ensure state changes trigger `sendState()` in room

### Debugging Issues
1. **Connection problems**: Check SSE setup in `api/server.ts` and `src/connection.ts`
2. **Word validation**: Verify `solver/` logic and dictionary file
3. **Scoring discrepancies**: Check calculation in `src/routes/lobby.tsx`
4. **UI state issues**: Ensure `this.update()` is called after state changes, check event subscriptions

### Performance Optimization
1. **Board generation**: Adjust quality thresholds in `api/game.ts`
2. **Word lookup**: Optimize RadixTree in `solver/tree.ts`
3. **Frontend updates**: Minimize unnecessary `this.update()` calls
4. **Network**: Consider WebSocket upgrade from SSE for bidirectional needs

## Security Considerations

- **Input validation**: All user inputs validated server-side
- **Rate limiting**: Consider adding for word submissions
- **Name uniqueness**: Enforced to prevent conflicts
- **Game state integrity**: Server is authoritative source

## Deployment

The application is containerized with Docker and configured for Fly.io deployment:
- `Dockerfile`: Multi-stage build with Bun
- `fly.toml`: Fly.io configuration
- Static assets served from `/dist/`
- Environment variable support for port configuration

This documentation should provide agents with comprehensive understanding of the codebase structure, game mechanics, and common modification patterns.
