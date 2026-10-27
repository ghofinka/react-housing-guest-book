import { Tag } from 'antd'
import type { Category, Role, VisitStatus } from '../api/types'
import { CATEGORY_COLOR, CATEGORY_LABEL, ROLE_COLOR, ROLE_LABEL, STATUS_LABEL } from '../utils/format'

export const CategoryTag = ({ category }: { category: Category }) => (
  <Tag color={CATEGORY_COLOR[category]}>{CATEGORY_LABEL[category]}</Tag>
)

export const StatusTag = ({ status }: { status: VisitStatus }) => (
  <Tag color={status === 'inside' ? 'processing' : 'default'}>{STATUS_LABEL[status]}</Tag>
)

export const RoleTag = ({ role }: { role: Role }) => <Tag color={ROLE_COLOR[role]}>{ROLE_LABEL[role]}</Tag>

export const ActiveTag = ({ active }: { active: boolean }) =>
  active ? <Tag color="success">Aktif</Tag> : <Tag>Nonaktif</Tag>
