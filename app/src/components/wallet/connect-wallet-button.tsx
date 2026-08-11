"use client";

import dynamic from "next/dynamic";

// wallet-adapter-react-ui reads from `window`, so it can't render on the server.
export const ConnectWalletButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);
