import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'

interface NavigationHeaderProps {
  title: string
  backHref?: string
  showCreateButton?: boolean
}

export function NavigationHeader({
  title,
  backHref,
  showCreateButton = false,
}: NavigationHeaderProps) {
  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {backHref && (
            <Link href={backHref}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        {showCreateButton && (
          <Link href="/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Strategy
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}
