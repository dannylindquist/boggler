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

    // Update persistent scores - add this game's score to cumulative total
    for (const [name, words] of Object.entries(wordMap)) {
      const validWords = words.filter(word => !duplicatedWords.has(word));
      const gameScore = validWords.reduce((sum, word) => sum + Math.max(1, word.length - 2), 0);
      
      // Initialize persistent score if this is the player's first game
      if (!(name in this.persistentScores)) {
        this.persistentScores[name] = 0;
      }
      
      // Add this game's score to the persistent total
      this.persistentScores[name] += gameScore;
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
