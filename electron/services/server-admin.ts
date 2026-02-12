import { ServerAuthService } from './server-auth'

interface AdminUser {
  id: string
  googleId: string
  email: string
  name?: string
  picture?: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  role: 'user' | 'admin'
  createdAt: string
  lastLoginAt?: string
}

interface AdminStats {
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

interface ListUsersResult {
  success: boolean
  users?: AdminUser[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

interface StatsResult {
  success: boolean
  stats?: AdminStats
  error?: string
}

interface UserActionResult {
  success: boolean
  user?: AdminUser
  error?: string
}

interface BatchApproveResult {
  success: boolean
  approved?: number
  failed?: number
  results?: Array<{ userId: string; success: boolean }>
  error?: string
}

/**
 * 服务端管理员服务
 * 处理用户管理和统计查看等管理员功能
 */
export class ServerAdminService {
  private authService: ServerAuthService

  constructor(authService: ServerAuthService) {
    this.authService = authService
  }

  /**
   * 获取用户列表
   */
  async listUsers(params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<ListUsersResult> {
    try {
      const token = this.authService.getAccessToken()
      if (!token) {
        return { success: false, error: '未登录' }
      }

      const serverUrl = this.authService.getServerUrl()
      const query = new URLSearchParams()
      if (params?.status) query.append('status', params.status)
      if (params?.page) query.append('page', params.page.toString())
      if (params?.limit) query.append('limit', params.limit.toString())

      const queryString = query.toString()
      const url = `${serverUrl}/api/admin/users${queryString ? `?${queryString}` : ''}`

      console.log('[ServerAdmin] 获取用户列表:', url)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: '认证失败，请重新登录' }
        }
        if (response.status === 403) {
          return { success: false, error: '没有管理员权限' }
        }
        return { success: false, error: `HTTP ${response.status}` }
      }

      const data = await response.json()

      if (!data.success) {
        return { success: false, error: data.error || '获取用户列表失败' }
      }

      return {
        success: true,
        users: data.data?.users || [],
        pagination: data.data?.pagination || {
          page: data.data?.page || 1,
          limit: data.data?.limit || 20,
          total: data.data?.total || 0,
          totalPages: Math.ceil((data.data?.total || 0) / (data.data?.limit || 20))
        }
      }
    } catch (error: any) {
      console.error('[ServerAdmin] 获取用户列表失败:', error)
      return { success: false, error: error.message || '网络错误' }
    }
  }

  /**
   * 获取系统统计
   */
  async getStats(): Promise<StatsResult> {
    try {
      const token = this.authService.getAccessToken()
      if (!token) {
        return { success: false, error: '未登录' }
      }

      const serverUrl = this.authService.getServerUrl()
      const url = `${serverUrl}/api/admin/stats`

      console.log('[ServerAdmin] 获取系统统计:', url)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: '认证失败，请重新登录' }
        }
        if (response.status === 403) {
          return { success: false, error: '没有管理员权限' }
        }
        return { success: false, error: `HTTP ${response.status}` }
      }

      const data = await response.json()

      if (!data.success) {
        return { success: false, error: data.error || '获取统计信息失败' }
      }

      return {
        success: true,
        stats: data.data
      }
    } catch (error: any) {
      console.error('[ServerAdmin] 获取统计信息失败:', error)
      return { success: false, error: error.message || '网络错误' }
    }
  }

  /**
   * 批准用户
   */
  async approveUser(userId: string): Promise<UserActionResult> {
    return this.userAction(userId, 'approve')
  }

  /**
   * 拒绝用户
   */
  async rejectUser(userId: string, reason?: string): Promise<UserActionResult> {
    return this.userAction(userId, 'reject', reason)
  }

  /**
   * 暂停用户
   */
  async suspendUser(userId: string, reason?: string): Promise<UserActionResult> {
    return this.userAction(userId, 'suspend', reason)
  }

  /**
   * 用户操作通用方法
   */
  private async userAction(
    userId: string,
    action: 'approve' | 'reject' | 'suspend',
    reason?: string
  ): Promise<UserActionResult> {
    try {
      const token = this.authService.getAccessToken()
      if (!token) {
        return { success: false, error: '未登录' }
      }

      const serverUrl = this.authService.getServerUrl()
      const url = `${serverUrl}/api/admin/users/${userId}/${action}`

      console.log(`[ServerAdmin] ${action} 用户:`, userId)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: reason ? JSON.stringify({ reason }) : undefined
      })

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: '认证失败，请重新登录' }
        }
        if (response.status === 403) {
          return { success: false, error: '没有管理员权限' }
        }
        return { success: false, error: `HTTP ${response.status}` }
      }

      const data = await response.json()

      if (!data.success) {
        return { success: false, error: data.error || '操作失败' }
      }

      return {
        success: true,
        user: data.data?.user
      }
    } catch (error: any) {
      console.error(`[ServerAdmin] ${action} 用户失败:`, error)
      return { success: false, error: error.message || '网络错误' }
    }
  }

  /**
   * 批量批准用户
   */
  async batchApprove(userIds: string[]): Promise<BatchApproveResult> {
    try {
      const token = this.authService.getAccessToken()
      if (!token) {
        return { success: false, error: '未登录' }
      }

      const serverUrl = this.authService.getServerUrl()
      const url = `${serverUrl}/api/admin/users/batch-approve`

      console.log('[ServerAdmin] 批量批准用户:', userIds.length)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userIds })
      })

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: '认证失败，请重新登录' }
        }
        if (response.status === 403) {
          return { success: false, error: '没有管理员权限' }
        }
        return { success: false, error: `HTTP ${response.status}` }
      }

      const data = await response.json()

      if (!data.success) {
        return { success: false, error: data.error || '批量操作失败' }
      }

      return {
        success: true,
        approved: data.data?.approved || 0,
        failed: data.data?.failed || 0,
        results: data.data?.results
      }
    } catch (error: any) {
      console.error('[ServerAdmin] 批量批准失败:', error)
      return { success: false, error: error.message || '网络错误' }
    }
  }
}
