import { useEffect, useState } from "react";

export const useFormatTimeSince = (time = 0) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (time === 0) return;

    const timerId = setInterval(() => {
      setNow(Date.now()); // always recalc from current time
    }, 1000);

    return () => clearInterval(timerId);
  }, [time]);

  if (time === 0) return "0s";

  const diff = Math.max(0, now - time);
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const d = new Date(time);

  return d.toLocaleTimeString();
};
