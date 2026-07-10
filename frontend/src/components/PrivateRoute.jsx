import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../app/slices/authSlice'

/**
 * Redirects unauthenticated users to /login
 */
const PrivateRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default PrivateRoute
