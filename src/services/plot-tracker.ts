/**
 * 伏笔追踪系统 - 解决百万字长篇伏笔遗忘/矛盾问题
 *
 * 功能：
 * 1. 记录伏笔埋设
 * 2. 追踪伏笔状态
 * 3. 提醒伏笔回收
 * 4. 检测伏笔冲突
 */

import { generateText } from './gemini'
import type { PlotThread, ConsistencyWarning } from '../types/memory'

/**
 * 从章节内容中自动检测伏笔
 */
export async function detectPlotThreads(
  chapterContent: string,
  chapterIndex: number,
  existingThreads: PlotThread[]
): Promise<{
  newThreads: PlotThread[]
  hints: { threadId: string; hint: string }[]
  resolved: string[]
}> {
  const existingDesc = existingThreads
    .filter(t => t.status === 'active' || t.status === 'hinted')
    .map(t => `[${t.id}] ${t.description}`)
    .join('\n')

  const prompt = `你是一个专业的小说编辑，请分析以下章节内容，识别伏笔相关的内容。

【章节内容】
${chapterContent.slice(0, 3000)}

【已有伏笔】
${existingDesc || '暂无'}

请分析并返回JSON格式结果：

\`\`\`json
{
  "newThreads": [
    {
      "description": "伏笔描述（简洁明了）",
      "importance": "minor|major|critical",
      "relatedCharacters": ["角色名"],
      "expectedChaptersToResolve": 20
    }
  ],
  "hints": [
    {
      "threadId": "已有伏笔的ID",
      "hint": "本章对该伏笔的暗示/推进"
    }
  ],
  "resolved": ["已揭晓的伏笔ID"]
}
\`\`\`

分析要求：
1. 新伏笔：神秘人物、未解之谜、预言、暗示的未来事件等
2. 暗示：对已有伏笔的线索补充
3. 揭晓：伏笔真相大白的情况

只输出JSON，不要解释。如果没有检测到，对应数组返回空[]。`

  try {
    const result = await generateText(prompt)

    // 解析JSON
    const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { newThreads: [], hints: [], resolved: [] }
    }

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])

    // 处理新伏笔
    const newThreads: PlotThread[] = (parsed.newThreads || []).map((t: any) => ({
      id: `plot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      description: t.description,
      plantedChapter: chapterIndex,
      expectedResolutionRange: {
        min: chapterIndex + 5,
        max: chapterIndex + (t.expectedChaptersToResolve || 30)
      },
      status: 'active' as const,
      relatedCharacters: t.relatedCharacters || [],
      hints: [],
      importance: t.importance || 'major'
    }))

    return {
      newThreads,
      hints: parsed.hints || [],
      resolved: parsed.resolved || []
    }
  } catch (e) {
    console.error('Failed to detect plot threads:', e)
    return { newThreads: [], hints: [], resolved: [] }
  }
}

/**
 * 检查伏笔一致性
 */
export function checkPlotConsistency(
  chapterIndex: number,
  threads: PlotThread[]
): ConsistencyWarning[] {
  const warnings: ConsistencyWarning[] = []

  for (const thread of threads) {
    // 检查过期未揭晓的伏笔
    if (thread.status === 'active' && chapterIndex > thread.expectedResolutionRange.max) {
      warnings.push({
        type: 'timeline_conflict',
        severity: 'warning',
        chapter: chapterIndex,
        description: `伏笔"${thread.description}"已超过预期揭晓时间（预期在第${thread.expectedResolutionRange.max}章前揭晓）`,
        suggestion: `建议在近期章节揭晓此伏笔，或标记为放弃`
      })
    }

    // 检查临近揭晓期的伏笔
    if (
      thread.status === 'active' &&
      chapterIndex >= thread.expectedResolutionRange.min &&
      chapterIndex <= thread.expectedResolutionRange.max
    ) {
      const remaining = thread.expectedResolutionRange.max - chapterIndex
      if (remaining <= 5) {
        warnings.push({
          type: 'timeline_conflict',
          severity: 'warning',
          chapter: chapterIndex,
          description: `伏笔"${thread.description}"即将到期，剩余${remaining}章`,
          suggestion: `建议尽快安排揭晓`
        })
      }
    }

    // 检查重要伏笔长期无暗示
    if (
      thread.status === 'active' &&
      thread.importance === 'critical' &&
      thread.hints.length === 0 &&
      chapterIndex - thread.plantedChapter > 10
    ) {
      warnings.push({
        type: 'timeline_conflict',
        severity: 'warning',
        chapter: chapterIndex,
        description: `关键伏笔"${thread.description}"已埋设${chapterIndex - thread.plantedChapter}章，但无任何暗示`,
        suggestion: `建议添加线索暗示，让读者保持期待`
      })
    }
  }

  return warnings
}

/**
 * 获取当前章节应该回收的伏笔建议
 */
export function getPlotResolutionSuggestions(
  chapterIndex: number,
  threads: PlotThread[]
): {
  mustResolve: PlotThread[]
  shouldHint: PlotThread[]
  canResolve: PlotThread[]
} {
  const activeThreads = threads.filter(t => t.status === 'active' || t.status === 'hinted')

  // 必须揭晓（已超期或即将超期）
  const mustResolve = activeThreads.filter(t =>
    chapterIndex >= t.expectedResolutionRange.max - 2
  )

  // 应该添加暗示（在揭晓期内但还早）
  const shouldHint = activeThreads.filter(t =>
    chapterIndex >= t.expectedResolutionRange.min &&
    chapterIndex < t.expectedResolutionRange.max - 5 &&
    t.hints.filter(h => h.chapter > chapterIndex - 10).length === 0
  )

  // 可以揭晓（在揭晓期内）
  const canResolve = activeThreads.filter(t =>
    chapterIndex >= t.expectedResolutionRange.min &&
    chapterIndex <= t.expectedResolutionRange.max &&
    !mustResolve.includes(t)
  )

  return { mustResolve, shouldHint, canResolve }
}

/**
 * 生成伏笔提示文本（用于写作提示）
 */
export function generatePlotReminder(
  chapterIndex: number,
  threads: PlotThread[]
): string {
  const suggestions = getPlotResolutionSuggestions(chapterIndex, threads)

  const parts: string[] = []

  if (suggestions.mustResolve.length > 0) {
    parts.push(`【必须揭晓的伏笔】\n${suggestions.mustResolve.map(t =>
      `- ${t.description}（埋设于第${t.plantedChapter}章，已超期）`
    ).join('\n')}`)
  }

  if (suggestions.shouldHint.length > 0) {
    parts.push(`【建议添加暗示的伏笔】\n${suggestions.shouldHint.map(t =>
      `- ${t.description}（预期在第${t.expectedResolutionRange.min}-${t.expectedResolutionRange.max}章揭晓）`
    ).join('\n')}`)
  }

  if (suggestions.canResolve.length > 0) {
    parts.push(`【可选揭晓的伏笔】\n${suggestions.canResolve.map(t =>
      `- ${t.description}`
    ).join('\n')}`)
  }

  return parts.join('\n\n')
}

/**
 * 更新伏笔状态
 */
export function updatePlotThread(
  thread: PlotThread,
  update: {
    addHint?: { chapter: number; content: string }
    resolve?: number
    abandon?: boolean
  }
): PlotThread {
  const updated = { ...thread }

  if (update.addHint) {
    updated.hints = [...updated.hints, update.addHint]
    if (updated.status === 'active') {
      updated.status = 'hinted'
    }
  }

  if (update.resolve) {
    updated.status = 'resolved'
    updated.resolvedChapter = update.resolve
  }

  if (update.abandon) {
    updated.status = 'abandoned'
  }

  return updated
}

/**
 * 生成伏笔统计报告
 */
export function generatePlotReport(threads: PlotThread[]): string {
  const active = threads.filter(t => t.status === 'active')
  const hinted = threads.filter(t => t.status === 'hinted')
  const resolved = threads.filter(t => t.status === 'resolved')
  const abandoned = threads.filter(t => t.status === 'abandoned')

  const critical = threads.filter(t => t.importance === 'critical' && t.status !== 'resolved')
  const major = threads.filter(t => t.importance === 'major' && t.status !== 'resolved')

  return `
## 伏笔追踪报告

### 状态统计
- 活跃伏笔: ${active.length}
- 已暗示: ${hinted.length}
- 已揭晓: ${resolved.length}
- 已放弃: ${abandoned.length}

### 重要伏笔（未揭晓）
${critical.map(t => `- [关键] ${t.description}`).join('\n') || '无'}
${major.map(t => `- [重要] ${t.description}`).join('\n') || '无'}

### 详细列表
${threads.map(t => `
**${t.description}**
- 状态: ${t.status}
- 埋设: 第${t.plantedChapter}章
- 预期揭晓: 第${t.expectedResolutionRange.min}-${t.expectedResolutionRange.max}章
- 相关角色: ${t.relatedCharacters.join('、') || '无'}
- 暗示次数: ${t.hints.length}
${t.resolvedChapter ? `- 揭晓于: 第${t.resolvedChapter}章` : ''}
`).join('\n')}
`.trim()
}
