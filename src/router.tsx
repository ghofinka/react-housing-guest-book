import { lazy, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router'
import { HomeRedirect, RequireAuth, RequireRole } from './auth/guards'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import PrivacyNoticePage from './pages/PrivacyNoticePage'

const CheckInPage = lazy(() => import('./pages/guard/CheckInPage'))
const InsidePage = lazy(() => import('./pages/guard/InsidePage'))
const VisitHistoryPage = lazy(() => import('./pages/VisitHistoryPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage'))
const HousesPage = lazy(() => import('./pages/admin/HousesPage'))
const UsersPage = lazy(() => import('./pages/admin/UsersPage'))
const RetentionPage = lazy(() => import('./pages/admin/RetentionPage'))
const AuditLogPage = lazy(() => import('./pages/admin/AuditLogPage'))
const PrivacySettingsPage = lazy(() => import('./pages/admin/PrivacySettingsPage'))

const adminRoute = (path: string, page: ReactNode) => ({
  path,
  element: <RequireRole roles={['admin']}>{page}</RequireRole>,
})

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/privasi', element: <PrivacyNoticePage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomeRedirect /> },
      {
        path: 'check-in',
        element: (
          <RequireRole roles={['guard']}>
            <CheckInPage />
          </RequireRole>
        ),
      },
      {
        path: 'di-dalam',
        element: (
          <RequireRole roles={['guard']}>
            <InsidePage />
          </RequireRole>
        ),
      },
      // Optional :visitId opens the detail drawer; also lets the M6 "direct link" check be tested.
      { path: 'riwayat/:visitId?', element: <VisitHistoryPage /> },
      { path: 'akun', element: <AccountPage /> },
      { path: 'segera/:fitur', element: <ComingSoonPage /> },
      adminRoute('admin/rumah', <HousesPage />),
      adminRoute('admin/pengguna', <UsersPage />),
      adminRoute('admin/retensi', <RetentionPage />),
      adminRoute('admin/audit', <AuditLogPage />),
      adminRoute('admin/privasi', <PrivacySettingsPage />),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
