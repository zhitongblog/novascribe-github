import { generateText } from './gemini'
import type { Volume, Character, CharacterRelation } from '../types'

// 压缩函数使用的最小角色类型
interface MinimalCharacter {
  name: string
  identity: string
  status: string
  relationships?: CharacterRelation[]
}

/**
 * 大纲优化器 - 用于提升百万巨著的全书一致性和节约token
 *
 * 核心功能：
 * 1. 智能压缩上下文（从2600字压缩到600字）
 * 2. 提取卷核心要点（自动分析每卷的3-5个关键事件）
 * 3. 构建全书索引（快速查找相关内容）
 * 4. 一致性验证（检测逻辑冲突）
 */

// ==================== 1. 智能压缩上下文 ====================

/**
 * 压缩世界观设定（从800字压缩到200字核心规则）
 */
export function compressWorldSetting(fullWorldSetting: string): string {
  if (!fullWorldSetting || fullWorldSetting.length < 200) {
    return fullWorldSetting
  }

  // 提取核心规则：力量体系、等级、特殊规则
  const lines = fullWorldSetting.split('\n').filter(line => line.trim())
  const coreLines: string[] = []

  // 关键词匹配
  const keywords = ['等级', '境界', '修炼', '力量', '体系', '规则', '世界', '时代', '背景']

  for (const line of lines) {
    if (keywords.some(kw => line.includes(kw))) {
      coreLines.push(line.trim())
      if (coreLines.join('').length > 200) break
    }
  }

  if (coreLines.length === 0) {
    // 如果没有匹配到，直接截取前200字
    return fullWorldSetting.slice(0, 200) + '...'
  }

  return coreLines.join('；').slice(0, 250)
}

/**
 * 压缩角色档案（只保留活跃角色和关键关系）
 */
export function compressCharacters(
  characters: MinimalCharacter[],
  maxCount: number = 3
): string {
  const activeCharacters = characters
    .filter(c => c.status === 'active')
    .slice(0, maxCount)

  if (activeCharacters.length === 0) {
    return characters.slice(0, 2).map(c => `${c.name}(${c.identity})`).join('、')
  }

  return activeCharacters
    .map(c => {
      let info = `${c.name}(${c.identity})`
      if (c.relationships && c.relationships.length > 0) {
        const mainRel = c.relationships[0]
        info += `-${mainRel.targetName}:${mainRel.relation}`
      }
      return info
    })
    .join('、')
}

/**
 * 构建全书卷索引（用于生成章节时快速了解全书布局）
 */
export function buildVolumeIndex(volumes: Volume[]): string {
  if (volumes.length === 0) return ''

  // 每卷只保留：卷号、标题、核心要点（如果有）
  const index = volumes.map((vol, idx) => {
    let line = `第${idx + 1}卷《${vol.title}》`
    if (vol.keyPoints && vol.keyPoints.length > 0) {
      line += `: ${vol.keyPoints.join('、')}`
    } else if (vol.summary) {
      // 如果没有核心要点，使用摘要的前50字
      line += `: ${vol.summary.slice(0, 50)}`
    }
    return line
  })

  return index.join('\n')
}

// ==================== 2. 自动提取卷核心要点 ====================

/**
 * 从卷摘要中提取3-5个核心要点（使用AI）
 */
export async function extractVolumeKeyPoints(
  volumeTitle: string,
  volumeSummary: string,
  volumeIndex: number
): Promise<string[]> {
  if (!volumeSummary || volumeSummary.length < 50) {
    return []
  }

  const prompt = `分析以下卷的摘要，提取3-5个最核心的关键事件或转折点。

第${volumeIndex + 1}卷：${volumeTitle}
摘要：${volumeSummary}

要求：
1. 只提取最关键的事件（主角的重大成长、核心冲突、关键转折）
2. 每个要点10-15字
3. 按重要性排序
4. 用于后续卷生成时参考，避免重复或冲突

返回JSON格式：{"keyPoints": ["要点1", "要点2", "要点3"]}

只返回JSON，不要其他解释。`

  try {
    const response = await generateText(prompt)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      return data.keyPoints || []
    }
  } catch (error) {
    console.error('[OutlineOptimizer] 提取核心要点失败:', error)
  }

  // 失败时，简单提取前3个句子
  const sentences = volumeSummary.split(/[。！？；]/).filter(s => s.trim())
  return sentences.slice(0, 3).map(s => s.trim().slice(0, 20))
}

/**
 * 批量为所有卷提取核心要点
 */
