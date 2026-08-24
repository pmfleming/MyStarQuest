import { Outlet } from 'react-router-dom'
import { ChildrenProvider } from '../data/useChildren'

const ProtectedDataRoute = () => (
  <ChildrenProvider>
    <Outlet />
  </ChildrenProvider>
)

export default ProtectedDataRoute
