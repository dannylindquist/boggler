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
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Minimum word length: <span class="font-bold">{minWordLength}</span>{" "}
          letters
        </p>
      </div>
      <div
        on={{
          touchstart: (event) => selectionController.handleTouchStart(event),
          touchmove: (event) => selectionController.handleTouchMove(event),
          touchend: (event) => selectionController.handleTouchEnd(event),
          mousedown: (event) => selectionController.handleMouseDown(event),
          mousemove: (event) => selectionController.handleMouseMove(event),
          mouseup: (event) => selectionController.handleMouseUp(event),
          mouseleave: (event) => selectionController.handleMouseLeave(event),
        }}
        class="grid grid-cols-4 aspect-square bg-gray-400 dark:bg-gray-600 mx-auto max-w-[400px] gap-0.5 border dark:border-gray-600 rounded-xl overflow-hidden shadow-[4px_4px_0] shadow-gray-600 dark:shadow-gray-950 select-none"
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
            class="aspect-square grid place-items-center content-center text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 text-3xl data-selected:bg-yellow-400 data-selected:text-gray-900"
          >
            {row}
          </div>
        ))}
      </div>
      <GameTimer />
    </div>
  );
}
