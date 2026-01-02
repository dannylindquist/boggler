import { createRoot } from "@remix-run/component";
import { App } from "./app.tsx";
import "./index.css";

createRoot(document.getElementById("app")!).render(<App />);
