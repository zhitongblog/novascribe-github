// 项目/书籍
export interface Project {
  id: string
  title: string
  inspiration: string
  constraints: string
  scale: 'micro' | 'million'
  genres: string[]
  styles: string[]
  worldSetting: string
  summary: string
  createdAt: string
  updatedAt: string
  syncedAt?: string
}

// 卷
export interface Volume {
  id: string
  projectId: string
  title: string
  summary: string
  order: number
  // 新增：核心要点（3-5个关键事件/转折，用于全局一致性）
  keyPoints?: string[]  // 例如：["主角突破至金丹期", "击败血魔宗", "林雪牺牲"]
  // 新增：简要章节框架（可选，用于两阶段生成）
  briefChapters?: Array<{
    chapterNumber: number
    briefOutline: string  // 20-30字的简要大纲
  }>
  createdAt: string
  updatedAt: string
}

// 章节
export interface Chapter {
  id: string
  volumeId: string
  title: string
  outline: string
  content: string
  wordCount: number
  order: number
  createdAt: string
  updatedAt: string
}

// 角色关系
export interface CharacterRelation {
  targetName: string      // 关系对象名
  relation: string        // 关系描述，如"师徒"、"仇敌"、"恋人"
}

// 角色
export interface Character {
  id: string
  projectId: string
  name: string
  role: 'protagonist' | 'supporting' | 'antagonist'
  gender: string
  age: string
  identity: string
  description: string
  arc: string
  status: 'active' | 'pending' | 'deceased'
  deathChapter?: string           // 死亡章节（如有）
  appearances: string[]           // 出现章节列表
  relationships: CharacterRelation[]  // 人物关系
  createdAt: string
  updatedAt: string
}

// 用户信息
export interface User {
  id: string
  email: string
  name: string
  picture: string
}

// 创作体量选项
export const SCALE_OPTIONS = [
  { value: 'micro', label: '微小说', description: '8章以内，每章2500字' },
  { value: 'million', label: '百万巨著', description: '12卷+，每卷40章+，每章2500字' }
] as const

// 题材标签（分类展示）
export const GENRE_CATEGORIES = {
  '幻想类': ['玄幻', '奇幻', '仙侠', '武侠', '末世', '灵异'],
  '现代类': ['都市', '现实', '职场', '官场', '校园', '医学'],
  '情感类': ['言情', '甜宠', '虐恋', '纯爱', '情色', '耽美', '百合'],
  '悬疑类': ['悬疑', '刑侦', '惊悚', '推理', '谍战'],
  '其他类': ['历史', '军事', '科幻', '游戏', '体育', '二次元', '轻小说'],
  '流派类': ['无限流', '系统流', '种田', '宫斗', '宅斗', '穿越', '重生']
} as const

// 题材标签（扁平列表，用于选择器）
export const GENRE_OPTIONS = [
  // 幻想类
  '玄幻', '奇幻', '仙侠', '武侠', '末世', '灵异',
  // 现代类
  '都市', '现实', '职场', '官场', '校园', '医学',
  // 情感类
  '言情', '甜宠', '虐恋', '纯爱', '情色', '耽美', '百合',
  // 悬疑类
  '悬疑', '刑侦', '惊悚', '推理', '谍战',
  // 其他类
  '历史', '军事', '科幻', '游戏', '体育', '二次元', '轻小说',
  // 流派类
  '无限流', '系统流', '种田', '宫斗', '宅斗', '穿越', '重生'
] as const

// 写作风格（分类展示）
export const STYLE_CATEGORIES = {
  '情绪基调': ['热血', '轻松', '搞笑', '虐心', '治愈', '暗黑', '沉重', '温馨'],
  '节奏风格': ['爽文', '慢热', '快节奏', '日常', '紧张刺激'],
  '文笔特点': ['文艺', '细腻', '大气', '幽默', '辛辣', '华丽', '朴实'],
  '情感倾向': ['甜蜜', '禁忌', '撩人', '纯情', 'BE向', 'HE向', '开放式'],
  '题材风格': ['权谋烧脑', '硬核', '软萌', '废土风', '赛博朋克', '古风', '现代感']
} as const

// 写作风格（扁平列表，用于选择器）
export const STYLE_OPTIONS = [
  // 情绪基调
  '热血', '轻松', '搞笑', '虐心', '治愈', '暗黑', '沉重', '温馨',
  // 节奏风格
  '爽文', '慢热', '快节奏', '日常', '紧张刺激',
  // 文笔特点
  '文艺', '细腻', '大气', '幽默', '辛辣', '华丽', '朴实',
  // 情感倾向
  '甜蜜', '禁忌', '撩人', '纯情', 'BE向', 'HE向', '开放式',
  // 题材风格
  '权谋烧脑', '硬核', '软萌', '废土风', '赛博朋克', '古风', '现代感'
] as const

// 服务端用户信息
export interface ServerUser {
  id: string
  googleId?: string
  email: string
  name?: string
  picture?: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  role: 'user' | 'admin'
  createdAt: string
  lastLoginAt?: string
}

