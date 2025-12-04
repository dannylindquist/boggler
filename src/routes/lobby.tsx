import { useContext } from "preact/hooks";
import { ConnectionContext } from "../connection.ts";
import { Board } from "./board.tsx";
import { StartTimer } from "./timer.tsx";

export const Lobby = () => {
  const connection = useContext(ConnectionContext);
  return (
    <div>
      {connection?.state?.state === "pending" && (
        <form
          class="mx-auto max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.target as HTMLFormElement);
            const rawOptions = Object.fromEntries(data.entries());
            const options = {
              time: parseInt(rawOptions.time as string),
              wordLength: parseInt(rawOptions["word-length"] as string),
            };
            connection.start(options);
          }}
        >
          <div class="bg-white shadow-[4px_4px_0] shadow-gray-600 border-2 border-gray-100 rounded-md py-6 px-4 mb-4">
            Connected Players:
            <ul class="py-3">
              {connection?.state.players.map((name) => (
                <li
                  class="list-disc ml-4 flex justify-between items-center"
                  key={name}
                >
                  <span>{name}</span>
                  {connection?.state?.persistentScores?.[name] !==
                    undefined && (
                    <span class="text-emerald-400 font-semibold text-sm">
                      {connection.state.persistentScores[name]} pts
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div class="mb-4">
              <span class="block pb-1">Duration:</span>
              <div class="flex items-center gap-2">
                <label class="block border rounded-md w-fit p-2 has-checked:bg-yellow-300 has-checked:text-gray-900 shadow-[2px_2px_0] shadow-gray-600">
                  <span>2 minutes</span>
                  <input
                    checked
                    class="sr-only"
                    type="radio"
                    name="time"
                    value="2"
                  />
                </label>
                <label class="block border rounded-md w-fit p-2 has-checked:bg-yellow-300 has-checked:text-gray-900 shadow-[2px_2px_0] shadow-gray-600">
                  <span>3 minutes</span>
                  <input class="sr-only" type="radio" name="time" value="3" />
                </label>
              </div>
            </div>
            <div class="mb-0">
              <span class="block pb-1">Min Word Length:</span>
              <div class="flex items-center gap-2">
                <label class="block border rounded-md w-fit p-2 has-checked:bg-yellow-300 has-checked:text-gray-900 shadow-[2px_2px_0] shadow-gray-600">
                  <span>3 Letters</span>
                  <input
                    class="sr-only"
                    type="radio"
                    name="word-length"
                    value="3"
                  />
                </label>
                <label class="block border rounded-md w-fit p-2 has-checked:bg-yellow-300 has-checked:text-gray-900 shadow-[2px_2px_0] shadow-gray-600">
                  <span>4 Letters</span>
                  <input
                    checked
                    class="sr-only"
                    type="radio"
                    name="word-length"
                    value="4"
                  />
                </label>
              </div>
            </div>
          </div>
          <button
            type="submit"
            class="px-6 py-2 bg-white rounded text-gray-800 shadow-[4px_4px_0] shadow-gray-600"
          >
            Start
          </button>
        </form>
      )}
      {connection?.state?.state === "starting" && <StartTimer />}
      {connection?.state?.state === "started" && <Board />}
      {connection?.state?.state === "finished" && (
        <div class="max-w-6xl mx-auto px-2">
          <div class="text-center font-black text-xl mb-4 text-gray-700">
            Final Scores
          </div>

          {/* Scores Table */}
          <div class="bg-white rounded-lg overflow-x-auto mb-4 shadow-[4px_4px_0] shadow-gray-600">
            <table class="w-full min-w-[700px]">
              <thead class="">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                    Player
                  </th>
                  <th class="px-3 py-2 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                    Words Found
                  </th>
                  <th class="px-3 py-2 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                    Valid
                  </th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                    Game Score
                  </th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                    Total Score
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-300">
                {Object.entries(connection?.state?.scores.foundWords || {})
                  .sort(([nameA, wordsA], [nameB, wordsB]) => {
                    // Sort by total persistent score (descending)
                    const totalScoreA =
                      connection?.state?.persistentScores?.[nameA] || 0;
                    const totalScoreB =
                      connection?.state?.persistentScores?.[nameB] || 0;
                    return totalScoreB - totalScoreA;
                  })
                  .map(([name, words]) => {
                    const validWords = words.filter(
                      (word: string) =>
                        !connection?.state?.scores.duplicateWords.includes(word)
                    );
                    const duplicateWords = words.filter((word: string) =>
                      connection?.state?.scores.duplicateWords.includes(word)
                    );
                    const totalScore = validWords.reduce(
                      (sum: number, word: string) =>
                        sum + Math.max(1, word.length - 2),
                      0
                    );

                    return (
                      <tr
                        key={name}
                        class="hover:bg-gray-750 transition-colors"
                      >
                        <td class="px-3 py-2">
                          <div class="text-sm font-medium text-gray-700 whitespace-nowrap">
                            {name}
                          </div>
                        </td>
                        <td class="px-3 py-2 text-center">
                          <div class="space-y-1">
                            {validWords.length > 0 && (
                              <div class="flex flex-wrap justify-center gap-1">
                                {validWords.map((word: string) => (
                                  <span
                                    key={word}
                                    class="inline-block px-1.5 py-0.5 text-xs font-medium bg-green-600 text-white rounded"
                                  >
                                    {word}
                                  </span>
                                ))}
                              </div>
                            )}
                            {duplicateWords.length > 0 && (
                              <div class="flex flex-wrap justify-center gap-1">
                                {duplicateWords.map((word: string) => (
                                  <span
                                    key={word}
                                    class="inline-block px-1.5 py-0.5 text-xs font-medium bg-red-600 text-white rounded line-through opacity-75"
                                    title="Duplicate word - no points"
                                  >
                                    {word}
                                  </span>
                                ))}
                              </div>
                            )}
                            {words.length === 0 && (
                              <span class="text-gray-700 text-xs">
                                No words
                              </span>
                            )}
                          </div>
                        </td>
                        <td class="px-3 py-2 text-center">
                          <div class="text-sm font-semibold text-green-600">
                            {validWords.length}
                          </div>
                          {duplicateWords.length > 0 && (
                            <div class="text-xs text-red-600">
                              -{duplicateWords.length}
                            </div>
                          )}
                        </td>
                        <td class="px-3 py-2 text-right">
                          <span class="text-lg font-bold text-green-600">
                            {totalScore}
                          </span>
                        </td>
                        <td class="px-3 py-2 text-right">
                          <span class="text-xl font-bold text-yellow-600">
                            {connection?.state?.persistentScores?.[name] || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div class="flex justify-center gap-4 mb-4 text-xs">
            <div class="flex items-center gap-1">
              <span class="inline-block w-2 h-2 bg-green-600 rounded"></span>
              <span class="text-gray-700">Valid</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="inline-block w-2 h-2 bg-red-600 rounded"></span>
              <span class="text-gray-700">Duplicate</span>
            </div>
          </div>

          <div class="flex justify-center gap-4">
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-white shadow-[4px_4px_0] shadow-gray-600 text-sm"
              onClick={() => connection?.playAgain()}
            >
              <svg
                data-slot="icon"
                fill="none"
                stroke-width="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
                ></path>
              </svg>
              Play Again
            </button>
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-white shadow-[4px_4px_0] shadow-gray-600 text-sm"
              onClick={() => connection?.configureGame()}
            >
              <svg
                data-slot="icon"
                fill="none"
                stroke-width="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                ></path>
              </svg>
              Configure Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
