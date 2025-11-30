import { useContext } from "preact/hooks";
import { ConnectionContext } from "../connection.ts";
import { useTime } from "../useTime.tsx";

export const StartTimer = () => {
  const connection = useContext(ConnectionContext);
  const timeBeforeState = useTime(connection?.state?.startTime ?? 0);
  return (
    <div class="flex items-center justify-center">
      <div class="text-5xl font-bold text-center h-1/2">
        {timeBeforeState}
      </div>
    </div>
  );
};

export const GameTimer = () => {
  const connection = useContext(ConnectionContext);
  const timeRemaining = useTime(connection?.state?.endTime ?? 0);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Don't show timer if game hasn't started or is over
  if (!connection?.state?.endTime || connection?.state?.state !== 'started') {
    return null;
  }

  const isLowTime = timeRemaining.value <= 30;
  const isVeryLowTime = timeRemaining.value <= 10;

  return (
    <div class="text-center mt-4 p-3 rounded-lg bg-gray-800">
      <p class="text-sm text-gray-300 mb-1">Time Remaining</p>
      <p class={`text-2xl font-bold ${
        isVeryLowTime ? 'text-red-400 animate-pulse' : 
        isLowTime ? 'text-yellow-400' : 
        'text-green-400'
      }`}>
        {formatTime(timeRemaining.value)}
      </p>
    </div>
  );
};
