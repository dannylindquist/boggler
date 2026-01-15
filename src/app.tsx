import { Handle } from "@remix-run/component";
import { ConnectionModal } from "./connection.ts";
import { ConnectionProvider } from "./ConnectionProvider.tsx";
import { Home } from "./routes/home.tsx";
import { Lobby } from "./routes/lobby.tsx";
import { TestPage } from "./routes/test.tsx";
import { ThemeToggle } from "./routes/theme-toggle.tsx";
import { ToastContainer } from "./toast.tsx";

export function App(this: Handle) {
  const connection = new ConnectionModal();

  // Attempt auto-reconnect from stored session
  const storedName = ConnectionModal.getStoredName();
  if (storedName) {
    connection.connect(storedName);
  }

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
        <header class="flex items-center justify-between px-4 py-4">
          <h1 class="text-4xl font-black tracking-tight">Boggle</h1>
          <div class="flex items-center gap-3">
            {connection.isConnected && (
              <button
                class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                on={{ click: () => connection.logout() }}
                title="Change name"
              >
                {connection.playerName}
                <span class="text-xs opacity-60 ml-1">(logout)</span>
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>
        <main class="mt-8">
          {!connection.isConnected ? <Home /> : <Lobby />}
        </main>
        <ToastContainer />
      </ConnectionProvider>
    );
  };
}
