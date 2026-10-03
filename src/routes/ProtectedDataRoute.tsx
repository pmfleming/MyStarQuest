import { Outlet } from 'react-router-dom'
import { ChildrenProvider } from '../data/useChildren'
import OfflineBoundary from '../offline/OfflineBoundary'
import ChildAccessProvider from '../sharing/ChildAccessProvider'

const ProtectedDataRoute = () => (
  <ChildAccessProvider>
    <OfflineBoundary>
      <ChildrenProvider>
        <Outlet />
      </ChildrenProvider>
    </OfflineBoundary>
  </ChildAccessProvider>
)

export default ProtectedDataRoute
