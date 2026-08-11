"use client";

import { useEffect, useState } from "react";

/** Seconds remaining until `targetUnixSeconds`, ticking faster as it gets closer. */
export function useCountdown(targetUnixSeconds: number): number {
  const [remaining, setRemaining] = useState(() => targetUnixSeconds - Date.now() / 1000);

  useEffect(() => {
    const tick = () => setRemaining(targetUnixSeconds - Date.now() / 1000);
    tick();
    const intervalMs = remaining > 3600 ? 60_000 : remaining > 60 ? 5_000 : 1_000;
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
    // Re-throttle the tick rate as we cross minute boundaries near the target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUnixSeconds, Math.floor(remaining / 60)]);

  return Math.max(0, remaining);
}
