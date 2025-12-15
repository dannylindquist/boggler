import { solve_board } from "../solver/solveBoard.ts";
import { generateBoard } from "./game.ts";

type Event = {
  type: string;
  data: string;
};
export class Room {
  state: "pending" | "starting" | "started" | "finished" = "pending";
  startTime: number | undefined = undefined;
  endTime: number | undefined = undefined;
  board: string[] = [];
  minWordLength: number = 3;
  gameDuration: number = 2;
  scores: {
    duplicateWords: string[];
    foundWords: Record<string, string[]>;
  } = { duplicateWords: [], foundWords: {} };
  // Persistent scores across games - tracks cumulative score for each player
  persistentScores: Record<string, number> = {};
  // Contested words - words that have been contested and should not count for points
  contestedWords: Set<string> = new Set();
  // Base game scores - the original scores for the current finished game (before contesting)
  // Used to track what was added to persistent scores, so we can adjust when words are contested
  baseGameScores: Record<string, number> = {};
  wordList: Record<number, {
    word: string;
    path: string;
    common: boolean;
  }[]> = {};
  members: Map<
    string,
    { uid: string; callback: (event: Event) => void; words: Set<string> }
  > = new Map();
  endTimeTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  constructor() {}

  resetState() {
    clearTimeout(this.endTimeTimeout);
    this.state = "pending";
    this.startTime = undefined;
    this.endTime = undefined;
    this.board = [];
    this.minWordLength = 3;
    this.gameDuration = 2;
    this.scores = { duplicateWords: [], foundWords: {} };
    this.wordList = {};
    this.contestedWords.clear();
    this.baseGameScores = {};
    // Keep persistent scores when resetting (only clear when all members leave)
  }

  configureGame(initiator: string) {
    const members = [...this.members.values()];
    // verify that the initiator is in the room
    if (members.some((member) => member.uid === initiator)) {
      clearTimeout(this.endTimeTimeout);
      this.state = "pending";
      this.startTime = undefined;
      this.endTime = undefined;
      this.board = [];
      this.scores = { duplicateWords: [], foundWords: {} };
      this.wordList = {};
      this.contestedWords.clear();
      this.baseGameScores = {};
      // Clear all player words for fresh start but keep persistent scores
      for (const member of this.members.values()) {
        member.words.clear();
      }
      this.sendState();
    }
  }

  resetScores(initiator: string) {
    const members = [...this.members.values()];
    // verify that the initiator is in the room
    if (members.some((member) => member.uid === initiator)) {
      this.persistentScores = {};
      this.sendState();
    }
  }

  addMember(name: string, cb: (event: Event) => void) {
    const uuid = crypto.randomUUID();
    this.members.set(name, {
      uid: uuid,
      words: new Set<string>(),
      callback: cb,
    });
    this.sendState();
    return uuid;
  }

  sendState() {
    for (const value of this.members.values()) {
      value.callback({
        type: "state",
        data: JSON.stringify(this.getState()),
      });
    }
  }

  getState() {
    return {
      board: this.board,
      state: this.state,
      startTime: this.startTime,
      endTime: this.endTime,
      players: Array.from(this.members.keys()),
      wordList: this.wordList,
      scores: this.scores,
      persistentScores: this.persistentScores,
      contestedWords: Array.from(this.contestedWords),
      minWordLength: this.minWordLength,
      gameDuration: this.gameDuration,
    };
  }

  removeMember(name: string) {
    this.members.delete(name);
    if (this.members.size === 0) {
      this.resetState();
      // Clear persistent scores when room is empty
      this.persistentScores = {};
    }
    this.sendState();
  }

  hasMember(name: string) {
    return this.members.has(name);
  }

  calculateScores() {
    const uniqueWords = new Set<string>();
    const duplicatedWords = new Set<string>();
    const wordMap: Record<string, string[]> = {};
    for (const [name, data] of this.members.entries()) {
      for (const word of data.words) {
        if (uniqueWords.has(word)) {
          duplicatedWords.add(word);
        }
        uniqueWords.add(word);
      }
      wordMap[name] = [...data.words];
    }
    this.scores = {
      duplicateWords: [...duplicatedWords],
      foundWords: wordMap,
    };

    // Calculate base game scores (before any contesting)
    // Store these so we can adjust persistent scores when words are contested
    this.baseGameScores = {};
    for (const [name, words] of Object.entries(wordMap)) {
      const validWords = words.filter(word => !duplicatedWords.has(word));
      const gameScore = validWords.reduce((sum, word) => sum + Math.max(1, word.length - 2), 0);
      this.baseGameScores[name] = gameScore;
    }

    // Update persistent scores - add this game's base score to cumulative total
    // If words are contested later, we'll adjust the persistent scores accordingly
    for (const [name, baseScore] of Object.entries(this.baseGameScores)) {
      // Initialize persistent score if this is the player's first game
      if (!(name in this.persistentScores)) {
        this.persistentScores[name] = 0;
      }
      
      // Add this game's base score to the persistent total
      this.persistentScores[name] += baseScore;
    }
    
    // Clear contested words for the new game
    this.contestedWords.clear();
  }

