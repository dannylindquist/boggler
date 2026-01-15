import { ConnectionProvider } from "@/ConnectionProvider.tsx";
import { Handle } from "@remix-run/component";

export function StartTimer(this: Handle) {
  const connection = this.context.get(ConnectionProvider);
  let timeRemaining = Math.ceil(
    ((connection?.state?.startTime ?? 0) - Date.now()) / 1000
  );

  let interval = setInterval(() => {
    timeRemaining = Math.ceil(
      ((connection?.state?.startTime ?? 0) - Date.now()) / 1000
    );
    if (timeRemaining <= 0) {
      clearInterval(interval);
    }
    this.update();
  }, 100);

  return () => (
    <div class="flex items-center justify-center">
      <div class="text-5xl font-bold text-center h-1/2">{timeRemaining}</div>
    </div>
  );
}

export function GameTimer(this: Handle) {
  const connection = this.context.get(ConnectionProvider);
  let timeRemaining = Math.ceil(
    ((connection?.state?.endTime ?? 0) - Date.now()) / 1000
  );

  let interval = setInterval(() => {
    timeRemaining = Math.ceil(
      ((connection?.state?.endTime ?? 0) - Date.now()) / 1000
    );
    if (timeRemaining <= 0) {
      clearInterval(interval);
    }
    this.update();
  }, 100);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const isLowTime = timeRemaining <= 30;
  const isVeryLowTime = timeRemaining <= 10;

  return () => {
    // Don't show timer if game hasn't started or is over
    if (!connection?.state?.endTime || connection?.state?.state !== "started") {
      return null;
    }

    return (
      <div class="w-fit mx-auto text-center mt-4 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-[4px_4px_0] shadow-gray-600 dark:shadow-gray-950">
        <p class="text-sm text-gray-700 dark:text-gray-300 mb-1">Time Remaining</p>
        <p
          class={`text-2xl font-bold ${
            isVeryLowTime
              ? "text-red-400 animate-pulse"
              : isLowTime
              ? "text-yellow-400"
              : "text-green-600"
          }`}
        >
          {formatTime(timeRemaining)}
        </p>
      </div>
    );
  };
}
