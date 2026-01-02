import { ConnectionProvider } from "@/ConnectionProvider.tsx";
import { Handle } from "@remix-run/component";
import { SelectionController } from "../selection.ts";
import { GameTimer } from "./timer.tsx";

export function Board(this: Handle) {
  const connection = this.context.get(ConnectionProvider);
  const selectionController = new SelectionController();
  const minWordLength = connection?.state?.minWordLength ?? 3;

  this.on(selectionController, {
    change: () => this.update(),
    wordSelected: async (event) => {
      if (event.selection.length >= minWordLength) {
        this.update();
        await connection?.playWord(event.selection);
      }
    },
  });

  return () => (
    <div class="px-2">
      <div class="text-center mb-4">
        <p class="text-sm text-gray-700">
          Minimum word length: <span class="font-bold">{minWordLength}</span>{" "}
          letters
        </p>
      </div>
      <div
        on={{
          touchstart: (event) => selectionController.handleTouchStart(event),
          touchmove: (event) => selectionController.handleTouchMove(event),
          touchend: (event) => selectionController.handleTouchEnd(event),
        }}
        class="grid grid-cols-4 aspect-square bg-gray-400 mx-auto max-w-[400px] gap-0.5 border rounded-xl overflow-hidden shadow-[4px_4px_0] shadow-gray-600"
      >
        {connection?.state?.board.map((row, index) => (
          <div
            key={index}
            data-cell
            data-index={index}
            data-selected={
              selectionController.touchedCells.includes(index)
                ? true
                : undefined
            }
            class="aspect-square grid place-items-center content-center text-gray-900 bg-gray-50 text-3xl data-selected:bg-yellow-400"
          >
            {row}
          </div>
        ))}
      </div>
      <GameTimer />
    </div>
  );
}
