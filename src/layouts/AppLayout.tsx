import { DownOutlined, KeyOutlined, LogoutOutlined, MenuOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import {
  Badge,
  Button,
  ConfigProvider,
  Drawer,
  Dropdown,
  Flex,
  Grid,
  Layout,
  Menu,
  Spin,
  Tag,
  Typography,
  type MenuProps,
} from 'antd'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import type { Role } from '../api/types'
import { syncCurrentUser, useAuth } from '../auth/useAuth'
import { RoleTag } from '../components/Tags'
import { useInsideVisits } from '../hooks/queries'
import { ADMIN_NAV, COMING_SOON, MAIN_NAV, type NavItem } from './nav'

const { Header, Sider, Content, Footer } = Layout

/** Menu key for a path: "/riwayat/abc" → "/riwayat", "/admin/rumah" → "/admin/rumah". */
function selectedKeyFor(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const depth = parts[0] === 'admin' || parts[0] === 'segera' ? 2 : 1
  return '/' + parts.slice(0, depth).join('/')
}

function useMenuItems(role: Role, insideCount?: number): MenuProps['items'] {
  return useMemo(() => {
    const toItem = (n: NavItem) => ({
      key: n.path,
      icon: n.icon,
      label:
        n.path === '/di-dalam' && insideCount ? (
          <Flex justify="space-between" align="center">
            {n.label}
            <Badge count={insideCount} overflowCount={99} color="#0f766e" />
          </Flex>
        ) : (
          n.label
        ),
    })
    const items: MenuProps['items'] = MAIN_NAV.filter((n) => n.roles.includes(role)).map(toItem)
    const admin = ADMIN_NAV.filter((n) => n.roles.includes(role))
    if (admin.length) items.push({ type: 'group', label: 'Pengelolaan', children: admin.map(toItem) })
    const soon = Object.entries(COMING_SOON).filter(([, f]) => f.roles.includes(role))
    if (soon.length) {
      items.push({
        type: 'group',
        label: 'Segera hadir',
        children: soon.map(([slug, f]) => ({
          key: `/segera/${slug}`,
          icon: f.icon,
          label: (
            <Flex justify="space-between" align="center">
              {f.title}
              <Tag style={{ marginInlineEnd: 0 }}>Segera</Tag>
            </Flex>
          ),
        })),
      })
    }
    return items
  }, [role, insideCount])
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.lg === false
  const [drawerOpen, setDrawerOpen] = useState(false)
  const role = user!.role
  const { data: inside } = useInsideVisits(role === 'guard')
  const items = useMenuItems(role, inside?.length)

  useEffect(() => {
    syncCurrentUser()
  }, [])

  const menu = (
    <Menu
      mode="inline"
      items={items}
      selectedKeys={[selectedKeyFor(pathname)]}
      onClick={({ key }) => {
        navigate(key)
        setDrawerOpen(false)
      }}
      style={{ borderInlineEnd: 0 }}
    />
  )

  const userMenu: MenuProps = {
    items: [
      { key: 'akun', icon: <KeyOutlined />, label: 'Akun & kata sandi' },
      { key: 'privasi', icon: <SafetyCertificateOutlined />, label: 'Pemberitahuan privasi' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Keluar', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'akun') navigate('/akun')
      else if (key === 'privasi') navigate('/privasi')
      else logout()
    },
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          paddingInline: 16,
          background: '#0f766e',
        }}
      >
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined style={{ color: '#fff', fontSize: 20 }} />}
            onClick={() => setDrawerOpen(true)}
            aria-label="Buka menu"
          />
        )}
        <Link to="/" style={{ color: '#fff', fontWeight: 600, fontSize: 18, whiteSpace: 'nowrap' }}>
          Buku Tamu Digital
        </Link>
        <div style={{ flex: 1 }} />
        <Dropdown menu={userMenu} trigger={['click']}>
          <Button type="text" style={{ color: '#fff' }}>
            <Flex gap={8} align="center">
              <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user!.name}</span>
              {!isMobile && <RoleTag role={role} />}
              <DownOutlined />
            </Flex>
          </Button>
        </Dropdown>
      </Header>
      <Layout>
        {!isMobile && (
          <Sider width={250} theme="light" style={{ borderInlineEnd: '1px solid #f0f0f0' }}>
            {menu}
          </Sider>
        )}
        {isMobile && (
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            placement="left"
            size={280}
            title={
              <Flex gap={8} align="center">
                {user!.name}
                <RoleTag role={role} />
              </Flex>
            }
            styles={{ body: { padding: 0 } }}
          >
            {menu}
          </Drawer>
        )}
        <Layout>
          <Content style={{ padding: isMobile ? 16 : 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
            {/* Guards work a touchscreen at the gate: bigger controls everywhere. */}
            <ConfigProvider componentSize={role === 'guard' ? 'large' : undefined}>
              <Suspense fallback={<Spin size="large" style={{ display: 'block', margin: '48px auto' }} />}>
                <Outlet />
              </Suspense>
            </ConfigProvider>
          </Content>
          <Footer style={{ textAlign: 'center', padding: '12px 16px' }}>
            <Typography.Text type="secondary">
              Data tamu dikelola sesuai UU PDP. <Link to="/privasi">Pemberitahuan privasi</Link>
            </Typography.Text>
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  )
}
