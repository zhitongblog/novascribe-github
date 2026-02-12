import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#0ea5e9',
          colorBgContainer: '#16213e',
          colorBgElevated: '#1a1a2e',
          colorBgLayout: '#0f0f1a',
          colorText: '#e8e8e8',
          colorTextSecondary: '#a0a0a0',
          colorBorder: '#0f3460',
          borderRadius: 8,
          fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif"
        },
        components: {
          Menu: {
            darkItemBg: 'transparent',
            darkItemSelectedBg: '#0f3460',
            darkItemHoverBg: 'rgba(14, 165, 233, 0.1)'
          },
          Button: {
            primaryShadow: '0 2px 8px rgba(14, 165, 233, 0.3)'
          },
          Card: {
            colorBgContainer: '#16213e'
          },
          Input: {
            colorBgContainer: '#0f0f1a',
            colorBorder: '#0f3460'
          },
          Select: {
            colorBgContainer: '#0f0f1a'
          }
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
)
