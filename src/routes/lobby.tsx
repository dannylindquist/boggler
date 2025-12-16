import { useContext, useState } from "preact/hooks";
import { ConnectionContext } from "../connection.ts";
import { Board } from "./board.tsx";
import { StartTimer } from "./timer.tsx";

export const Lobby = () => {
  const connection = useContext(ConnectionContext);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  return (
    <div>
      {connection?.state?.state === "pending" && (
        <form
          class="mx-auto max-w-md px-4"
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
                    defaultChecked
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
                    defaultChecked
                    class="sr-only"
                    type="radio"
                    name="word-length"
                    value="3"
                  />
                </label>
                <label class="block border rounded-md w-fit p-2 has-checked:bg-yellow-300 has-checked:text-gray-900 shadow-[2px_2px_0] shadow-gray-600">
                  <span>4 Letters</span>
                  <input
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
          <div class="bg-white rounded-lg overflow-x-auto mb-4 shadow-[4px_4px_0] shadow-gray-600 border border-gray-800">
            <table class="w-full min-w-[700px]">
              <thead class="border-b border-gray-300">
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
                {(() => {
                  // Calculate game scores for all players first
                  const playerScores = Object.entries(
                    connection?.state?.scores.foundWords || {}
                  ).map(([name, words]) => {
                    const contestedWords =
                      connection?.state?.contestedWords || [];
                    const validWords = words.filter(
                      (word: string) =>
                        !connection?.state?.scores.duplicateWords.includes(
                          word
                        ) && !contestedWords.includes(word)
                    );
                    const totalScore = validWords.reduce(
                      (sum: number, word: string) =>
                        sum + Math.max(1, word.length - 2),
                      0
                    );
                    return { name, words, totalScore };
                  });

                  // Find the maximum game score
                  const maxGameScore = Math.max(
                    ...playerScores.map((p) => p.totalScore),
                    0
                  );

                  // Sort by total persistent score (descending)
                  return playerScores
                    .sort((a, b) => {
                      const totalScoreA =
                        connection?.state?.persistentScores?.[a.name] || 0;
                      const totalScoreB =
                        connection?.state?.persistentScores?.[b.name] || 0;
                      return totalScoreB - totalScoreA;
                    })
                    .map(({ name, words, totalScore }) => {
                      const contestedWords =
                        connection?.state?.contestedWords || [];
                      const validWords = words.filter(
                        (word: string) =>
                          !connection?.state?.scores.duplicateWords.includes(
                            word
                          ) && !contestedWords.includes(word)
                      );
                      const contestedValidWords = words.filter(
                        (word: string) =>
                          !connection?.state?.scores.duplicateWords.includes(
                            word
                          ) && contestedWords.includes(word)
                      );
                      const duplicateWords = words.filter((word: string) =>
                        connection?.state?.scores.duplicateWords.includes(word)
                      );
                      const isWinner =
                        totalScore === maxGameScore && maxGameScore > 0;

                      return (
                        <tr
                          key={name}
                          class="hover:bg-gray-750 transition-colors"
                        >
                          <td class="px-3 py-2">
                            <div class="text-sm font-medium text-gray-700 whitespace-nowrap flex items-center gap-1">
                              {name}
                              {isWinner && (
                                <svg
                                  class="w-4 h-4 text-yellow-500 fill-yellow-500"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              )}
                            </div>
                          </td>
                          <td class="px-3 py-2 text-center">
                            <div class="space-y-1">
                              {validWords.length > 0 && (
                                <div class="flex flex-wrap justify-center gap-1">
                                  {validWords.map((word: string) => (
                                    <button
                                      key={word}
                                      onClick={() =>
                                        connection?.contestWord(name, word)
                                      }
                                      class="inline-block px-1.5 py-0.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer transition-colors"
                                      title="Click to contest this word"
                                    >
                                      {word}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {contestedValidWords.length > 0 && (
                                <div class="flex flex-wrap justify-center gap-1">
                                  {contestedValidWords.map((word: string) => (
                                    <button
                                      key={word}
                                      onClick={() =>
                                        connection?.contestWord(name, word)
                                      }
                                      class="inline-block px-1.5 py-0.5 text-xs font-medium bg-orange-600 text-white rounded line-through opacity-75 hover:bg-orange-700 cursor-pointer transition-colors"
                                      title="Contested - click to un-contest"
                                    >
                                      {word}
                                    </button>
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
                            {contestedValidWords.length > 0 && (
                              <div class="text-xs text-orange-600">
                                -{contestedValidWords.length} contested
                              </div>
                            )}
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
                    });
                })()}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div class="flex justify-center gap-4 mb-4 text-xs">
            <div class="flex items-center gap-1">
              <span class="inline-block w-2 h-2 bg-green-600 rounded"></span>
              <span class="text-gray-700">Valid (click to contest)</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="inline-block w-2 h-2 bg-orange-600 rounded"></span>
              <span class="text-gray-700">Contested (click to un-contest)</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="inline-block w-2 h-2 bg-red-600 rounded"></span>
              <span class="text-gray-700">Duplicate</span>
            </div>
          </div>

          <div class="flex flex-col md:flex-row justify-center gap-4 pb-6">
            <button
              type="button"
              class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold bg-white shadow-[4px_4px_0] shadow-gray-600 text-sm w-full md:w-auto"
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
              class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold bg-white shadow-[4px_4px_0] shadow-gray-600 text-sm w-full md:w-auto"
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
            <button
              type="button"
              class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold bg-white shadow-[4px_4px_0] shadow-gray-600 text-sm text-red-600 w-full md:w-auto"
              onClick={() => setShowResetConfirm(true)}
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
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                ></path>
              </svg>
              Reset Scores
            </button>
          </div>

          {/* Reset Scores Confirmation Modal */}
          {showResetConfirm && (
            <div
              class="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowResetConfirm(false)}
            >
              <div
                class="bg-white rounded-lg shadow-[4px_4px_0] shadow-gray-600 border-2 border-gray-800 p-6 max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 class="text-lg font-bold text-gray-800 mb-4">
                  Reset Scores?
                </h3>
                <p class="text-gray-700 mb-6">
                  Are you sure you want to reset all player scores? This action
                  cannot be undone.
                </p>
                <div class="flex justify-end gap-3">
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-800 shadow-[2px_2px_0] shadow-gray-600 hover:bg-gray-300"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg font-semibold bg-red-600 text-white shadow-[2px_2px_0] shadow-gray-600 hover:bg-red-700"
                    onClick={() => {
                      connection?.resetScores();
                      setShowResetConfirm(false);
                    }}
                  >
                    Reset Scores
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
