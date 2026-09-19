import { useEffect, type ReactNode } from 'react'
import { markStartup } from '../lib/startupPerformance'

export default function RouteReady({ children }: { children: ReactNode }) {
  useEffect(() => markStartup('route-mounted'), [])
  return children
}
