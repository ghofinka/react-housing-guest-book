import {
  AlertOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  ClockCircleOutlined,
  ExportOutlined,
  FileProtectOutlined,
  FormOutlined,
  HistoryOutlined,
  HomeOutlined,
  LoginOutlined,
  QrcodeOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { Role } from '../api/types'

export interface NavItem {
  path: string
  label: string
  icon: ReactNode
  roles: Role[]
}

export const MAIN_NAV: NavItem[] = [
  { path: '/check-in', label: 'Catat Tamu Masuk', icon: <LoginOutlined />, roles: ['guard'] },
  { path: '/di-dalam', label: 'Tamu di Dalam', icon: <TeamOutlined />, roles: ['guard'] },
  { path: '/riwayat', label: 'Riwayat Tamu', icon: <HistoryOutlined />, roles: ['guard', 'admin'] },
  { path: '/riwayat', label: 'Tamu Rumah Saya', icon: <HistoryOutlined />, roles: ['owner'] },
]

export const ADMIN_NAV: NavItem[] = [
  { path: '/admin/rumah', label: 'Rumah', icon: <HomeOutlined />, roles: ['admin'] },
  { path: '/admin/pengguna', label: 'Pengguna', icon: <UserOutlined />, roles: ['admin'] },
  { path: '/admin/retensi', label: 'Retensi Data', icon: <ClockCircleOutlined />, roles: ['admin'] },
  { path: '/admin/audit', label: 'Audit Log', icon: <AuditOutlined />, roles: ['admin'] },
  { path: '/admin/privasi', label: 'Pemberitahuan Privasi', icon: <FileProtectOutlined />, roles: ['admin'] },
]

export interface ComingSoonFeature {
  title: string
  prd: string
  description: string
  icon: ReactNode
  roles: Role[]
}

/** PRD SHOULD/COULD features with no backend yet; shown as "Segera" in the menu. */
export const COMING_SOON: Record<string, ComingSoonFeature> = {
  'cari-tamu': {
    title: 'Cari Tamu',
    prd: 'S6',
    description: 'Cari tamu berdasarkan plat, nama, rumah, tanggal, dan status.',
    icon: <SearchOutlined />,
    roles: ['guard'],
  },
  'catatan-shift': {
    title: 'Catatan Shift',
    prd: 'C5',
    description: 'Catatan serah terima antar-shift satpam.',
    icon: <FormOutlined />,
    roles: ['guard'],
  },
  'pra-registrasi': {
    title: 'Daftarkan Tamu',
    prd: 'S2',
    description: 'Daftarkan tamu yang akan datang dan dapatkan kode/QR untuk ditunjukkan ke satpam.',
    icon: <QrcodeOutlined />,
    roles: ['owner'],
  },
  notifikasi: {
    title: 'Notifikasi Tamu',
    prd: 'S3, S4',
    description: 'Terima pemberitahuan saat tamu datang, lalu konfirmasi atau tolak kunjungan.',
    icon: <BellOutlined />,
    roles: ['owner'],
  },
  ekspor: {
    title: 'Ekspor Laporan',
    prd: 'S8',
    description: 'Ekspor data kunjungan ke CSV/PDF per periode untuk rapat RT atau kebutuhan keamanan.',
    icon: <ExportOutlined />,
    roles: ['admin'],
  },
  statistik: {
    title: 'Statistik',
    prd: 'C4',
    description: 'Jumlah tamu per hari dan jam, rumah dengan kunjungan terbanyak, dan jam sibuk.',
    icon: <BarChartOutlined />,
    roles: ['admin'],
  },
  watchlist: {
    title: 'Daftar Pantauan',
    prd: 'C1',
    description: 'Plat atau nama yang perlu perhatian khusus, dikelola admin.',
    icon: <AlertOutlined />,
    roles: ['admin'],
  },
}

export const homePath = (role: Role) => (role === 'guard' ? '/check-in' : '/riwayat')
