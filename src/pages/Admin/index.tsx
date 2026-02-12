import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Alert, Spin, message } from 'antd'
import { useAdminStore } from '../../stores/admin'
import StatsCards from './components/StatsCards'
import UserTable from './components/UserTable'

function Admin() {
  const navigate = useNavigate()
  const { loadUsers, loadStats, error, clearError } = useAdminStore()
  const [isInitializing, setIsInitializing] = useState(true)

  // 检查管理员权限并初始化
  useEffect(() => {
    const checkAdminAndLoad = async () => {
      try {
        // 检查服务端登录状态
        const isLoggedIn = await window.electron.serverAuth.isLoggedIn()
        if (!isLoggedIn) {
          message.warning('请先登录服务端')
          navigate('/settings')
          return
        }

        // 获取用户信息检查是否为管理员
        const user = await window.electron.serverAuth.getUser()
        if (!user || user.role !== 'admin') {
          message.error('您没有管理员权限')
          navigate('/projects')
          return
        }

        setIsInitializing(false)

        // 加载数据
        loadUsers()
        loadStats()
      } catch (error) {
        console.error('Admin check failed:', error)
        message.error('初始化失败')
        navigate('/settings')
      }
    }

    checkAdminAndLoad()
  }, [loadUsers, loadStats, navigate])

  if (isInitializing) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" tip="正在验证权限..." />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">管理后台</h1>
        <p className="text-gray-400">管理用户和查看系统统计</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="mb-4"
        />
      )}

      {/* 统计仪表盘 */}
      <StatsCards />

      {/* 用户管理 */}
      <Card
        title={<span className="text-white">用户管理</span>}
        className="mb-6"
        style={{ background: '#16213e', border: '1px solid #0f3460' }}
        headStyle={{ background: '#16213e', borderBottom: '1px solid #0f3460' }}
      >
        <UserTable />
      </Card>
    </div>
  )
}

export default Admin
