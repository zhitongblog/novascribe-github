import type { Character } from '../types'

/**
 * 角色死亡防控工具
 * 三合一方案：
 * 1. 构建已故角色列表用于提示词
 * 2. 生成后校验内容是否包含已故角色
 * 3. 分析章节检测角色死亡事件
 */

/**
 * 获取已故角色列表（用于生成前验证和提示词构建）
 */
export function getDeceasedCharacters(characters: Character[]): Character[] {
  return characters.filter(c => c.status === 'deceased')
}

/**
 * 获取存活角色列表
 */
export function getActiveCharacters(characters: Character[]): Character[] {
  return characters.filter(c => c.status !== 'deceased')
}

/**
 * 构建已故角色警告文本（用于提示词）
 * @param characters - 角色列表
 * @returns 已故角色警告文本，如果没有已故角色则返回空字符串
 */
export function buildDeceasedWarning(characters: Character[]): string {
  const deceased = getDeceasedCharacters(characters)

  if (deceased.length === 0) {
    return ''
  }

  const deceasedList = deceased.map(c => {
    let info = `- ${c.name}`
    if (c.deathChapter) {
      info += `（死于：${c.deathChapter}）`
    }
    return info
  }).join('\n')

  return `
【🚨 已故角色名单 - 绝对禁止出场】
以下角色已在之前的剧情中死亡，在后续章节中绝对不能：
1. 让他们说话或出现
2. 提及他们的现在时态活动
3. 安排他们与其他角色互动
4. 以任何形式让他们"复活"

${deceasedList}

⚠️ 可以做的：回忆/闪回、其他角色提及已故者、墓碑/遗物等
❌ 禁止的：已故角色有任何新的动作、对话、出场
`
}

/**
 * 构建角色档案简报（用于提示词，包含生死状态和关系）
 */
export function buildCharacterBriefing(characters: Character[]): string {
  const active = getActiveCharacters(characters)
  const deceased = getDeceasedCharacters(characters)

  let briefing = '【角色档案】\n\n'

  // 存活角色
  if (active.length > 0) {
    briefing += '▶ 存活角色：\n'
    briefing += active.slice(0, 8).map(c => {
      const role = c.role === 'protagonist' ? '主角' : c.role === 'antagonist' ? '反派' : '配角'
      let info = `• ${c.name}（${role}）：${c.identity}`
      if (c.relationships && c.relationships.length > 0) {
        const rels = c.relationships.slice(0, 2).map(r => `${r.targetName}:${r.relation}`).join('、')
        info += ` [关系：${rels}]`
      }
      return info
    }).join('\n')
    briefing += '\n\n'
  }

  // 已故角色
  if (deceased.length > 0) {
    briefing += '▶ 已故角色（禁止出场）：\n'
    briefing += deceased.map(c => {
      let info = `• ${c.name}（已死亡`
      if (c.deathChapter) {
        info += `于${c.deathChapter}`
      }
      info += '）'
      return info
    }).join('\n')
    briefing += '\n'
  }

  return briefing
}

/**
 * 检测文本内容中是否包含已故角色的名字
 * 用于生成后校验
 * @param content - 生成的内容
 * @param characters - 角色列表
 * @returns 检测结果
 */
