import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'

import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'
import PrivateRoute from '../components/PrivateRoute'

// Lazy-load pages for better performance
const LoginPage = lazy(() => import('../pages/Login/LoginPage'))
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'))
const MembersListPage = lazy(() => import('../pages/Members/MembersListPage'))
const AddMemberPage = lazy(() => import('../pages/Members/AddMemberPage'))
const MemberDetailPage = lazy(() => import('../pages/Members/MemberDetailPage'))
const EditMemberPage = lazy(() => import('../pages/Members/EditMemberPage'))
const ChitsPage = lazy(() => import('../pages/Chits/ChitsPage'))
const CollectionsPage = lazy(() => import('../pages/Collections/CollectionsPage'))
const LoansPage = lazy(() => import('../pages/Loans/LoansPage'))
const DuesPage = lazy(() => import('../pages/Dues/DuesPage'))
const ReportsPage = lazy(() => import('../pages/Reports/ReportsPage'))
const ImportPage = lazy(() => import('../pages/Import/ImportPage'))
const SettingsPage = lazy(() => import('../pages/Settings/SettingsPage'))
const CommunityPlansPage = lazy(() => import('../pages/CommunityPlans/CommunityPlansPage'))
const DistrictPage = lazy(() => import('../pages/District/DistrictPage'))

const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
  }}>
    <Spin size="large" />
  </div>
)

const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protected app routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/members" element={<MembersListPage />} />
            <Route path="/members/add" element={<AddMemberPage />} />
            <Route path="/members/:id" element={<MemberDetailPage />} />
            <Route path="/members/:id/edit" element={<EditMemberPage />} />
            <Route path="/chits" element={<ChitsPage />} />
            <Route path="/curries" element={<Navigate to="/chits" replace />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/dues" element={<DuesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/community-plans" element={<CommunityPlansPage />} />
            <Route path="/district" element={<DistrictPage />} />
          </Route>
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
)

export default AppRouter
