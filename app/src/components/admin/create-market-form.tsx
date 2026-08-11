"use client";

import { useEffect, useState } from "react";
import { BN } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProgram } from "@/hooks/use-program";
import { useMarkets } from "@/hooks/use-markets";
import { methodsOf } from "@/lib/solana/accounts";
import { findMarketAuthorityPda, findMarketPda } from "@/lib/solana/pda";
import { toCategoryArg } from "@/lib/solana/mappers";
import {
  CATEGORIES,
  MAX_DESCRIPTION_LEN,
  MAX_OPTIONS,
  MAX_OPTION_LEN,
  MAX_TITLE_LEN,
  MIN_OPTIONS,
  type CategoryName,
} from "@/lib/solana/constants";
import type { MarketAccount } from "@/lib/solana/types";

/** datetime-local has no timezone — the browser interprets it in local time, which is what we want. */
function toUnixSeconds(datetimeLocal: string): number | null {
  if (!datetimeLocal) return null;
  const ms = new Date(datetimeLocal).getTime();
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

function nextMarketId(markets: MarketAccount[] | null): string {
  if (!markets || markets.length === 0) return "0";
  const max = markets.reduce((acc, m) => (m.marketId.gt(acc) ? m.marketId : acc), markets[0].marketId);
  return max.addn(1).toString();
}

export function CreateMarketForm({ onCreated }: { onCreated: () => void }) {
  const { publicKey } = useWallet();
  const program = useProgram();
  const { markets, refresh: refreshMarkets } = useMarkets();

  const [category, setCategory] = useState<CategoryName>("Crypto");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [marketId, setMarketId] = useState("0");
  const [marketIdTouched, setMarketIdTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Keep the suggested market ID in sync with the chain until the admin edits it manually.
  useEffect(() => {
    if (!marketIdTouched) setMarketId(nextMarketId(markets));
  }, [markets, marketIdTouched]);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addOption() {
    setOptions((prev) => (prev.length < MAX_OPTIONS ? [...prev, ""] : prev));
  }

  function removeOption(index: number) {
    setOptions((prev) => (prev.length > MIN_OPTIONS ? prev.filter((_, i) => i !== index) : prev));
  }

  const trimmedTitle = title.trim();
  const trimmedOptions = options.map((o) => o.trim());
  const startSeconds = toUnixSeconds(startTime);
  const endSeconds = toUnixSeconds(endTime);
  const marketIdValue = Number(marketId);

  const errors: string[] = [];
  if (trimmedTitle.length === 0) errors.push("Title is required.");
  if (trimmedTitle.length > MAX_TITLE_LEN) errors.push(`Title exceeds ${MAX_TITLE_LEN} characters.`);
  if (description.length > MAX_DESCRIPTION_LEN)
    errors.push(`Description exceeds ${MAX_DESCRIPTION_LEN} characters.`);
  if (trimmedOptions.some((o) => o.length === 0)) errors.push("All options must have text.");
  if (trimmedOptions.some((o) => o.length > MAX_OPTION_LEN))
    errors.push(`Each option must be ${MAX_OPTION_LEN} characters or fewer.`);
  if (startSeconds === null) errors.push("Start time is required.");
  if (endSeconds === null) errors.push("End time is required.");
  if (startSeconds !== null && endSeconds !== null && endSeconds <= startSeconds)
    errors.push("End time must be after start time.");
  if (marketId.trim() === "" || !Number.isInteger(marketIdValue) || marketIdValue < 0)
    errors.push("Market ID must be a non-negative whole number.");

  const canSubmit = !!publicKey && errors.length === 0 && !submitting;

  async function handleSubmit() {
    if (!publicKey || startSeconds === null || endSeconds === null) return;
    setSubmitting(true);
    try {
      const idBn = new BN(marketId);
      const [marketAuthority] = findMarketAuthorityPda();
      const [market] = findMarketPda(idBn);

      await methodsOf(program)
        .createMarket(
          idBn,
          toCategoryArg(category),
          trimmedTitle,
          description.trim(),
          trimmedOptions,
          new BN(startSeconds),
          new BN(endSeconds)
        )
        .accounts({
          admin: publicKey,
          marketAuthority,
          market,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Market created", { description: trimmedTitle });
      setTitle("");
      setDescription("");
      setOptions(["", ""]);
      setStartTime("");
      setEndTime("");
      setMarketIdTouched(false);
      refreshMarkets();
      onCreated();
    } catch (err) {
      toast.error("Create market failed", {
        description: err instanceof Error ? err.message : "Transaction was not confirmed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Market</CardTitle>
        <CardDescription>Define a new prediction market for the program.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CategoryName)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="market-id">Market ID</Label>
            <Input
              id="market-id"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={marketId}
              onChange={(e) => {
                setMarketIdTouched(true);
                setMarketId(e.target.value);
              }}
              className="font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="market-title">Title</Label>
          <Input
            id="market-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Will BTC close above $100k by Dec 31?"
            maxLength={MAX_TITLE_LEN}
          />
          <p className="text-right text-xs text-muted-foreground">
            {title.length}/{MAX_TITLE_LEN}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="market-description">Description</Label>
          <Textarea
            id="market-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Resolution criteria and any relevant details…"
            maxLength={MAX_DESCRIPTION_LEN}
            rows={3}
          />
          <p className="text-right text-xs text-muted-foreground">
            {description.length}/{MAX_DESCRIPTION_LEN}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Options</Label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  maxLength={MAX_OPTION_LEN}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={options.length <= MIN_OPTIONS}
                  onClick={() => removeOption(index)}
                  aria-label={`Remove option ${index + 1}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={options.length >= MAX_OPTIONS}
            onClick={addOption}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add option
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start-time">Start time</Label>
            <Input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">End time</Label>
            <Input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {errors.length > 0 && (title || description || options.some(Boolean) || startTime || endTime) && (
          <ul className="list-inside list-disc space-y-1 text-xs text-destructive">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}

        <Button className="w-full" size="lg" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? "Creating market…" : "Create Market"}
        </Button>
      </CardContent>
    </Card>
  );
}
