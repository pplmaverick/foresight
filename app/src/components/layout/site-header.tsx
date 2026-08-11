"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useMarketAuthority } from "@/hooks/use-market-authority";
import { getCluster, getClusterLabel } from "@/lib/solana/cluster";

const NAV_LINKS = [
  { href: "/", label: "Markets" },
  { href: "/my-positions", label: "My Positions" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const cluster = getCluster();
  const { publicKey, connected } = useWallet();
  const { authority, loading } = useMarketAuthority();

  const isAdmin = connected && (!loading && authority === null
    ? true
    : !!(publicKey && authority && publicKey.equals(authority.admin)));

  const navLinks = isAdmin ? [...NAV_LINKS, { href: "/admin", label: "Admin" }] : NAV_LINKS;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Target className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight">
              Foresight
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={cn(
              "hidden sm:inline-flex",
              cluster === "mainnet-beta" && "border-success/40 text-success"
            )}
          >
            {getClusterLabel(cluster)}
          </Badge>
          <ConnectWalletButton />
        </div>
      </div>

      <nav className="flex items-center gap-1 border-t border-border/60 px-4 py-2 sm:hidden">
        {navLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition-colors",
                active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
