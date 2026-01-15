import { TypedEventTarget } from "@remix-run/interaction";
import { showToast } from "./toast.tsx";

const API_ROOT =  "";

type ConnectionModelEvents = {
  stateChange: Event;
  connectionChange: Event;
}

const STORAGE_KEY = 'boggle_player_name';

export class ConnectionModal extends TypedEventTarget<ConnectionModelEvents> {
  uuid = '';
  playerName = '';
  state:
     {
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
    | undefined
  = undefined;
  isConnected = false;
  es: EventSource | undefined = undefined;
  abortController: AbortController | undefined = undefined;
  constructor() {
    super();
  }

  static getStoredName(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  }

  static clearStoredName(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  logout() {
    ConnectionModal.clearStoredName();
    this.playerName = '';
    this.disconnect();
    this.isConnected = false;
    this.dispatchEvent(new Event("connectionChange"));
  }


  start(options: { time: number; wordLength: number }) {
    fetch(`${API_ROOT}/api/start`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ...options,
        token: this.uuid,
      }),
    }).catch(() => {});
  }

  playAgain() {
    fetch(`${API_ROOT}/api/play-again`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        token: this.uuid,
      }),
    }).catch(() => {});
  }

  configureGame() {
    fetch(`${API_ROOT}/api/configure-game`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        token: this.uuid,
      }),
    }).catch(() => {});
  }

  resetScores() {
    fetch(`${API_ROOT}/api/reset-scores`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        token: this.uuid,
      }),
    }).catch(() => {});
  }

  contestWord(playerName: string, word: string) {
    fetch(`${API_ROOT}/api/contest-word`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        token: this.uuid,
        playerName,
        word,
      }),
    }).catch(() => {});
  }

  isWordValid(attemptedWord: string) {
    const words = this.state?.wordList;
    if (!words) {
      return false;
    }
    const wordInLength = words[attemptedWord.length];
    if (!wordInLength?.some((word) => word.word === attemptedWord)) {
      return false;
    }
    return true;
  }

  async playWord(word: number[]) {
    const words = this.state?.wordList;
    const state = this.state;
    if (!words || !state) {
      return;
    }
    const wordLetters = word.map((index) => state.board[index])
      .join("").toLowerCase();

    // Check minimum word length
    const minLength = state.minWordLength ?? 3;
    if (wordLetters.length < minLength) {
      console.log(`Word "${wordLetters}" too short. Minimum length: ${minLength}`);
      showToast(`Word too short! Minimum ${minLength} letters.`, "error");
      return false;
    }

    const valid = this.isWordValid(wordLetters) ||
      this.isWordValid(wordLetters.replace(/es$/g, "")) ||
      this.isWordValid(wordLetters.replace(/s$/g, ""));

    if (valid) {
      try {
        const response = await fetch(`${API_ROOT}/api/play-word`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            token: this.uuid,
            word: wordLetters,
          }),
        });

        if (response.ok) {
          showToast(`"${wordLetters.toUpperCase()}" - Good word!`, "success");
          return true;
        } else if (response.status === 409) {
          showToast(`"${wordLetters.toUpperCase()}" - You already played this word!`, "warning");
          return false;
        } else {
          showToast(`"${wordLetters.toUpperCase()}" - Already found!`, "error");
          return false;
        }
      } catch (error) {
        showToast("Network error. Try again!", "error");
        return false;
      }
    } else {
      showToast(`"${wordLetters.toUpperCase()}" - Not a valid word!`, "error");
      return false;
    }
  }

  connect(name: string): Promise<boolean> {
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    return new Promise((res) => {
      this.es = new EventSource(
        `${API_ROOT}/api/connect/${name}`,
      );
      this.es.addEventListener("open", () => {
        console.log("connection opened");
        this.isConnected = true;
        this.playerName = name;
        localStorage.setItem(STORAGE_KEY, name);
        this.dispatchEvent(new Event("connectionChange"));
        res(true);
      }, { signal });

      this.es.addEventListener("error", () => {
        console.log("connection error");
        this.isConnected = false;
        this.dispatchEvent(new Event("connectionChange"));
        res(false);
      }, { signal });

      this.es.addEventListener("connected", (event) => {
        this.uuid = event.data;
      }, { signal });

      this.es.addEventListener("state", (event) => {
        this.state = JSON.parse(event.data);
        // @ts-ignore debugging purposes only
        globalThis.gameState = this.state;
        this.dispatchEvent(new Event("stateChange"));
      }, { signal });
    });
  }

  disconnect() {
    this.es?.close();
    this.abortController?.abort();
  }
}