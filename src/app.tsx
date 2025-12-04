import { useMemo } from "preact/hooks";
import { ConnectionContext, ConnectionModal } from "./connection.ts";
import { Home } from "./routes/home.tsx";
import { Lobby } from "./routes/lobby.tsx";
import { TestPage } from "./routes/test.tsx";
import { ToastContainer } from "./toast.tsx";

export function App() {
  const connection = useMemo(() => new ConnectionModal(), []);

  // Simple routing based on URL hash
  const currentRoute = window.location.hash.slice(1) || "";

  // Test route for component showcase
  if (currentRoute === "test") {
    return <TestPage />;
  }

  return (
    <ConnectionContext.Provider value={connection}>
      <h1 class="text-4xl text-center py-4 font-black tracking-tight">
        Boggle
      </h1>
      <main class="mt-8">{!connection.connected ? <Home /> : <Lobby />}</main>
      <ToastContainer />
    </ConnectionContext.Provider>
  );
}
