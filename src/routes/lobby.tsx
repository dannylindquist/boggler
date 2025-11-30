import { useContext } from "preact/hooks";
import { ConnectionContext } from "../connection.ts";
import { Board } from "./board.tsx";
import { StartTimer } from "./timer.tsx";

export const Lobby = () => {
  const connection = useContext(ConnectionContext);
  return (
    <div>
      {connection?.state?.state === "pending" && (
        <div class="mx-auto max-w-md border-2 border-gray-100 rounded-md py-6 px-4">
          Connected Players:
          <ul class="py-3">
            {connection?.state.players.map((name) => (
              <li class="list-disc ml-4 flex justify-between items-center" key={name}>
                <span>{name}</span>
                {connection?.state?.persistentScores?.[name] !== undefined && (
                  <span class="text-yellow-400 font-semibold text-sm">
                    {connection.state.persistentScores[name]} pts
                  </span>
                )}
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.target as HTMLFormElement);
              const rawOptions = Object.fromEntries(data.entries());
              const options = {
                time: parseInt(rawOptions.time as string),
                wordLength: parseInt(rawOptions["word-length"] as string)
              };
              connection.start(options);
            }}
          >
            <div class="mb-4">
              <span>Duration:</span>
              <div class="flex items-center gap-2">
                <label class="block border rounded-md w-fit p-2 has-checked:bg-yellow-300 has-checked:text-gray-900">
                  <span>2 minutes</span>
                  <input
                    checked
                    class="sr-only"
                    type="radio"
                    name="time"
                    value="2"
                  />
                </label>
                <label class="block border rounded-md w-fit p-2 has-checked:bg-yellow-300 has-checked:text-gray-900">
                  <span>3 minutes</span>
                  <input class="sr-only" type="radio" name="time" value="3" />
                </label>
              </div>
            </div>
            <div class="mb-4">
              <span>Min Word Length:</span>
              <div class="flex items-center gap-2">
                <label class="block border rounded-md w-fit p-2 has-checked:bg-yellow-300 has-checked:text-gray-900">
                  <span>3 Letters</span>
                  <input
                    class="sr-only"
                    type="radio"
                    name="word-length"
                    value="3"
                  />
                </label>
                <label class="block border rounded-md w-fit p-2 has-checked:bg-yellow-300 has-checked:text-gray-900">
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
            <button
              type="submit"
              class="px-3 py-2 rounded bg-yellow-300 text-gray-800"
            >
              Start
            </button>
          </form>
        </div>
      )}
      {connection?.state?.state === "starting" && <StartTimer />}
      {connection?.state?.state === "started" && <Board />}
      {connection?.state?.state === "finished" && (
        <div class="max-w-6xl mx-auto px-2">
          <div class="text-center font-black text-xl mb-4 text-gray-100">🏆 Final Scores</div>
          
          {/* Scores Table */}
          <div class="bg-gray-800 rounded-lg overflow-x-auto shadow-lg mb-4">
            <table class="w-full min-w-[700px]">
              <thead class="bg-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider whitespace-nowrap">
                    Player
                  </th>
                  <th class="px-3 py-2 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider whitespace-nowrap">
                    Words Found
                  </th>
                  <th class="px-3 py-2 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider whitespace-nowrap">
                    Valid
                  </th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-200 uppercase tracking-wider whitespace-nowrap">
                    Game Score
                  </th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-yellow-300 uppercase tracking-wider whitespace-nowrap">
                    Total Score
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700">
                {Object.entries(connection?.state?.scores.foundWords || {})
                  .sort(([nameA, wordsA], [nameB, wordsB]) => {
                    // Sort by total persistent score (descending)
                    const totalScoreA = connection?.state?.persistentScores?.[nameA] || 0;
                    const totalScoreB = connection?.state?.persistentScores?.[nameB] || 0;
                    return totalScoreB - totalScoreA;
                  })
                  .map(([name, words]) => {
                    const validWords = words.filter((word: string) => 
                      !connection?.state?.scores.duplicateWords.includes(word)
                    );
                    const duplicateWords = words.filter((word: string) => 
                      connection?.state?.scores.duplicateWords.includes(word)
                    );
                    const totalScore = validWords.reduce((sum: number, word: string) => sum + Math.max(1, word.length - 2), 0);
                    
                    return (
                      <tr key={name} class="hover:bg-gray-750 transition-colors">
                        <td class="px-3 py-2">
                          <div class="text-sm font-medium text-gray-100 whitespace-nowrap">{name}</div>
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
                              <span class="text-gray-400 text-xs">No words</span>
                            )}
                          </div>
                        </td>
                        <td class="px-3 py-2 text-center">
                          <div class="text-sm font-semibold text-green-400">
                            {validWords.length}
                          </div>
                          {duplicateWords.length > 0 && (
                            <div class="text-xs text-red-400">
                              -{duplicateWords.length}
                            </div>
                          )}
                        </td>
                        <td class="px-3 py-2 text-right">
                          <span class="text-lg font-bold text-green-400">
                            {totalScore}
                          </span>
                        </td>
                        <td class="px-3 py-2 text-right">
                          <span class="text-xl font-bold text-yellow-400">
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
              <span class="text-gray-300">Valid</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="inline-block w-2 h-2 bg-red-600 rounded"></span>
              <span class="text-gray-300">Duplicate</span>
            </div>
          </div>

          <div class="flex justify-center gap-4">
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors shadow-lg text-sm"
              onClick={() => connection?.playAgain()}
            >
              🎮 Play Again
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors shadow-lg text-sm"
              onClick={() => connection?.configureGame()}
            >
              ⚙️ Configure Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
