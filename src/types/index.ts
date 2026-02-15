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

// 写作风格（简化版 - 核心风格维度）
export const STYLE_DIMENSIONS = {
  '基调': ['热血爽快', '轻松幽默', '沉稳厚重', '温馨治愈', '暗黑虐心'],
  '节奏': ['快节奏爽文', '稳健推进', '慢热细腻'],
  '结局': ['HE（圆满结局）', 'BE（悲剧结局）', '开放式结局']
} as const

// 题材对应的著名作者（用于风格参考）
export const GENRE_AUTHORS: Record<string, { name: string; style: string; works: string }[]> = {
  '玄幻': [
    { name: '天蚕土豆', style: '热血爽快、升级流畅、节奏明快', works: '《斗破苍穹》《武动乾坤》' },
    { name: '辰东', style: '大气磅礴、想象瑰丽、悬念迭起', works: '《遮天》《完美世界》' },
    { name: '我吃西红柿', style: '体系完整、世界观宏大、战斗描写出色', works: '《盘龙》《星辰变》' },
    { name: '唐家三少', style: '文风简洁、更新稳定、感情线细腻', works: '《斗罗大陆》《神印王座》' }
  ],
  '仙侠': [
    { name: '耳根', style: '文笔优美、意境深远、情感细腻', works: '《仙逆》《我欲封天》' },
    { name: '忘语', style: '设定严谨、逻辑缜密、剧情扎实', works: '《凡人修仙传》' },
    { name: '净无痕', style: '节奏紧凑、升级合理、打脸爽快', works: '《绝世武神》《太古神王》' }
  ],
  '都市': [
    { name: '辰东', style: '脑洞大开、都市异能、剧情紧凑', works: '《神墓》' },
    { name: '鱼人二代', style: '轻松搞笑、后宫日常、节奏轻快', works: '《很纯很暧昧》' },
    { name: '柳下挥', style: '文笔流畅、情感真实、角色鲜明', works: '《天才医生》' }
  ],
  '言情': [
    { name: '顾漫', style: '甜蜜温馨、文笔细腻、人设讨喜', works: '《何以笙箫默》《微微一笑很倾城》' },
    { name: '桐华', style: '虐心深情、剧情曲折、文笔优美', works: '《步步惊心》《长相思》' },
    { name: '墨宝非宝', style: '甜宠日常、温情治愈、节奏轻快', works: '《一生一世美人骨》' },
    { name: '唐七公子', style: '古风唯美、感情细腻、意境优美', works: '《三生三世十里桃花》' }
  ],
  '悬疑': [
    { name: '紫金陈', style: '逻辑严密、反转精彩、人性深刻', works: '《无证之罪》《隐秘的角落》' },
    { name: '蜘蛛', style: '恐怖惊悚、气氛渲染、节奏紧张', works: '《十宗罪》' },
    { name: '周浩晖', style: '悬念迭起、推理缜密、结局震撼', works: '《死亡通知单》' }
  ],
  '科幻': [
    { name: '刘慈欣', style: '硬核科幻、想象宏大、哲思深刻', works: '《三体》《流浪地球》' },
    { name: '王晋康', style: '思想深邃、人文关怀、科学严谨', works: '《生命之歌》' },
    { name: '天瑞说符', style: '脑洞大开、逻辑自洽、节奏明快', works: '《死在火星上》' }
  ],
  '历史': [
    { name: '月关', style: '历史考据、权谋烧脑、文笔老练', works: '《回到明朝当王爷》' },
    { name: '孑与2', style: '历史厚重、人物鲜活、格局宏大', works: '《唐砖》《银狐》' },
    { name: '贼道三痴', style: '文风典雅、历史还原、细节考究', works: '《上品寒士》' }
  ],
  '奇幻': [
    { name: '烟雨江南', style: '文笔华丽、设定精巧、剧情紧凑', works: '《亵渎》《尘缘》' },
    { name: '猫腻', style: '文艺深沉、人物饱满、细节出色', works: '《庆余年》《将夜》' },
    { name: '烽火戏诸侯', style: '文笔优美、意境深远、节奏沉稳', works: '《雪中悍刀行》' }
  ],
  '武侠': [
    { name: '金庸', style: '文笔典雅、人物立体、家国情怀', works: '《射雕英雄传》《天龙八部》' },
    { name: '古龙', style: '意境独特、对白精炼、悬疑推理', works: '《多情剑客无情剑》《楚留香》' },
    { name: '凤歌', style: '传统武侠、文笔流畅、江湖气息', works: '《昆仑》《沧海》' }
  ],
  '末世': [
    { name: '绯炎', style: '生存紧张、人性刻画、节奏紧凑', works: '《末世之黑暗召唤师》' },
    { name: '黑天魔神', style: '热血爽快、升级明确、战斗精彩', works: '《末世超级商人》' }
  ],
  '游戏': [
    { name: '蝴蝶蓝', style: '热血竞技、团队协作、节奏明快', works: '《全职高手》' },
    { name: '失落叶', style: '游戏设定、升级系统、轻松幽默', works: '《网游之近战法师》' }
  ]
}

// 获取题材对应的推荐作者
export function getAuthorsForGenres(genres: string[]): { name: string; style: string; works: string }[] {
  const authors: { name: string; style: string; works: string }[] = []
  const seen = new Set<string>()

  for (const genre of genres) {
    const genreAuthors = GENRE_AUTHORS[genre] || []
    for (const author of genreAuthors) {
      if (!seen.has(author.name)) {
        seen.add(author.name)
        authors.push(author)
      }
    }
  }

  return authors.slice(0, 8) // 最多返回8位作者
}

// 旧版写作风格（保留兼容性）
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
