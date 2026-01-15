import { ConnectionProvider } from "@/ConnectionProvider.tsx";
import { Handle } from "@remix-run/component";

export function GameConfig(this: Handle) {
  const connection = this.context.get(ConnectionProvider);

  return () => (
    <form
      class="mx-auto max-w-md px-4"
      on={{
        submit: (e) => {
          e.preventDefault();
          const data = new FormData(e.target as HTMLFormElement);
          const rawOptions = Object.fromEntries(data.entries());
          const options = {
            time: parseInt(rawOptions.time as string),
            wordLength: parseInt(rawOptions["word-length"] as string),
          };
          connection.start(options);
        },
      }}
    >
      <div class="bg-white dark:bg-gray-800 shadow-[4px_4px_0] shadow-gray-600 dark:shadow-gray-950 border-2 border-gray-100 dark:border-gray-700 rounded-md py-6 px-4 mb-4">
        Connected Players:
        <ul class="py-3">
          {connection?.state?.players.map((name) => (
            <li
              class="list-disc ml-4 flex justify-between items-center"
              key={name}
            >
              <span>{name}</span>
              {connection?.state?.persistentScores?.[name] !== undefined && (
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
            <label class="block border dark:border-gray-600 rounded-md w-fit p-2 has-checked:bg-yellow-300 has-checked:text-gray-900 shadow-[2px_2px_0] shadow-gray-600 dark:shadow-gray-950">
              <span>2 minutes</span>
              <input
                defaultChecked
                class="sr-only"
                type="radio"
                name="time"
                value="2"
              />
            </label>
            <label class="block border dark:border-gray-600 rounded-md w-fit p-2 has-checked:bg-yellow-300 has-checked:text-gray-900 shadow-[2px_2px_0] shadow-gray-600 dark:shadow-gray-950">
              <span>3 minutes</span>
              <input class="sr-only" type="radio" name="time" value="3" />
            </label>
          </div>
        </div>
        <div class="mb-0">
          <span class="block pb-1">Min Word Length:</span>
          <div class="flex items-center gap-2">
            <label class="block border dark:border-gray-600 rounded-md w-fit p-2 has-checked:bg-yellow-300 has-checked:text-gray-900 shadow-[2px_2px_0] shadow-gray-600 dark:shadow-gray-950">
              <span>3 Letters</span>
              <input
                defaultChecked
                class="sr-only"
                type="radio"
                name="word-length"
                value="3"
              />
            </label>
            <label class="block border dark:border-gray-600 rounded-md w-fit p-2 has-checked:bg-yellow-300 has-checked:text-gray-900 shadow-[2px_2px_0] shadow-gray-600 dark:shadow-gray-950">
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
        class="px-6 py-2 bg-white dark:bg-gray-800 rounded text-gray-800 dark:text-gray-100 shadow-[4px_4px_0] shadow-gray-600 dark:shadow-gray-950"
      >
        Start
      </button>
    </form>
  );
}
