import { createConfig, http } from 'wagmi'
import { sepolia, localhost } from 'wagmi/chains'
import { metaMask, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'ZYNC - Strategy Vault',
      },
    }),
    // walletConnect({
    //   projectId: 'YOUR_WALLETCONNECT_PROJECT_ID'
    // }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
  batch: {
    multicall: false,
  },
})
