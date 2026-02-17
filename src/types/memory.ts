/**
 * 分层记忆系统 - 解决百万字长篇"失忆"问题
 *
 * 三层架构：
 * 1. 核心记忆 (CoreMemory) - 永久不变的设定
 * 2. 世界状态 (WorldState) - 动态更新的状态
 * 3. 近期记忆 (RecentMemory) - 滚动窗口的细节
 */

// ==================== 核心记忆层 ====================
export interface CoreMemory {
  // 世界观核心规则（不可改变）
  worldRules: string
  // 力量体系/修炼体系
  powerSystem: string
  // 核心矛盾/主线冲突
  mainConflict: string
  // 重要地点设定
  keyLocations: string[]
  // 核心势力设定
  factions: string[]
}

// ==================== 世界状态层 ====================
export interface CharacterState {
  characterId: string
  name: string
  // 当前状态
  isAlive: boolean
  deathChapter?: number
  deathCause?: string
  // 当前实力/境界
  currentPower: string
  // 当前位置
  currentLocation: string
  // 当前心境
  currentMood: string
  // 最近重要事件
  recentEvents: string[]
}

export interface FactionRelation {
  factionA: string
  factionB: string
  relation: 'ally' | 'neutral' | 'hostile' | 'war'
  description: string
  changedAt?: number  // 改变的章节
}

