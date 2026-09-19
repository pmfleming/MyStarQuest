import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { hasSessionPreloadHint } from '../auth/sessionPreloadHint'
import { getRouteModule, routeModules } from './routeModules'

export default function RoutePreloader() {
  const { pathname } = useLocation()
  const { user, loading } = useAuth()
  useEffect(() => {
    if (!user && !(loading && hasSessionPreloadHint())) return
    const loadPage = getRouteModule(pathname)
    if (!loadPage) return
    // Only import code. ProtectedRoute still gates all rendering and user data.
    // Rendering retains responsibility for presenting any module-load failure.
    void Promise.all([routeModules.protectedData(), loadPage()]).catch(() => {})
  }, [pathname, user, loading])
  return null
}