export function detectDeceasedInContent(
  content: string,
  characters: Character[]
): {
  hasViolation: boolean
  violations: {
    name: string
    deathChapter?: string
    occurrences: number
    contexts: string[]  // 出现的上下文片段
  }[]
} {
  const deceased = getDeceasedCharacters(characters)
  const violations: {
    name: string
    deathChapter?: string
    occurrences: number
    contexts: string[]
  }[] = []

  for (const char of deceased) {
    // 搜索角色名出现的位置
    const regex = new RegExp(char.name, 'g')
    const matches = content.match(regex)

    if (matches && matches.length > 0) {
      // 获取出现的上下文
      const contexts: string[] = []
      let match
      const searchRegex = new RegExp(char.name, 'g')
      while ((match = searchRegex.exec(content)) !== null) {
        const start = Math.max(0, match.index - 20)
        const end = Math.min(content.length, match.index + char.name.length + 20)
        const context = content.slice(start, end)

        // 排除明显是回忆/过去式的上下文
        const isPastTense = /曾经|当年|想起|回忆|以前|从前|那时|往事|故去|已故|去世|死后/.test(context)
        if (!isPastTense) {
          contexts.push('...' + context + '...')
        }
      }

      // 如果有非回忆上下文，记录为违规
      if (contexts.length > 0) {
        violations.push({
          name: char.name,
          deathChapter: char.deathChapter,
          occurrences: contexts.length,
          contexts: contexts.slice(0, 3) // 最多显示3个上下文
        })
      }
    }
  }

  return {
    hasViolation: violations.length > 0,
    violations
  }
}

/**
 * 格式化违规检测结果为警告消息
 */
export function formatViolationWarning(
  violations: {
    name: string
    deathChapter?: string
    occurrences: number
    contexts: string[]
  }[]
): string {
  if (violations.length === 0) return ''

  let warning = '⚠️ 检测到已故角色出场：\n\n'

  for (const v of violations) {
    warning += `【${v.name}】`
    if (v.deathChapter) {
      warning += `（已故于：${v.deathChapter}）`
    }
    warning += `\n出现 ${v.occurrences} 次：\n`
    for (const ctx of v.contexts) {
      warning += `  "${ctx}"\n`
    }
    warning += '\n'
  }

  warning += '建议：请检查这些内容是否需要修改，确保已故角色不会在现在时态出场。'

  return warning
}

/**
 * 分析章节内容，检测角色死亡事件
 * 这是对gemini.ts中analyzeChapterForCharacters的补充
 * 用于本地快速检测，不调用API
 */
export function quickAnalyzeDeaths(
  content: string,
  characterNames: string[]
): {
  potentialDeaths: string[]  // 可能死亡的角色名
  confidence: 'high' | 'medium' | 'low'
} {
  const deathKeywords = [
    '死了', '死亡', '牺牲', '去世', '陨落', '身亡', '殒命',
    '断气', '咽气', '没了呼吸', '停止了呼吸', '闭上了眼睛',
    '倒在血泊', '永远地', '再也不会', '化为灰烬', '魂飞魄散',
    '灰飞烟灭', '香消玉殒', '与世长辞', '命丧', '丧命'
  ]

  const potentialDeaths: string[] = []

  for (const name of characterNames) {
    // 检查角色名是否在死亡关键词附近出现
    for (const keyword of deathKeywords) {
      // 角色名在关键词前后50字范围内
      const pattern = new RegExp(`${name}.{0,50}${keyword}|${keyword}.{0,50}${name}`)
      if (pattern.test(content)) {
        if (!potentialDeaths.includes(name)) {
          potentialDeaths.push(name)
        }
        break
      }
    }
  }

  // 根据检测到的数量判断置信度
  let confidence: 'high' | 'medium' | 'low' = 'low'
  if (potentialDeaths.length > 0) {
    // 检查是否有多个死亡关键词
    const keywordCount = deathKeywords.filter(kw => content.includes(kw)).length
    if (keywordCount >= 3) {
      confidence = 'high'
    } else if (keywordCount >= 1) {
      confidence = 'medium'
    }
  }

  return { potentialDeaths, confidence }
}

/**
 * 生成角色死亡确认提示
 * 当检测到可能的死亡事件时，生成供用户确认的消息
 */
export function buildDeathConfirmationPrompt(
  potentialDeaths: string[],
  chapterTitle: string
): string {
  if (potentialDeaths.length === 0) return ''

  return `📝 在「${chapterTitle}」中检测到可能的角色死亡事件：

${potentialDeaths.map(name => `• ${name}`).join('\n')}

是否将这些角色标记为已故？
（标记后，AI写作时将自动避免让他们出场）`
}
