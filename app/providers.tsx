"use client"

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { WagmiProvider } from "wagmi"
import { bsc,mainnet } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "@rainbow-me/rainbowkit/styles.css"
import { Toaster } from "sonner";

const config = getDefaultConfig({
  appName: "EVM-7702 Aggregator",
  projectId: "71aca273566b897da6ac1f7a7f36a1b5", // Replace with your WalletConnect Project ID
  chains: [bsc, mainnet],
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
          <Toaster position="top-center" richColors/>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 