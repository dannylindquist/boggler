import { ConnectionProvider } from "@/ConnectionProvider.tsx";
import { Handle } from "@remix-run/component";

interface AllWordsDialogProps {
  onClose: () => void;
}

export function AllWordsDialog(this: Handle) {
  const connection = this.context.get(ConnectionProvider);
  let selectedWordLength: number | null = null;

  return ({ onClose }: AllWordsDialogProps) => {
    const wordList = connection?.state?.wordList || {};
    const minWordLength = connection?.state?.minWordLength || 3;
    const foundWords = connection?.state?.scores?.foundWords || {};

    // Get all words found by any player
    const allFoundWordsSet = new Set<string>();
    Object.values(foundWords).forEach((words) => {
      (words as string[]).forEach((word) => allFoundWordsSet.add(word));
    });

    // Get available word lengths (filtered by minWordLength)
    const availableLengths = Object.keys(wordList)
      .map(Number)
      .filter((len) => len >= minWordLength)
      .sort((a, b) => a - b);

    // Calculate statistics
    let totalPossibleWords = 0;
    let totalCommonWords = 0;
    let commonWordsFound = 0;

    availableLengths.forEach((len) => {
      const wordsOfLength = wordList[len] || [];
      totalPossibleWords += wordsOfLength.length;
      wordsOfLength.forEach((w: { word: string; common: boolean }) => {
        if (w.common) {
          totalCommonWords++;
          if (allFoundWordsSet.has(w.word)) {
            commonWordsFound++;
          }
        }
      });
    });

    const percentage =
      totalCommonWords > 0
        ? Math.round((commonWordsFound / totalCommonWords) * 100)
        : 0;

    // Get words to display based on selected length filter
    const wordsToDisplay: {
      word: string;
      path: string;
      common: boolean;
    }[] = [];
    if (selectedWordLength === null) {
      availableLengths.forEach((len) => {
        wordsToDisplay.push(...(wordList[len] || []));
      });
    } else {
      wordsToDisplay.push(...(wordList[selectedWordLength] || []));
    }

    // Sort words alphabetically
    wordsToDisplay.sort((a, b) => a.word.localeCompare(b.word));

    return (
      <div
        class="fixed inset-0 bg-black/20 dark:bg-black/50 bg-opacity-50 flex items-center justify-center z-50"
        on={{
          click: onClose,
        }}
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-[4px_4px_0] shadow-gray-600 dark:shadow-gray-950 border-2 border-gray-800 dark:border-gray-600 p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
          on={{
            click: (e) => e.stopPropagation(),
          }}
        >
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">
              All Possible Words
            </h3>
            <button
              type="button"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              on={{
                click: onClose,
              }}
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Statistics Bar */}
          <div class="flex flex-wrap gap-4 mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {totalPossibleWords}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400">
                Total Words
              </div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">
                {allFoundWordsSet.size}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400">
                Words Found
              </div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{percentage}%</div>
              <div class="text-xs text-gray-600 dark:text-gray-400">
                Common Words Found
              </div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-500 dark:text-gray-400">
                {commonWordsFound}/{totalCommonWords}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400">
                Common Words
              </div>
            </div>
          </div>

          {/* Length Filter Tabs */}
          <div class="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              class={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedWordLength === null
                  ? "bg-yellow-300 text-gray-900 font-semibold"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
              on={{
                click: () => {
                  selectedWordLength = null;
                  this.update();
                },
              }}
            >
              All
            </button>
            {availableLengths.map((len) => (
              <button
                key={len}
                type="button"
                class={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedWordLength === len
                    ? "bg-yellow-300 text-gray-900 font-semibold"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
                on={{
                  click: () => {
                    selectedWordLength = len;
                    this.update();
                  },
                }}
              >
                {len} letters ({(wordList[len] || []).length})
              </button>
            ))}
          </div>

          {/* Word List */}
          <div class="flex-1 overflow-y-auto">
            <div class="flex flex-wrap gap-1.5">
              {wordsToDisplay.map((w) => {
                const isFound = allFoundWordsSet.has(w.word);
                return (
                  <span
                    key={w.word}
                    class={`inline-block px-2 py-0.5 text-sm rounded ${
                      isFound
                        ? "bg-green-600 text-white font-medium"
                        : w.common
                        ? "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 italic"
                    }`}
                    title={
                      isFound
                        ? "Found by players"
                        : w.common
                        ? "Common word"
                        : "Uncommon word"
                    }
                  >
                    {w.word}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div class="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 text-xs">
            <div class="flex items-center gap-1">
              <span class="inline-block w-3 h-3 bg-green-600 rounded"></span>
              <span class="text-gray-700 dark:text-gray-300">Found</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="inline-block w-3 h-3 bg-gray-200 dark:bg-gray-600 rounded"></span>
              <span class="text-gray-700 dark:text-gray-300">
                Common (not found)
              </span>
            </div>
            <div class="flex items-center gap-1">
              <span class="inline-block w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded"></span>
              <span class="text-gray-700 dark:text-gray-300 italic">
                Uncommon
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };
}