// 服务端认证令牌
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  expiresAt: number
}

// Electron API 类型 (从 preload 导出)
export interface ElectronAPI {
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
  }

  auth: {
    login: () => Promise<{ success: boolean; user?: User; error?: string }>
    logout: () => Promise<void>
    getUser: () => Promise<User | null>
    isLoggedIn: () => Promise<boolean>
  }

  drive: {
    sync: () => Promise<{ success: boolean; error?: string }>
    upload: (data: any) => Promise<{ success: boolean; fileId?: string; error?: string }>
    download: (fileId: string) => Promise<{ success: boolean; data?: any; error?: string }>
    list: () => Promise<{ success: boolean; files?: any[]; error?: string }>
    restore: () => Promise<{ success: boolean; importedCount?: number; errors?: string[]; error?: string }>
  }

  // 服务端认证
  serverAuth: {
    login: () => Promise<{ success: boolean; user?: ServerUser; tokens?: AuthTokens; error?: string }>
    logout: () => Promise<void>
    getUser: () => Promise<ServerUser | null>
    isLoggedIn: () => Promise<boolean>
    checkUserStatus: () => Promise<{ isApproved: boolean; status: string; message?: string }>
    refreshToken: () => Promise<{ success: boolean; tokens?: AuthTokens; error?: string }>
    getAccessToken: () => Promise<string | null>
    getTokens: () => Promise<AuthTokens | null>
    setServerUrl: (url: string) => Promise<void>
    getServerUrl: () => Promise<string>
    testConnection: (url?: string) => Promise<{ success: boolean; data?: any; error?: string }>
  }

  // 服务端同步
  serverSync: {
    sync: () => Promise<{ success: boolean; uploaded?: number; downloaded?: number; conflicts?: number; errors?: string[]; error?: string }>
    uploadProject: (projectId: string) => Promise<{ success: boolean; error?: string }>
    batchUpload: (projectIds: string[]) => Promise<{ success: boolean; uploaded?: number; errors?: string[]; error?: string }>
    restore: () => Promise<{ success: boolean; importedCount?: number; errors?: string[]; error?: string }>
  }

  // 服务端管理员
  serverAdmin: {
    listUsers: (params?: { status?: string; page?: number; limit?: number }) => Promise<{ success: boolean; users?: any[]; pagination?: any; error?: string }>
    getStats: () => Promise<{ success: boolean; stats?: any; error?: string }>
    approveUser: (userId: string) => Promise<{ success: boolean; user?: any; error?: string }>
    rejectUser: (userId: string, reason?: string) => Promise<{ success: boolean; user?: any; error?: string }>
    suspendUser: (userId: string, reason?: string) => Promise<{ success: boolean; user?: any; error?: string }>
    batchApprove: (userIds: string[]) => Promise<{ success: boolean; approved?: number; failed?: number; results?: any[]; error?: string }>
  }

  db: {
    getProjects: () => Promise<Project[]>
    getProject: (id: string) => Promise<Project | null>
    createProject: (project: Partial<Project>) => Promise<Project>
    updateProject: (id: string, data: Partial<Project>) => Promise<Project>
    deleteProject: (id: string) => Promise<void>
    importProject: (data: any, options?: any) => Promise<{ success: boolean; projectId?: string; error?: string }>
    exportProject: (projectId: string) => Promise<any>

    getVolumes: (projectId: string) => Promise<Volume[]>
    createVolume: (volume: Partial<Volume>) => Promise<Volume>
    updateVolume: (id: string, data: Partial<Volume>) => Promise<Volume>
    deleteVolume: (id: string) => Promise<void>
    trySetGeneratingLock: (volumeId: string) => Promise<{ success: boolean; lockedAt?: number; lockedMinutesAgo?: number }>
    clearGeneratingLock: (volumeId: string) => Promise<void>
    checkGeneratingLock: (volumeId: string) => Promise<{ isLocked: boolean; lockedAt?: number; lockedMinutesAgo?: number }>

    getChapters: (volumeId: string) => Promise<Chapter[]>
    getChapter: (id: string) => Promise<Chapter | null>
    createChapter: (chapter: Partial<Chapter>) => Promise<Chapter>
    updateChapter: (id: string, data: Partial<Chapter>) => Promise<Chapter>
    deleteChapter: (id: string) => Promise<void>

    getCharacters: (projectId: string) => Promise<Character[]>
    getCharacter: (id: string) => Promise<Character | null>
    createCharacter: (character: Partial<Character>) => Promise<Character>
    updateCharacter: (id: string, data: Partial<Character>) => Promise<Character>
    deleteCharacter: (id: string) => Promise<void>
  }

  settings: {
    get: (key: string) => Promise<any>
    set: (key: string, value: any) => Promise<void>
    getAll: () => Promise<Record<string, any>>
  }

  system: {
    getAppVersion: () => Promise<string>
    openExternal: (url: string) => void
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
