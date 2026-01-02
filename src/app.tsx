import { Handle } from "@remix-run/component";
import { ConnectionModal } from "./connection.ts";
import { ConnectionProvider } from "./ConnectionProvider.tsx";
import { Home } from "./routes/home.tsx";
import { Lobby } from "./routes/lobby.tsx";
import { TestPage } from "./routes/test.tsx";
import { ToastContainer } from "./toast.tsx";

export function App(this: Handle) {
  const connection = new ConnectionModal();

  this.on(connection, {
    connectionChange: () => this.update(),
  });

  return () => {
    // Simple routing based on URL hash
    const currentRoute = window.location.hash.slice(1) || "";

    // Test route for component showcase
    if (currentRoute === "test") {
      return <TestPage />;
    }
    return (
      <ConnectionProvider connection={connection}>
        <h1 class="text-4xl text-center py-4 font-black tracking-tight">
          Boggle
        </h1>
        <main class="mt-8">
          {!connection.isConnected ? <Home /> : <Lobby />}
        </main>
        <ToastContainer />
      </ConnectionProvider>
    );
  };
}