  calculateCurrentGameScore(playerName: string): number {
    const words = this.scores.foundWords[playerName] || [];
    const validWords = words.filter(
      word => 
        !this.scores.duplicateWords.includes(word) && 
        !this.contestedWords.has(word)
    );
    return validWords.reduce((sum, word) => sum + Math.max(1, word.length - 2), 0);
  }

  toggleContestWord(userToken: string, playerName: string, word: string) {
    // Only allow contesting when game is finished
    if (this.state !== "finished") {
      return false;
    }

    // Verify the user is a member
    const members = [...this.members.values()];
    const member = members.find((member) => member.uid === userToken);
    if (!member) {
      return false;
    }

    // Verify the word belongs to the specified player
    const playerWords = this.scores.foundWords[playerName];
    if (!playerWords || !playerWords.includes(word)) {
      return false;
    }

    // Toggle contest status
    if (this.contestedWords.has(word)) {
      this.contestedWords.delete(word);
    } else {
      this.contestedWords.add(word);
    }

    // Recalculate persistent scores with contested words excluded
    this.recalculatePersistentScores();
    this.sendState();
    return true;
  }

  recalculatePersistentScores() {
    // Adjust persistent scores based on contested words
    // The persistent score currently includes the base game score
    // We need to calculate the difference and adjust
    for (const [name, baseScore] of Object.entries(this.baseGameScores)) {
      if (!(name in this.persistentScores)) {
        this.persistentScores[name] = 0;
      }
      
      // Calculate the current game's adjusted score (with contested words excluded)
      const adjustedScore = this.calculateCurrentGameScore(name);
      
      // The difference between base and adjusted is what we need to subtract from persistent
      // Since persistent already has baseScore, we subtract (baseScore - adjustedScore)
      const adjustment = baseScore - adjustedScore;
      this.persistentScores[name] = this.persistentScores[name] - adjustment;
    }
  }

  start(initiator: string, options?: { wordLength?: number; time?: number }) {
    if (this.state === "started") {
      return;
    }
    const members = [...this.members.values()];
    // verify that the initiator is in the room
    if (members.some((member) => member.uid === initiator)) {
      // Set game options
      if (options?.wordLength) {
        this.minWordLength = options.wordLength;
      }
      if (options?.time) {
        this.gameDuration = options.time;
      }
      
      // Clear word lists and scores from previous game but keep persistent scores
      this.scores = { duplicateWords: [], foundWords: {} };
      this.contestedWords.clear();
      this.baseGameScores = {};
      this.previousGameScores = {};
      for (const member of this.members.values()) {
        member.words.clear();
      }
      
      this.state = "starting";
      this.board = generateBoard();
      this.wordList = solve_board(this.board);
      this.startTime = Date.now() + 5 * 1000;
      this.endTime = this.startTime + this.gameDuration * 60 * 1000;
      this.sendState();
      setTimeout(() => {
        this.state = "started";
        this.sendState();
        this.endTimeTimeout = setTimeout(() => {
          this.state = "finished";
          this.calculateScores();
          this.sendState();
        }, this.endTime! - Date.now());
      }, 5000);
    }
  }

  playWord(userToken: string, word: string) {
    console.log(userToken, word);
    if (this.state !== "started") {
      return false;
    }
    
    // Validate minimum word length
    if (word.length < this.minWordLength) {
      console.log(`Word "${word}" too short. Minimum length: ${this.minWordLength}`);
      return false;
    }
    
    console.log("finding members");
    const members = [...this.members.values()];
    const member = members.find((member) => member.uid === userToken);
    if (!member) {
      return false;
    }

    // Check if player has already played this word
    if (member.words.has(word)) {
      console.log(`Player already played word: ${word}`);
      return "duplicate";
    }

    console.log("adding word");
    member.words.add(word);
    return true;
  }
}
