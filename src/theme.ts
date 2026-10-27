import type { ThemeConfig } from 'antd'

// PRD §8 usability: large touch targets and readable text for the gate tablet.
export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#0f766e',
    colorLink: '#0f766e',
    borderRadius: 8,
    fontSize: 15,
    controlHeightLG: 48,
    fontSizeLG: 17,
  },
  components: {
    Layout: { headerHeight: 56, bodyBg: '#f5f7f7' },
  },
}
