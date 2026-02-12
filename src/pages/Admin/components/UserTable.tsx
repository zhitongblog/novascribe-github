import { useState } from 'react'
import { Table, Tag, Button, Space, Modal, Input, Select, Avatar, message } from 'antd'
import {
  CheckOutlined,
  CloseOutlined,
  StopOutlined,
  UserOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useAdminStore } from '../../../stores/admin'
import type { ColumnsType } from 'antd/es/table'

interface AdminUser {
  id: string
  email: string
  name?: string
  picture?: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  role: 'user' | 'admin'
  createdAt: string
  lastLoginAt?: string
}

function UserTable() {
  const {
    users,
    pagination,
    statusFilter,
    selectedUserIds,
    isLoading,
    loadUsers,
    approveUser,
    rejectUser,
    suspendUser,
    batchApprove,
    setStatusFilter,
    setSelectedUserIds
  } = useAdminStore()

  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [suspendModalVisible, setSuspendModalVisible] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [reason, setReason] = useState('')

  // 状态颜色映射
  const statusConfig: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待审批' },
    approved: { color: 'green', text: '已批准' },
    rejected: { color: 'red', text: '已拒绝' },
    suspended: { color: 'default', text: '已暂停' }
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 处理批准
  const handleApprove = async (userId: string) => {
    const success = await approveUser(userId)
    if (success) {
      message.success('用户已批准')
    }
  }

  // 处理拒绝
  const handleReject = async () => {
    const success = await rejectUser(currentUserId, reason)
    if (success) {
      message.success('用户已拒绝')
    }
    setRejectModalVisible(false)
    setReason('')
  }

  // 处理暂停
  const handleSuspend = async () => {
    const success = await suspendUser(currentUserId, reason)
    if (success) {
      message.success('用户已暂停')
    }
    setSuspendModalVisible(false)
    setReason('')
  }

  // 批量批准
  const handleBatchApprove = async () => {
    if (selectedUserIds.length === 0) {
      message.warning('请先选择用户')
      return
    }

    Modal.confirm({
      title: '确认批量批准',
      icon: <ExclamationCircleOutlined />,
      content: `确定要批准选中的 ${selectedUserIds.length} 个用户吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const result = await batchApprove(selectedUserIds)
        message.success(`成功批准 ${result.approved} 个用户，失败 ${result.failed} 个`)
        setSelectedUserIds([])
      }
    })
  }

  // 表格列定义
  const columns: ColumnsType<AdminUser> = [
    {
      title: '用户',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar src={record.picture} icon={<UserOutlined />} />
          <div>
            <div className="text-white">{record.name || '未设置昵称'}</div>
            <div className="text-gray-400 text-xs">{record.email}</div>
          </div>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusConfig[status]?.color}>
          {statusConfig[status]?.text}
        </Tag>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'purple' : 'blue'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => <span className="text-gray-300">{formatDate(date)}</span>
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 160,
      render: (date: string) => <span className="text-gray-300">{formatDate(date)}</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => {
        if (record.role === 'admin') {
          return <span className="text-gray-500">-</span>
        }

        return (
          <Space size="small">
            {record.status === 'pending' && (
              <>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(record.id)}
                >
                  批准
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setCurrentUserId(record.id)
                    setRejectModalVisible(true)
                  }}
                >
                  拒绝
                </Button>
              </>
            )}
            {record.status === 'approved' && (
              <Button
                size="small"
                icon={<StopOutlined />}
                onClick={() => {
                  setCurrentUserId(record.id)
                  setSuspendModalVisible(true)
                }}
              >
                暂停
              </Button>
            )}
            {(record.status === 'suspended' || record.status === 'rejected') && (
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                恢复
              </Button>
            )}
          </Space>
        )
      }
    }
  ]

  // 行选择配置
  const rowSelection = {
    selectedRowKeys: selectedUserIds,
    onChange: (keys: React.Key[]) => setSelectedUserIds(keys as string[]),
    getCheckboxProps: (record: AdminUser) => ({
      disabled: record.role === 'admin'
    })
  }

  return (
    <>
      {/* 筛选和操作栏 */}
      <div className="flex justify-between items-center mb-4">
        <Space>
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value)
              loadUsers({ status: value, page: 1 })
            }}
            options={[
              { value: 'pending', label: '待审批' },
              { value: 'approved', label: '已批准' },
              { value: 'rejected', label: '已拒绝' },
              { value: 'suspended', label: '已暂停' }
            ]}
          />
        </Space>
        <Space>
          {selectedUserIds.length > 0 && (
            <Button type="primary" onClick={handleBatchApprove}>
              批量批准 ({selectedUserIds.length})
            </Button>
          )}
        </Space>
      </div>

      {/* 用户表格 */}
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            loadUsers({ page, limit: pageSize })
          }
        }}
        style={{ background: 'transparent' }}
      />

      {/* 拒绝原因弹窗 */}
      <Modal
        title="拒绝用户"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false)
          setReason('')
        }}
        okText="确认拒绝"
        cancelText="取消"
      >
        <Input.TextArea
          placeholder="请输入拒绝原因（可选）"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
        />
      </Modal>

      {/* 暂停原因弹窗 */}
      <Modal
        title="暂停用户"
        open={suspendModalVisible}
        onOk={handleSuspend}
        onCancel={() => {
          setSuspendModalVisible(false)
          setReason('')
        }}
        okText="确认暂停"
        cancelText="取消"
      >
        <Input.TextArea
          placeholder="请输入暂停原因（可选）"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
        />
      </Modal>
    </>
  )
}

export default UserTable
