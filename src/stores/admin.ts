import { create } from 'zustand'

interface AdminUser {
  id: string
  email: string
  name?: string
  picture?: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  role: 'user' | 'admin'
  createdAt: string
  lastLoginAt?: string
  approvedAt?: string
}

interface SystemStats {
  users: {
    total: number
    pending: number
    approved: number
    rejected: number
    suspended: number
    admins: number
  }
  storage: {
    userCount: number
    projectCount: number
    totalSize: number
    avgSize: number
  }
  sync: {
    total: number
    success: number
    failed: number
    conflicts: number
    uploads: number
    downloads: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface AdminState {
  // 用户列表
  users: AdminUser[]
  pagination: Pagination
  statusFilter: string | undefined
  selectedUserIds: string[]

  // 系统统计
  stats: SystemStats | null

  // 加载状态
  isLoading: boolean
  isStatsLoading: boolean
  error: string | null

  // Actions
  loadUsers: (params?: { status?: string; page?: number; limit?: number }) => Promise<void>
  loadStats: () => Promise<void>
  approveUser: (userId: string) => Promise<boolean>
  rejectUser: (userId: string, reason?: string) => Promise<boolean>
  suspendUser: (userId: string, reason?: string) => Promise<boolean>
  batchApprove: (userIds: string[]) => Promise<{ approved: number; failed: number }>
  setStatusFilter: (status: string | undefined) => void
  setSelectedUserIds: (ids: string[]) => void
  clearError: () => void
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  statusFilter: undefined,
  selectedUserIds: [],
  stats: null,
  isLoading: false,
  isStatsLoading: false,
  error: null,

  loadUsers: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const result = await window.electron.serverAdmin.listUsers({
        status: params?.status ?? get().statusFilter,
        page: params?.page ?? get().pagination.page,
        limit: params?.limit ?? get().pagination.limit
      })

      if (result.success && result.users) {
        set({
          users: result.users,
          pagination: result.pagination || {
            page: 1,
            limit: 20,
            total: result.users.length,
            totalPages: 1
          },
          isLoading: false
        })
      } else {
        set({ error: result.error || '获取用户列表失败', isLoading: false })
      }
    } catch (error: any) {
      console.error('[AdminStore] 加载用户列表失败:', error)
      set({ error: error.message || '网络错误', isLoading: false })
    }
  },

  loadStats: async () => {
    set({ isStatsLoading: true })
    try {
      const result = await window.electron.serverAdmin.getStats()

      if (result.success && result.stats) {
        const data = result.stats
        set({
          stats: {
            users: {
              total: data.users?.total || 0,
              pending: data.users?.pending || 0,
              approved: data.users?.approved || 0,
              rejected: data.users?.rejected || 0,
              suspended: data.users?.suspended || 0,
              admins: data.users?.admins || 0
            },
            storage: {
              userCount: data.storage?.userCount || 0,
              projectCount: data.storage?.projectCount || 0,
              totalSize: data.storage?.totalSize || 0,
              avgSize: data.storage?.avgSize || 0
            },
            sync: {
              total: data.sync?.total || 0,
              success: data.sync?.success || data.sync?.successCount || 0,
              failed: data.sync?.failed || data.sync?.failedCount || 0,
              conflicts: data.sync?.conflicts || data.sync?.conflictCount || 0,
              uploads: data.sync?.uploads || data.sync?.uploadCount || 0,
              downloads: data.sync?.downloads || data.sync?.downloadCount || 0
            }
          },
          isStatsLoading: false
        })
      } else {
        set({ error: result.error || '获取统计信息失败', isStatsLoading: false })
      }
    } catch (error: any) {
      console.error('[AdminStore] 加载统计信息失败:', error)
      set({ error: error.message || '网络错误', isStatsLoading: false })
    }
  },

  approveUser: async (userId) => {
    try {
      const result = await window.electron.serverAdmin.approveUser(userId)
      if (result.success) {
        await get().loadUsers()
        return true
      }
      set({ error: result.error || '操作失败' })
      return false
    } catch (error: any) {
      console.error('[AdminStore] 批准用户失败:', error)
      set({ error: error.message })
      return false
    }
  },

  rejectUser: async (userId, reason) => {
    try {
      const result = await window.electron.serverAdmin.rejectUser(userId, reason)
      if (result.success) {
        await get().loadUsers()
        return true
      }
      set({ error: result.error || '操作失败' })
      return false
    } catch (error: any) {
      console.error('[AdminStore] 拒绝用户失败:', error)
      set({ error: error.message })
      return false
    }
  },

  suspendUser: async (userId, reason) => {
    try {
      const result = await window.electron.serverAdmin.suspendUser(userId, reason)
      if (result.success) {
        await get().loadUsers()
        return true
      }
      set({ error: result.error || '操作失败' })
      return false
    } catch (error: any) {
      console.error('[AdminStore] 暂停用户失败:', error)
      set({ error: error.message })
      return false
    }
  },

  batchApprove: async (userIds) => {
    try {
      const result = await window.electron.serverAdmin.batchApprove(userIds)
      if (result.success) {
        await get().loadUsers()
        return {
          approved: result.approved || 0,
          failed: result.failed || 0
        }
      }
      return { approved: 0, failed: userIds.length }
    } catch (error: any) {
      console.error('[AdminStore] 批量批准失败:', error)
      return { approved: 0, failed: userIds.length }
    }
  },

  setStatusFilter: (status) => set({ statusFilter: status }),
  setSelectedUserIds: (ids) => set({ selectedUserIds: ids }),
  clearError: () => set({ error: null })
}))
