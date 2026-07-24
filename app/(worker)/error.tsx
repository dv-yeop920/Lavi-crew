'use client'

import { RouteError } from '@/shared/ui/route-state/route-error'

export default function WorkerError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError reset={reset} />
}
