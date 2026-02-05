'use client'

import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { Button } from './button'

export default function ConnectWalletButton({ onclickHandler }: { onclickHandler?: () => void; className?: string }) {
  const { connect, connectors } = useConnect()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    if (!address) return null
    return (
      <Button className='w-full' onClick={() => disconnect()}>
        Disconnect ({address.slice(0, 6)}...{address.slice(-4)})
      </Button>
    )
  }

  return (
    <div>
      {connectors.map((connector) => (
        <Button
          className='w-full my-2'
          key={connector.id}
          onClick={() => {
            connect({ connector });
            onclickHandler && onclickHandler();
          }}
        >
          Connect with {connector.name}
        </Button>
      ))}
    </div>
  )
}
