"use client";

import { Clock } from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";
import { formatDuration } from "@/lib/solana/format";

export function CountdownLabel({
  targetUnixSeconds,
  prefix,
}: {
  targetUnixSeconds: number;
  prefix: string;
}) {
  const remaining = useCountdown(targetUnixSeconds);

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-sm tabular-nums text-muted-foreground">
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      {prefix} {remaining > 0 ? formatDuration(remaining) : "now"}
    </span>
  );
}
