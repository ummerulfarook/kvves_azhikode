import { useSelector } from 'react-redux'
import { selectUser, selectIsAuthenticated, selectUserRole } from '../app/slices/authSlice'

/**
 * Hook to get current auth state
 */
export const useAuth = () => {
  const user = useSelector(selectUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const role = useSelector(selectUserRole)

  return { user, isAuthenticated, role }
}

export default useAuth
