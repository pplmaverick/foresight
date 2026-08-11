import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { MarketPhase } from "@/lib/solana/types";
import { PHASE_BADGE_CLASS, PHASE_LABEL } from "@/lib/market-ui";

export function PhaseBadge({ phase, className }: { phase: MarketPhase; className?: string }) {
  return (
    <Badge variant="outline" className={cn(PHASE_BADGE_CLASS[phase], className)}>
      {phase === "live" && (
        <Circle className="h-1.5 w-1.5 animate-pulse fill-success text-success" aria-hidden="true" />
      )}
      {PHASE_LABEL[phase]}
    </Badge>
  );
}
