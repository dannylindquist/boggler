import { TypedEventTarget } from "@remix-run/interaction";

const STORAGE_KEY = "boggle-theme";

export type Theme = "light" | "dark" | "system";

type ThemeControllerEvents = {
  themeChange: Event;
};

export class ThemeController extends TypedEventTarget<ThemeControllerEvents> {
  private _theme: Theme = "system";
  private _isDark: boolean = false;
  private mediaQuery: MediaQueryList;

  constructor() {
    super();
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.mediaQuery.addEventListener("change", this.handleSystemChange);
    this.initTheme();
  }

  private handleSystemChange = () => {
    // Only react to system changes if user hasn't set a preference
    if (this._theme === "system") {
      this.applyTheme();
      this.dispatchEvent(new Event("themeChange"));
    }
  };

  private initTheme() {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && (stored === "light" || stored === "dark")) {
      this._theme = stored;
    } else {
      this._theme = "system";
    }
    this.applyTheme();
  }

  private applyTheme() {
    const shouldBeDark =
      this._theme === "dark" ||
      (this._theme === "system" && this.mediaQuery.matches);

    this._isDark = shouldBeDark;

    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  get theme(): Theme {
    return this._theme;
  }

  get isDark(): boolean {
    return this._isDark;
  }

  toggle() {
    // Cycle through: system -> light -> dark -> system
    // Or if system preference matches current, just toggle
    if (this._theme === "system") {
      // If system is dark, go to light. If system is light, go to dark.
      this._theme = this._isDark ? "light" : "dark";
    } else if (this._theme === "light") {
      this._theme = "dark";
    } else {
      this._theme = "light";
    }

    localStorage.setItem(STORAGE_KEY, this._theme);
    this.applyTheme();
    this.dispatchEvent(new Event("themeChange"));
  }

  setTheme(theme: Theme) {
    this._theme = theme;
    if (theme === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, theme);
    }
    this.applyTheme();
    this.dispatchEvent(new Event("themeChange"));
  }

  destroy() {
    this.mediaQuery.removeEventListener("change", this.handleSystemChange);
  }
}

// Singleton instance for use across the app
export const themeController = new ThemeController();
