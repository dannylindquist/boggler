import { useMemo } from 'preact/hooks';
import { ConnectionContext, ConnectionModal } from "./connection.ts";
import { Home } from "./routes/home.tsx";
import { Lobby } from "./routes/lobby.tsx";
import { ToastContainer } from "./toast.tsx";


export function App() {
  const connection = useMemo(() => new ConnectionModal(), []);

  return (
    <ConnectionContext.Provider value={connection}>
      <h1 class="text-4xl text-center">Boggle</h1>
      <main class="mt-8">
        {!connection.connected ? <Home /> : <Lobby />}
      </main>
      <ToastContainer />
    </ConnectionContext.Provider>
  );
}
