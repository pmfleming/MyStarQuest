import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { useNavigate } from 'react-router-dom'

import { invitationPath } from './invitationPath'
export default function InvitationLinks() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let disposed = false
    let remove: (() => Promise<void>) | undefined
    const open = (url: string) => {
      const path = invitationPath(url)
      if (path && !disposed) void navigate(path)
    }
    void import('@capacitor/app').then(async ({ App }) => {
      const listener = await App.addListener('appUrlOpen', ({ url }) =>
        open(url)
      )
      if (disposed) {
        await listener.remove()
        return
      }
      remove = () => listener.remove()
      const launch = await App.getLaunchUrl()
      if (launch) open(launch.url)
    })
    return () => {
      disposed = true
      void remove?.()
    }
  }, [navigate])
  return null
}
