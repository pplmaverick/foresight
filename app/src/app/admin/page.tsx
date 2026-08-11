"use client";

import { ShieldAlert, ShieldCheck, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { AuthorityPanel } from "@/components/admin/authority-panel";
import { CreateMarketForm } from "@/components/admin/create-market-form";
import { ResolveMarketList } from "@/components/admin/resolve-market-list";
import { useMarketAuthority } from "@/hooks/use-market-authority";
import { truncateAddress } from "@/lib/solana/format";

export default function AdminPage() {
  const { publicKey, connected } = useWallet();
  const { authority, loading, refresh } = useMarketAuthority();

  const bootstrapMode = !loading && authority === null;
  const isAdmin = !connected
    ? false
    : bootstrapMode
      ? true
      : !!(publicKey && authority && publicKey.equals(authority.admin));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Admin</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Manage the market authority, create markets, and resolve outcomes.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !connected ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="font-heading text-base font-medium">Connect your wallet</p>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              This page is restricted to the program admin. Connect a wallet to continue.
            </p>
          </div>
          <ConnectWalletButton />
        </div>
      ) : !isAdmin ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="font-heading text-base font-medium">Access restricted</p>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Connected wallet doesn&apos;t match the program admin
              {authority ? ` (${truncateAddress(authority.admin.toBase58())})` : ""}.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {bootstrapMode && (
            <div className="flex items-start gap-2.5 rounded-lg border border-secondary/40 bg-secondary/10 px-3.5 py-3 text-sm">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary-foreground" aria-hidden="true" />
              <p>
                No MarketAuthority exists yet. The wallet you initialize with below becomes the
                permanent admin — double-check it&apos;s the right one.
              </p>
            </div>
          )}

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="create" disabled={bootstrapMode}>
                Create Market
              </TabsTrigger>
              <TabsTrigger value="resolve" disabled={bootstrapMode}>
                Resolve Markets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <AuthorityPanel authority={authority} loading={loading} onInitialized={refresh} />
            </TabsContent>

            <TabsContent value="create" className="mt-4">
              {!bootstrapMode && <CreateMarketForm onCreated={refresh} />}
            </TabsContent>

            <TabsContent value="resolve" className="mt-4">
              {!bootstrapMode && <ResolveMarketList />}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