export interface ActiveConflict {
  id: string
  description: string
  participants: string[]
  startChapter: number
  status: 'ongoing' | 'escalating' | 'resolving'
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

export interface WorldState {
  // 角色当前状态
  characterStates: CharacterState[]
  // 势力关系
  factionRelations: FactionRelation[]
  // 进行中的冲突
  activeConflicts: ActiveConflict[]
  // 未解决的伏笔
  unresolvedPlots: PlotThread[]
  // 最后更新章节
  lastUpdatedChapter: number
}

// ==================== 伏笔追踪 ====================
export interface PlotThread {
  id: string
  // 伏笔描述
  description: string
  // 埋设章节
  plantedChapter: number
  // 预期揭晓章节范围
  expectedResolutionRange: {
    min: number
    max: number
  }
  // 当前状态
  status: 'active' | 'hinted' | 'resolved' | 'abandoned'
  // 解决章节（如已解决）
  resolvedChapter?: number
  // 相关角色
  relatedCharacters: string[]
  // 中间的暗示/线索
  hints: {
    chapter: number
    content: string
  }[]
  // 重要性
  importance: 'minor' | 'major' | 'critical'
}

// ==================== 近期记忆层 ====================
export interface ChapterSummary {
  chapterIndex: number
  title: string
  // 简要摘要（50-100字）
  summary: string
  // 关键事件
  keyEvents: string[]
  // 出场角色
  charactersAppeared: string[]
  // 情绪基调
  emotionalTone: string
  // 是否有重大转折
  hasMajorTurn: boolean
}

export interface RecentEvent {
  chapter: number
  description: string
  importance: 'low' | 'medium' | 'high'
  relatedCharacters: string[]
}

export interface EmotionPoint {
  chapter: number
  // 情绪类型
  emotion: string
  // 强度 0-10
  intensity: number
  // 张力 0-10
  tension: number
  // 希望值 -10到10（负为绝望）
  hope: number
}

export interface RecentMemory {
  // 最近N章的详细摘要
  lastChapters: ChapterSummary[]
  // 近期重要事件
  recentEvents: RecentEvent[]
  // 情绪曲线
  emotionalArc: EmotionPoint[]
}

// ==================== 完整分层记忆 ====================
export interface LayeredMemory {
  core: CoreMemory
  worldState: WorldState
  recent: RecentMemory
  // 版本号
  version: number
  // 最后更新时间
  lastUpdated: string
}

// ==================== 情感弧线分析 ====================
export interface EmotionalArc {
  chapters: EmotionPoint[]
  // 整体趋势
  overallTrend: 'rising' | 'falling' | 'fluctuating' | 'stable'
  // 高潮章节
  peakChapters: number[]
  // 低谷章节
  valleyChapters: number[]
  // 建议
  suggestion?: EmotionSuggestion
}

export interface EmotionSuggestion {
  suggestion: string
  targetIntensity: number
  targetTension: number
  reason: string
}

// ==================== 一致性检查 ====================
export interface ConsistencyWarning {
  type: 'character_revival' | 'timeline_conflict' | 'power_inconsistency' | 'location_error' | 'personality_shift'
  severity: 'warning' | 'error'
  chapter: number
  description: string
  suggestion: string
}

export interface ConsistencyReport {
  isConsistent: boolean
  warnings: ConsistencyWarning[]
  checkedAt: string
}

// ==================== 辅助函数 ====================

/**
 * 创建空的分层记忆
 */
export function createEmptyLayeredMemory(): LayeredMemory {
  return {
    core: {
      worldRules: '',
      powerSystem: '',
      mainConflict: '',
      keyLocations: [],
      factions: []
    },
    worldState: {
      characterStates: [],
      factionRelations: [],
      activeConflicts: [],
      unresolvedPlots: [],
      lastUpdatedChapter: 0
    },
    recent: {
      lastChapters: [],
      recentEvents: [],
      emotionalArc: []
    },
    version: 1,
    lastUpdated: new Date().toISOString()
  }
}

/**
 * 创建空的伏笔
 */
export function createPlotThread(
  description: string,
  plantedChapter: number,
  options?: Partial<PlotThread>
): PlotThread {
  return {
    id: `plot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    description,
    plantedChapter,
    expectedResolutionRange: options?.expectedResolutionRange || {
      min: plantedChapter + 5,
      max: plantedChapter + 50
    },
    status: 'active',
    relatedCharacters: options?.relatedCharacters || [],
    hints: [],
    importance: options?.importance || 'major'
  }
}

/**
 * 计算情感弧线趋势
 */
export function calculateEmotionalTrend(arc: EmotionPoint[]): 'rising' | 'falling' | 'fluctuating' | 'stable' {
  if (arc.length < 3) return 'stable'

  const recent = arc.slice(-5)
  const intensities = recent.map(p => p.intensity)

  // 计算变化
  let rises = 0
  let falls = 0
  for (let i = 1; i < intensities.length; i++) {
    const diff = intensities[i] - intensities[i - 1]
    if (diff > 1) rises++
    else if (diff < -1) falls++
  }

  if (rises > falls + 1) return 'rising'
  if (falls > rises + 1) return 'falling'
  if (rises > 0 && falls > 0) return 'fluctuating'
  return 'stable'
}

/**
 * 生成下一章情绪建议
 */
export function suggestNextEmotion(arc: EmotionPoint[]): EmotionSuggestion | null {
  if (arc.length < 3) return null

  const recent = arc.slice(-5)

  // 检测情绪疲劳（连续高强度）
  if (recent.every(c => c.intensity > 7)) {
    return {
      suggestion: '建议降低情绪强度，给读者喘息空间',
      targetIntensity: 4,
      targetTension: 3,
      reason: '连续高强度场景，需要节奏调整'
    }
  }

  // 检测平淡过长
  if (recent.every(c => c.intensity < 4)) {
    return {
      suggestion: '建议增加冲突，提升情绪张力',
      targetIntensity: 7,
      targetTension: 6,
      reason: '连续低强度场景，需要制造爽点'
    }
  }

  // 检测持续紧张
  if (recent.every(c => c.tension > 7)) {
    return {
      suggestion: '建议适当放松张力，避免读者疲劳',
      targetIntensity: 5,
      targetTension: 3,
      reason: '持续高张力，需要舒缓'
    }
  }

  // 检测希望值持续低迷
  if (recent.every(c => c.hope < -3)) {
    return {
      suggestion: '建议加入希望元素，避免过度压抑',
      targetIntensity: 6,
      targetTension: 5,
      reason: '持续绝望氛围，需要转机'
    }
  }

  return null
}