export async function extractAllVolumeKeyPoints(
  volumes: Volume[],
  onProgress?: (current: number, total: number) => void
): Promise<Volume[]> {
  const updatedVolumes: Volume[] = []

  for (let i = 0; i < volumes.length; i++) {
    const vol = volumes[i]
    onProgress?.(i + 1, volumes.length)

    if (vol.keyPoints && vol.keyPoints.length > 0) {
      // 已有核心要点，跳过
      updatedVolumes.push(vol)
      continue
    }

    const keyPoints = await extractVolumeKeyPoints(vol.title, vol.summary, i)
    updatedVolumes.push({
      ...vol,
      keyPoints
    })

    // 避免API限流
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return updatedVolumes
}

// ==================== 3. 构建压缩后的上下文 ====================

/**
 * 构建压缩后的章节生成上下文（从4000 tokens压缩到约1500 tokens）
 */
export function buildCompressedContext(params: {
  worldSetting: string
  characters: MinimalCharacter[]
  allVolumes: Volume[]
  currentVolumeIndex: number
}): {
  compressedWorldSetting: string
  compressedCharacters: string
  volumeIndex: string
  previousVolumeKeyPoints: string
  nextVolumeKeyPoints: string
} {
  const { worldSetting, characters, allVolumes, currentVolumeIndex } = params

  // 1. 压缩世界观（800字 → 200字）
  const compressedWorldSetting = compressWorldSetting(worldSetting)

  // 2. 压缩角色档案（1000字 → 200字）
  const compressedCharacters = compressCharacters(characters, 3)

  // 3. 构建全书卷索引（12卷×50字 = 600字 → 400字）
  const volumeIndex = buildVolumeIndex(allVolumes)

  // 4. 上一卷的核心要点（替代完整章节列表）
  let previousVolumeKeyPoints = ''
  if (currentVolumeIndex > 0) {
    const prevVol = allVolumes[currentVolumeIndex - 1]
    if (prevVol.keyPoints && prevVol.keyPoints.length > 0) {
      previousVolumeKeyPoints = `第${currentVolumeIndex}卷已完成：${prevVol.keyPoints.join('、')}`
    } else {
      previousVolumeKeyPoints = `第${currentVolumeIndex}卷：${prevVol.summary.slice(0, 100)}`
    }
  }

  // 5. 下一卷的核心要点（替代完整摘要）
  let nextVolumeKeyPoints = ''
  if (currentVolumeIndex < allVolumes.length - 1) {
    const nextVol = allVolumes[currentVolumeIndex + 1]
    if (nextVol.keyPoints && nextVol.keyPoints.length > 0) {
      nextVolumeKeyPoints = `第${currentVolumeIndex + 2}卷预告：${nextVol.keyPoints.join('、')}`
    } else {
      nextVolumeKeyPoints = `第${currentVolumeIndex + 2}卷：${nextVol.summary.slice(0, 100)}`
    }
  }

  return {
    compressedWorldSetting,
    compressedCharacters,
    volumeIndex,
    previousVolumeKeyPoints,
    nextVolumeKeyPoints
  }
}

// ==================== 4. 一致性验证 ====================

/**
 * 验证生成的章节大纲是否与已有内容冲突
 */
export async function validateOutlineConsistency(params: {
  newOutlines: Array<{ title: string; outline: string }>
  volumeIndex: number
  allVolumes: Volume[]
  characters: Character[]
}): Promise<{
  hasConflict: boolean
  conflicts: string[]
  suggestions: string[]
}> {
  const { newOutlines, volumeIndex, allVolumes, characters } = params

  const conflicts: string[] = []
  const suggestions: string[] = []

  // 1. 检查是否使用了已故角色
  const deceasedCharacters = characters.filter(c => c.status === 'deceased')
  for (const outline of newOutlines) {
    for (const deceased of deceasedCharacters) {
      if (outline.outline.includes(deceased.name)) {
        conflicts.push(
          `第${volumeIndex + 1}卷-${outline.title}：使用了已故角色"${deceased.name}"（死于${deceased.deathChapter}）`
        )
      }
    }
  }

  // 2. 检查是否提前使用了下一卷的关键要点
  if (volumeIndex < allVolumes.length - 1) {
    const nextVol = allVolumes[volumeIndex + 1]
    if (nextVol.keyPoints && nextVol.keyPoints.length > 0) {
      for (const outline of newOutlines) {
        for (const keyPoint of nextVol.keyPoints) {
          // 简单的文本匹配（可以改进为语义匹配）
          const keywords = keyPoint.split(/[、，。]/).filter(k => k.length > 2)
          for (const keyword of keywords) {
            if (outline.outline.includes(keyword)) {
              suggestions.push(
                `第${volumeIndex + 1}卷-${outline.title}：可能涉及下一卷内容"${keyPoint}"，建议检查`
              )
            }
          }
        }
      }
    }
  }

  // 3. 检查是否重复了上一卷的关键要点
  if (volumeIndex > 0) {
    const prevVol = allVolumes[volumeIndex - 1]
    if (prevVol.keyPoints && prevVol.keyPoints.length > 0) {
      for (const outline of newOutlines) {
        for (const keyPoint of prevVol.keyPoints) {
          const keywords = keyPoint.split(/[、，。]/).filter(k => k.length > 2)
          for (const keyword of keywords) {
            if (outline.outline.includes(keyword)) {
              suggestions.push(
                `第${volumeIndex + 1}卷-${outline.title}：可能重复上一卷内容"${keyPoint}"，建议检查`
              )
            }
          }
        }
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    suggestions
  }
}

// ==================== 5. 导出统计信息 ====================

/**
 * 计算压缩效果统计
 */
export function calculateCompressionStats(params: {
  originalWorldSetting: string
  originalCharacterCount: number
  compressedContext: ReturnType<typeof buildCompressedContext>
}): {
  originalTokens: number
  compressedTokens: number
  savedTokens: number
  savedPercentage: number
} {
  const { originalWorldSetting, originalCharacterCount, compressedContext } = params

  // 估算token数（中文约1.5个字符=1个token）
  const originalTokens = Math.ceil(
    (originalWorldSetting.length +
      originalCharacterCount * 150 +  // 假设每个角色150字
      500) /  // 其他上下文
    1.5
  )

  const compressedTokens = Math.ceil(
    (compressedContext.compressedWorldSetting.length +
      compressedContext.compressedCharacters.length +
      compressedContext.volumeIndex.length +
      compressedContext.previousVolumeKeyPoints.length +
      compressedContext.nextVolumeKeyPoints.length) /
    1.5
  )

  const savedTokens = originalTokens - compressedTokens
  const savedPercentage = Math.round((savedTokens / originalTokens) * 100)

  return {
    originalTokens,
    compressedTokens,
    savedTokens,
    savedPercentage
  }
}
