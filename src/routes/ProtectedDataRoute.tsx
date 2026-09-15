import { Outlet } from 'react-router-dom'
import { ChildrenProvider } from '../data/useChildren'
import OfflineBoundary from '../offline/OfflineBoundary'

const ProtectedDataRoute = () => (
  <OfflineBoundary>
    <ChildrenProvider>
      <Outlet />
    </ChildrenProvider>
  </OfflineBoundary>
)

export default ProtectedDataRoute
