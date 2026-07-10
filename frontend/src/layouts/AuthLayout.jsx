import { Outlet } from 'react-router-dom'

const AuthLayout = () => (
  <div className="login-container">
    <Outlet />
  </div>
)

export default AuthLayout
