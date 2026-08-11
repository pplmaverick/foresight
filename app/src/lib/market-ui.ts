import { CloudSun, Trophy, Bitcoin, LineChart, type LucideIcon } from "lucide-react";
import type { CategoryName } from "@/lib/solana/constants";
import type { MarketPhase } from "@/lib/solana/types";

export const CATEGORY_ICONS: Record<CategoryName, LucideIcon> = {
  Weather: CloudSun,
  Sports: Trophy,
  Crypto: Bitcoin,
  Stock: LineChart,
};

export const PHASE_LABEL: Record<MarketPhase, string> = {
  upcoming: "Upcoming",
  live: "Live",
  ended: "Awaiting resolution",
  resolved: "Resolved",
};

/** Tailwind classes per phase, layered onto the shared badge base. */
export const PHASE_BADGE_CLASS: Record<MarketPhase, string> = {
  upcoming: "border-secondary/40 bg-secondary/10 text-secondary-foreground",
  live: "border-success/40 bg-success/10 text-success",
  ended: "border-border bg-muted text-muted-foreground",
  resolved: "border-accent/40 bg-accent/10 text-accent",
};

/** Chart series colors, indexed by option position (max 4 options). */
export const OPTION_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];
