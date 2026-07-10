import { useSelector } from 'react-redux'
import { selectUserRole } from '../app/slices/authSlice'

/**
 * Hook for checking user permissions by role.
 */
export const usePermissions = () => {
  const role = useSelector(selectUserRole)

  const isAdmin = role === 'admin'
  const isStaff = role === 'staff'
  const isViewer = role === 'viewer'
  const canWrite = isAdmin || isStaff
  const canDelete = isAdmin
  const canApproveLoan = isAdmin
  const canManageUsers = isAdmin

  return {
    role,
    isAdmin,
    isStaff,
    isViewer,
    canWrite,
    canDelete,
    canApproveLoan,
    canManageUsers,
  }
}

export default usePermissions
