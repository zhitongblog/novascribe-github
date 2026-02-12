import { Card, Row, Col, Statistic, Spin } from 'antd'
import {
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  CrownOutlined
} from '@ant-design/icons'
import { useAdminStore } from '../../../stores/admin'

function StatsCards() {
  const { stats, isStatsLoading } = useAdminStore()

  if (isStatsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spin size="large" />
      </div>
    )
  }

  if (!stats) return null

  const cardStyle = { background: '#16213e', border: '1px solid #0f3460' }

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <div className="mb-6">
      {/* 用户统计 */}
      <h3 className="text-white text-lg mb-4 font-medium">用户统计</h3>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={8} md={4}>
          <Card style={cardStyle} bodyStyle={{ padding: '20px' }}>
            <Statistic
              title={<span className="text-gray-400">总用户</span>}
              value={stats.users.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card style={cardStyle} bodyStyle={{ padding: '20px' }}>
            <Statistic
              title={<span className="text-gray-400">待审批</span>}
              value={stats.users.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card style={cardStyle} bodyStyle={{ padding: '20px' }}>
            <Statistic
              title={<span className="text-gray-400">已批准</span>}
              value={stats.users.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card style={cardStyle} bodyStyle={{ padding: '20px' }}>
            <Statistic
              title={<span className="text-gray-400">已拒绝</span>}
              value={stats.users.rejected}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card style={cardStyle} bodyStyle={{ padding: '20px' }}>
            <Statistic
              title={<span className="text-gray-400">已暂停</span>}
              value={stats.users.suspended}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card style={cardStyle} bodyStyle={{ padding: '20px' }}>
            <Statistic
              title={<span className="text-gray-400">管理员</span>}
              value={stats.users.admins}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 存储和同步统计 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={<span className="text-white">存储统计</span>}
            style={cardStyle}
            headStyle={{ background: '#16213e', borderBottom: '1px solid #0f3460' }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title={<span className="text-gray-400">项目数</span>}
                  value={stats.storage.projectCount}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span className="text-gray-400">总存储</span>}
                  value={formatSize(stats.storage.totalSize)}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span className="text-gray-400">平均大小</span>}
                  value={formatSize(stats.storage.avgSize)}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={<span className="text-white">同步统计</span>}
            style={cardStyle}
            headStyle={{ background: '#16213e', borderBottom: '1px solid #0f3460' }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title={<span className="text-gray-400">总同步</span>}
                  value={stats.sync.total}
                  prefix={<CloudUploadOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span className="text-gray-400">成功</span>}
                  value={stats.sync.success}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span className="text-gray-400">失败</span>}
                  value={stats.sync.failed}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span className="text-gray-400">冲突</span>}
                  value={stats.sync.conflicts}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default StatsCards
