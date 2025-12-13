import { signal } from "@preact/signals";
import { createContext } from "preact";
import { showToast } from "./toast.tsx";

const API_ROOT =  "";

export class ConnectionModal {
  uuid = signal("");
  _state = signal<
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
      wordList: Record<
        number,
        { word: string; path: string; common: boolean }[]
      >;
    }
    | undefined
  >(undefined);
  isConnected = signal(false);
  es: EventSource | undefined = undefined;
  abortController: AbortController | undefined = undefined;
  constructor() {}

  get state() {
    return this._state.value;
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

  isWordValid(attemptedWord: string) {
    const words = this._state.peek()?.wordList;
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
    const words = this._state.peek()?.wordList;
    const state = this._state.peek();
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
        this.isConnected.value = true;
        res(true);
      }, { signal });

      this.es.addEventListener("error", () => {
        console.log("connection error");
        this.isConnected.value = false;
        res(false);
      }, { signal });

      this.es.addEventListener("connected", (event) => {
        this.uuid.value = event.data;
      }, { signal });

      this.es.addEventListener("state", (event) => {
        this._state.value = JSON.parse(event.data);
        // @ts-ignore debugging purposes only
        globalThis.gameState = this._state;
      }, { signal });
    });
  }

  disconnect() {
    this.es?.close();
    this.abortController?.abort();
  }

  get connected() {
    return this.isConnected.value;
  }
}

export const ConnectionContext = createContext<ConnectionModal | null>(null);