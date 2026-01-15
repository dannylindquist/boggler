import { ConnectionProvider } from "@/ConnectionProvider.tsx";
import { Handle } from "@remix-run/component";

interface ResetConfirmModalProps {
  onClose: () => void;
}

export function ResetConfirmModal(
  this: Handle,
  { onClose }: ResetConfirmModalProps
) {
  const connection = this.context.get(ConnectionProvider);

  return () => (
    <div
      class="fixed inset-0 bg-black/20 dark:bg-black/50 bg-opacity-50 flex items-center justify-center z-50"
      on={{
        click: onClose,
      }}
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-[4px_4px_0] shadow-gray-600 dark:shadow-gray-950 border-2 border-gray-800 dark:border-gray-600 p-6 max-w-md mx-4"
        on={{
          click: (e) => e.stopPropagation(),
        }}
      >
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Reset Scores?
        </h3>
        <p class="text-gray-700 dark:text-gray-300 mb-6">
          Are you sure you want to reset all player scores? This action cannot
          be undone.
        </p>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-[2px_2px_0] shadow-gray-600 dark:shadow-gray-950 hover:bg-gray-300 dark:hover:bg-gray-600"
            on={{
              click: onClose,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg font-semibold bg-red-600 text-white shadow-[2px_2px_0] shadow-gray-600 dark:shadow-gray-950 hover:bg-red-700"
            on={{
              click: () => {
                connection?.resetScores();
                onClose();
              },
            }}
          >
            Reset Scores
          </button>
        </div>
      </div>
    </div>
  );
}
