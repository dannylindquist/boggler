import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

function getRoundedSeconds(time: number) {
  return Math.ceil((time - Date.now()) / 1000);
}

export const useTime = (timestamp: number) => {
  const remainingTime = useSignal(getRoundedSeconds(timestamp));

  useEffect(() => {
    const timer = setInterval(() => {
      remainingTime.value = getRoundedSeconds(timestamp);
    }, 100);

    return () => clearInterval(timer);
  }, [timestamp]);

  return remainingTime;
};
