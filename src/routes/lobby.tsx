import { ConnectionProvider } from "@/ConnectionProvider.tsx";
import { Handle } from "@remix-run/component";
import { AllWordsDialog } from "./all-words-dialog.tsx";
import { Board } from "./board.tsx";
import { GameConfig } from "./game-config.tsx";
import { ResetConfirmModal } from "./reset-confirm-modal.tsx";
import { ScoresTable } from "./scores-table.tsx";
import { StartTimer } from "./timer.tsx";

export function Lobby(this: Handle) {
  const connection = this.context.get(ConnectionProvider);
  let showResetConfirm = false;
  let showAllWordsDialog = false;
  let previousState: string | undefined = connection?.state?.state;

  this.on(connection, {
    stateChange: () => {
      const currentState = connection?.state?.state;
      // Reset modal states when transitioning away from "finished"
      if (previousState === "finished" && currentState !== "finished") {
        showResetConfirm = false;
        showAllWordsDialog = false;
      }
      previousState = currentState;
      this.update();
    },
    connectionChange: () => this.update(),
  });

  return () => (
    <div>
      {connection?.state?.state === "pending" && <GameConfig />}
      {connection?.state?.state === "starting" && <StartTimer />}
      {connection?.state?.state === "started" && <Board />}
      {connection?.state?.state === "finished" && (
        <div class="max-w-6xl mx-auto px-2">
          <ScoresTable
            onShowResetConfirm={() => {
              showResetConfirm = true;
              this.update();
            }}
            onShowAllWords={() => {
              showAllWordsDialog = true;
              this.update();
            }}
          />

          {showResetConfirm && (
            <ResetConfirmModal
              onClose={() => {
                showResetConfirm = false;
                this.update();
              }}
            />
          )}

          {showAllWordsDialog && (
            <AllWordsDialog
              onClose={() => {
                showAllWordsDialog = false;
                this.update();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
