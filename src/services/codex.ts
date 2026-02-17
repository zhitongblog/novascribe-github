/**
 * Codex 自动索引系统
 *
 * 功能：
 * 1. 自动识别和索引人名、地名、物品
 * 2. 追踪实体在各章节的出现
 * 3. 检测实体属性变化
 * 4. 生成实体关系图谱
 */

import { generateText } from './gemini'

// ==================== 类型定义 ====================

export interface CodexEntity {
  id: string
  name: string
  type: 'character' | 'location' | 'item' | 'faction' | 'concept'
  aliases: string[]  // 别名/称号
  description: string
  // 首次出现
  firstAppearance: number
  // 出现的章节
  appearances: number[]
  // 属性（随章节变化）
  attributes: {
    chapter: number
    key: string
    value: string
  }[]
  // 关联实体
  relations: {
    targetId: string
    relation: string
    since: number  // 从哪章开始
  }[]
}

export interface Codex {
  entities: CodexEntity[]
  lastUpdated: string
  version: number
}

// ==================== 核心功能 ====================

/**
 * 创建空的Codex
 */
export function createEmptyCodex(): Codex {
  return {
    entities: [],
    lastUpdated: new Date().toISOString(),
    version: 1
  }
}

/**
 * 从章节内容提取实体
 */
