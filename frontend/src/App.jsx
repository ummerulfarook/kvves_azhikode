import { ConfigProvider, theme } from 'antd'
import { Provider, useSelector } from 'react-redux'
import { store } from './app/store'
import AppRouter from './router/AppRouter'
import { selectTheme } from './app/slices/authSlice'
import './styles/global.css'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useEffect } from 'react'

dayjs.extend(relativeTime)

// Premium light theme tokens
const lightTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1e40af', // Blue-800: Professional blue
    colorSuccess: '#16a34a',
    colorWarning: '#ea580c',
    colorError: '#dc2626',
    colorInfo: '#2563eb',
    colorBgBase: '#f1f5f9', // slate-100 base
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBorder: '#cbd5e1', // slate-300 borders
    colorText: '#0f172a', // slate-900
    colorTextSecondary: '#475569', // slate-600
    colorTextTertiary: '#94a3b8', // slate-400
    fontFamily: "'Inter', 'Noto Sans Malayalam', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    borderRadius: 8,
    controlHeight: 36,
    lineWidth: 1,
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
      bodyBg: '#f1f5f9',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: 'rgba(30, 64, 175, 0.1)',
      itemSelectedColor: '#1e40af',
      itemHoverBg: '#f8fafc',
    },
    Table: {
      headerBg: '#f8fafc',
      rowHoverBg: '#f1f5f9',
      borderColor: '#cbd5e1',
    },
    Card: {
      colorBgContainer: '#ffffff',
    },
    Modal: {
      contentBg: '#ffffff',
      headerBg: '#ffffff',
    },
    Select: {
      optionSelectedBg: 'rgba(30, 64, 175, 0.1)',
    },
    Tabs: {
      inkBarColor: '#1e40af',
      itemActiveColor: '#1e40af',
      itemSelectedColor: '#1e40af',
    },
    Button: {
      colorPrimary: '#1e40af',
      colorPrimaryHover: '#2563eb',
    },
  },
}

// Premium dark theme tokens
const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#3b82f6', // Bright blue for dark theme readability
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    colorBgBase: '#0f1117',
    colorBgContainer: '#1e2133',
    colorBgElevated: '#1a1d27',
    colorBorder: '#2d3148',
    colorText: '#e8eaf0',
    colorTextSecondary: '#9ba3bc',
    colorTextTertiary: '#6b7280',
    fontFamily: "'Inter', 'Noto Sans Malayalam', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    borderRadius: 8,
    controlHeight: 36,
    lineWidth: 1,
  },
  components: {
    Layout: {
      siderBg: '#1a1d27',
      headerBg: '#1a1d27',
      bodyBg: '#0f1117',
    },
    Menu: {
      darkItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(59, 130, 246, 0.15)',
      darkItemSelectedColor: '#3b82f6',
      darkItemHoverBg: '#252840',
    },
    Table: {
      headerBg: '#1a1d27',
      rowHoverBg: '#252840',
      borderColor: '#2d3148',
    },
    Card: {
      colorBgContainer: '#1e2133',
    },
    Modal: {
      contentBg: '#1e2133',
      headerBg: '#1e2133',
    },
    Select: {
      optionSelectedBg: 'rgba(59, 130, 246, 0.15)',
    },
    Tabs: {
      inkBarColor: '#3b82f6',
      itemActiveColor: '#3b82f6',
      itemSelectedColor: '#3b82f6',
    },
    Button: {
      colorPrimary: '#1d4ed8',
      colorPrimaryHover: '#3b82f6',
    },
  },
}

function AppContent() {
  const currentTheme = useSelector(selectTheme)

  useEffect(() => {
    // Synchronize HTML element classes for custom global styles
    if (currentTheme === 'light') {
      document.documentElement.classList.remove('dark-theme')
      document.documentElement.classList.add('light-theme')
    } else {
      document.documentElement.classList.remove('light-theme')
      document.documentElement.classList.add('dark-theme')
    }
  }, [currentTheme])

  return (
    <ConfigProvider theme={currentTheme === 'light' ? lightTheme : darkTheme}>
      <AppRouter />
    </ConfigProvider>
  )
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App
