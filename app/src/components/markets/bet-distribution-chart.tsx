"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPct, formatSol, lamportsToSol } from "@/lib/solana/format";
import { OPTION_COLORS } from "@/lib/market-ui";
import type { MarketAccount } from "@/lib/solana/types";

interface ChartDatum {
  name: string;
  index: number;
  sol: number;
  pct: number;
  isWinner: boolean;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartDatum }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{d.name}</p>
      <p className="font-mono text-muted-foreground">
        {formatSol(Math.round(d.sol * 1_000_000_000))} · {formatPct(d.pct)}
      </p>
    </div>
  );
}

export function BetDistributionChart({ market }: { market: MarketAccount }) {
  const total = market.totalPool.toNumber();

  const data: ChartDatum[] = market.options.map((label, index) => {
    const poolLamports = market.optionPools[index]?.toNumber() ?? 0;
    return {
      name: label,
      index,
      sol: lamportsToSol(poolLamports),
      pct: total > 0 ? (poolLamports / total) * 100 : 0,
      isWinner: market.resolved && market.winningOption === index,
    };
  });

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        No bets placed yet — be the first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 4 }}>
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip />} />
            <Bar dataKey="pct" radius={[0, 6, 6, 0]} maxBarSize={26}>
              {data.map((d) => (
                <Cell
                  key={d.index}
                  fill={OPTION_COLORS[d.index % OPTION_COLORS.length]}
                  opacity={market.resolved && !d.isWinner ? 0.35 : 1}
                />
              ))}
              <LabelList
                dataKey="pct"
                position="right"
                formatter={(value) => formatPct(Number(value))}
                style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible data-table fallback: exact SOL amounts, not just relative bar length. */}
      <ul className="grid gap-2 sm:grid-cols-2">
        {data.map((d) => (
          <li
            key={d.index}
            className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-2 truncate">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: OPTION_COLORS[d.index % OPTION_COLORS.length] }}
                aria-hidden="true"
              />
              <span className="truncate">{d.name}</span>
              {d.isWinner && <span className="shrink-0 text-xs font-medium text-success">Winner</span>}
            </span>
            <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
              {formatSol(market.optionPools[d.index])}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