export async function extractEntitiesFromChapter(
  chapterContent: string,
  chapterIndex: number,
  existingEntities: CodexEntity[]
): Promise<{
  newEntities: Partial<CodexEntity>[]
  updatedEntities: { id: string; updates: Partial<CodexEntity> }[]
  newRelations: { sourceId: string; targetId: string; relation: string }[]
}> {
  const existingNames = existingEntities.map(e => e.name).join('、')

  const prompt = `分析以下章节内容，提取实体信息。

【章节内容】
${chapterContent.slice(0, 3000)}

【已知实体】
${existingNames || '暂无'}

请返回JSON格式：
\`\`\`json
{
  "newEntities": [
    {
      "name": "实体名称",
      "type": "character|location|item|faction|concept",
      "aliases": ["别名1", "称号1"],
      "description": "简短描述"
    }
  ],
  "entityUpdates": [
    {
      "name": "已有实体名称",
      "attributeChanges": [
        { "key": "境界/状态/位置等", "value": "新值" }
      ]
    }
  ],
  "newRelations": [
    {
      "source": "实体A名称",
      "target": "实体B名称",
      "relation": "关系描述（如：师徒、敌对、父子等）"
    }
  ]
}
\`\`\`

提取要求：
1. 人物：出场的角色，包括名字和别名
2. 地点：场景发生的地方
3. 物品：重要的道具、武器等
4. 势力：组织、门派、国家等
5. 概念：功法、技能、特殊术语等

只提取本章新出现或有变化的实体。只输出JSON。`

  try {
    const result = await generateText(prompt)
    const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return { newEntities: [], updatedEntities: [], newRelations: [] }
    }

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])

    // 处理新实体
    const newEntities: Partial<CodexEntity>[] = (parsed.newEntities || []).map((e: any) => ({
      id: `entity_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: e.name,
      type: e.type,
      aliases: e.aliases || [],
      description: e.description || '',
      firstAppearance: chapterIndex,
      appearances: [chapterIndex],
      attributes: [],
      relations: []
    }))

    // 处理实体更新
    const updatedEntities: { id: string; updates: Partial<CodexEntity> }[] = []
    for (const update of parsed.entityUpdates || []) {
      const existing = existingEntities.find(e =>
        e.name === update.name || e.aliases.includes(update.name)
      )
      if (existing) {
        const newAttributes = (update.attributeChanges || []).map((attr: any) => ({
          chapter: chapterIndex,
          key: attr.key,
          value: attr.value
        }))
        updatedEntities.push({
          id: existing.id,
          updates: {
            appearances: [...existing.appearances, chapterIndex],
            attributes: [...existing.attributes, ...newAttributes]
          }
        })
      }
    }

    // 处理新关系
    const newRelations: { sourceId: string; targetId: string; relation: string }[] = []
    for (const rel of parsed.newRelations || []) {
      const source = existingEntities.find(e =>
        e.name === rel.source || e.aliases.includes(rel.source)
      )
      const target = existingEntities.find(e =>
        e.name === rel.target || e.aliases.includes(rel.target)
      )
      if (source && target) {
        newRelations.push({
          sourceId: source.id,
          targetId: target.id,
          relation: rel.relation
        })
      }
    }

    return { newEntities, updatedEntities, newRelations }
  } catch (e) {
    console.error('Failed to extract entities:', e)
    return { newEntities: [], updatedEntities: [], newRelations: [] }
  }
}

/**
 * 更新Codex
 */
export function updateCodex(
  codex: Codex,
  newEntities: Partial<CodexEntity>[],
  updatedEntities: { id: string; updates: Partial<CodexEntity> }[],
  newRelations: { sourceId: string; targetId: string; relation: string }[],
  chapterIndex: number
): Codex {
  const entities = [...codex.entities]

  // 添加新实体
  for (const newEntity of newEntities) {
    entities.push(newEntity as CodexEntity)
  }

  // 更新现有实体
  for (const { id, updates } of updatedEntities) {
    const idx = entities.findIndex(e => e.id === id)
    if (idx >= 0) {
      entities[idx] = {
        ...entities[idx],
        ...updates,
        appearances: [...new Set([...entities[idx].appearances, ...(updates.appearances || [])])]
      }
    }
  }

  // 添加新关系
  for (const rel of newRelations) {
    const sourceIdx = entities.findIndex(e => e.id === rel.sourceId)
    if (sourceIdx >= 0) {
      const existingRel = entities[sourceIdx].relations.find(r =>
        r.targetId === rel.targetId && r.relation === rel.relation
      )
      if (!existingRel) {
        entities[sourceIdx].relations.push({
          targetId: rel.targetId,
          relation: rel.relation,
          since: chapterIndex
        })
      }
    }
  }

  return {
    entities,
    lastUpdated: new Date().toISOString(),
    version: codex.version + 1
  }
}

/**
 * 获取实体的完整信息
 */
export function getEntityInfo(codex: Codex, entityId: string): string | null {
  const entity = codex.entities.find(e => e.id === entityId)
  if (!entity) return null

  const parts: string[] = []
  parts.push(`【${entity.name}】(${entity.type})`)

  if (entity.aliases.length > 0) {
    parts.push(`别名：${entity.aliases.join('、')}`)
  }

  parts.push(`简介：${entity.description}`)
  parts.push(`首次出现：第${entity.firstAppearance}章`)
  parts.push(`出场次数：${entity.appearances.length}章`)

  // 最新属性
  const latestAttrs: Record<string, string> = {}
  for (const attr of entity.attributes) {
    latestAttrs[attr.key] = attr.value
  }
  if (Object.keys(latestAttrs).length > 0) {
    parts.push(`当前状态：${Object.entries(latestAttrs).map(([k, v]) => `${k}=${v}`).join('，')}`)
  }

  // 关系
  if (entity.relations.length > 0) {
    const relatedEntities = entity.relations.map(rel => {
      const target = codex.entities.find(e => e.id === rel.targetId)
      return target ? `${target.name}（${rel.relation}）` : null
    }).filter(Boolean)
    if (relatedEntities.length > 0) {
      parts.push(`关联：${relatedEntities.join('、')}`)
    }
  }

  return parts.join('\n')
}

/**
 * 搜索实体
 */
export function searchEntities(
  codex: Codex,
  query: string,
  type?: CodexEntity['type']
): CodexEntity[] {
  const lowerQuery = query.toLowerCase()
  return codex.entities.filter(e => {
    if (type && e.type !== type) return false
    return (
      e.name.toLowerCase().includes(lowerQuery) ||
      e.aliases.some(a => a.toLowerCase().includes(lowerQuery)) ||
      e.description.toLowerCase().includes(lowerQuery)
    )
  })
}

/**
 * 获取章节中出现的实体
 */
export function getEntitiesInChapter(codex: Codex, chapterIndex: number): CodexEntity[] {
  return codex.entities.filter(e => e.appearances.includes(chapterIndex))
}

/**
 * 生成实体简报（用于写作提示）
 */
export function generateEntityBrief(codex: Codex, entityNames: string[]): string {
  const briefs: string[] = []

  for (const name of entityNames) {
    const entity = codex.entities.find(e =>
      e.name === name || e.aliases.includes(name)
    )
    if (entity) {
      const latestAttrs = getLatestAttributes(entity)
      briefs.push(`【${entity.name}】${entity.description}${latestAttrs ? `（${latestAttrs}）` : ''}`)
    }
  }

  return briefs.join('\n')
}

/**
 * 获取实体的最新属性
 */
function getLatestAttributes(entity: CodexEntity): string {
  const latest: Record<string, string> = {}
  for (const attr of entity.attributes) {
    latest[attr.key] = attr.value
  }
  return Object.entries(latest).map(([k, v]) => `${k}:${v}`).join('，')
}

/**
 * 检测实体冲突
 */
export function detectEntityConflicts(
  codex: Codex,
  chapterContent: string,
  chapterIndex: number
): { entity: string; issue: string; suggestion: string }[] {
  const conflicts: { entity: string; issue: string; suggestion: string }[] = []

  // 检测死亡角色出场
  const deadCharacters = codex.entities.filter(e =>
    e.type === 'character' &&
    e.attributes.some(a => a.key === '状态' && a.value === '死亡')
  )

  for (const dead of deadCharacters) {
    const deathChapter = dead.attributes.find(a => a.key === '状态' && a.value === '死亡')?.chapter || 0
    const names = [dead.name, ...dead.aliases]

    for (const name of names) {
      // 简单检测名字是否出现在内容中
      if (chapterContent.includes(name) && chapterIndex > deathChapter) {
        conflicts.push({
          entity: dead.name,
          issue: `角色"${dead.name}"已在第${deathChapter}章死亡，但在本章内容中出现`,
          suggestion: `请检查是否为回忆场景，若非回忆请移除该角色的出场`
        })
      }
    }
  }

  return conflicts
}

/**
 * 生成Codex报告
 */
export function generateCodexReport(codex: Codex): string {
  const byType: Record<string, CodexEntity[]> = {}
  for (const entity of codex.entities) {
    if (!byType[entity.type]) byType[entity.type] = []
    byType[entity.type].push(entity)
  }

  const typeLabels: Record<string, string> = {
    character: '角色',
    location: '地点',
    item: '物品',
    faction: '势力',
    concept: '概念'
  }

  let report = `# Codex 索引报告\n\n`
  report += `总实体数：${codex.entities.length}\n`
  report += `最后更新：${codex.lastUpdated}\n\n`

  for (const [type, entities] of Object.entries(byType)) {
    report += `## ${typeLabels[type] || type}（${entities.length}）\n\n`
    for (const entity of entities) {
      report += `### ${entity.name}\n`
      if (entity.aliases.length > 0) {
        report += `- 别名：${entity.aliases.join('、')}\n`
      }
      report += `- ${entity.description}\n`
      report += `- 首次出现：第${entity.firstAppearance}章\n`
      report += `- 出场：${entity.appearances.length}章\n`
      if (entity.relations.length > 0) {
        const rels = entity.relations.map(r => {
          const target = codex.entities.find(e => e.id === r.targetId)
          return target ? `${target.name}(${r.relation})` : null
        }).filter(Boolean)
        report += `- 关联：${rels.join('、')}\n`
      }
      report += '\n'
    }
  }

  return report
}
