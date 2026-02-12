import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

let genAI: GoogleGenerativeAI | null = null
let model: GenerativeModel | null = null
let apiKeyStore: string = ''

// Gemini 模型配置（包含 Gemini 3 系列）
export const AVAILABLE_MODELS = {
  'gemini-3-flash-preview': {
    name: 'Gemini 3 Flash (预览版)',
    description: '速度快3倍，配额更高，编程能力更强，Google推荐首选',
    contextWindow: 2097152,
    recommended: true
  },
  'gemini-3-pro-preview': {
    name: 'Gemini 3 Pro (预览版)',
    description: '最大推理深度，但速度较慢且配额限制更严格',
    contextWindow: 2097152,
    recommended: false
  },
  'gemini-2.0-flash-exp': {
    name: 'Gemini 2.0 Flash (实验版)',
    description: '快速模型，适合大纲生成',
    contextWindow: 1048576,
    recommended: false
  },
  'gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    description: '稳定版，高质量输出',
    contextWindow: 2097152,
    recommended: false
  },
  'gemini-1.5-flash': {
    name: 'Gemini 1.5 Flash',
    description: '快速版，性价比高',
    contextWindow: 1048576,
    recommended: false
  }
} as const

// 默认使用 Gemini 3 Flash（配额更高，速度更快，Google 官方推荐）
let TEXT_MODEL = 'gemini-3-flash-preview'
const IMAGE_MODEL = 'gemini-3-pro-image-preview'  // 图像生成继续使用 Gemini 3 Pro Image

/**
 * 初始化 Gemini API
 * @param apiKey - API密钥
 * @param modelName - 可选，指定模型名称
 */
export async function initGemini(apiKey: string, modelName?: string): Promise<boolean> {
  try {
    if (modelName && modelName in AVAILABLE_MODELS) {
      TEXT_MODEL = modelName
    }

    genAI = new GoogleGenerativeAI(apiKey)
    model = genAI.getGenerativeModel({ model: TEXT_MODEL })
    apiKeyStore = apiKey
    console.log(`✅ Gemini initialized with model: ${TEXT_MODEL}`)
    console.log(`📊 Model info: ${AVAILABLE_MODELS[TEXT_MODEL as keyof typeof AVAILABLE_MODELS]?.description}`)
    return true
  } catch (error) {
    console.error('❌ Failed to initialize Gemini:', error)
    return false
  }
}

/**
 * 切换模型
 */
export async function switchModel(modelName: keyof typeof AVAILABLE_MODELS): Promise<boolean> {
  if (!genAI || !apiKeyStore) {
    throw new Error('Gemini API 未初始化')
  }

  try {
    TEXT_MODEL = modelName
    model = genAI.getGenerativeModel({ model: TEXT_MODEL })
    console.log(`Switched to model: ${TEXT_MODEL}`)
    return true
  } catch (error) {
    console.error('Failed to switch model:', error)
    return false
  }
}

/**
 * 检查是否已初始化
 */
export function isGeminiReady(): boolean {
  return model !== null
}

/**
 * 生成文本内容（带超时和重试）
 */
export async function generateText(
  prompt: string,
  retries: number = 2,
  timeout: number = 60000
): Promise<string> {
  if (!model) {
    throw new Error('Gemini API 未初始化，请先在设置中配置 API Key')
  }

  let lastError: any = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[Gemini API] 请求尝试 ${attempt + 1}/${retries + 1}`)

      // 创建超时Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('请求超时，请检查网络连接')), timeout)
      })

      // 创建API请求Promise
      const apiPromise = (async () => {
        const result = await model!.generateContent(prompt)
        const response = await result.response
        return response.text()
      })()

      // 竞速：哪个先完成就用哪个
      const text = await Promise.race([apiPromise, timeoutPromise])

      console.log(`[Gemini API] 请求成功`)
      return text

    } catch (error: any) {
      lastError = error
      const errorMsg = error.message || String(error)

      console.error(`[Gemini API] 请求失败 (尝试 ${attempt + 1}/${retries + 1}):`, errorMsg)

      // 如果是最后一次尝试，不再重试
      if (attempt === retries) {
        break
      }

      // 根据错误类型决定是否重试
      if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        // 配额错误，不重试
        throw new Error('⚠️ API 配额已用尽，请稍后重试或更换模型')
      }

      if (errorMsg.includes('401') || errorMsg.includes('invalid')) {
        // 认证错误，不重试
        throw new Error('❌ API Key 无效，请检查全局设置')
      }

      // 网络错误，等待后重试
      const waitTime = Math.min(2000 * (attempt + 1), 5000)
      console.log(`[Gemini API] ${waitTime}ms 后重试...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  // 所有重试都失败
  const errorMsg = lastError?.message || String(lastError)

  if (errorMsg.includes('fetch')) {
    throw new Error('🌐 网络连接失败，请检查：\n1. 网络是否正常\n2. 是否需要代理访问 Google API\n3. 防火墙是否阻止了请求')
  }

  throw new Error(`生成失败: ${errorMsg}`)
}

/**
 * 流式生成文本
 */
export async function* generateTextStream(
  prompt: string
): AsyncGenerator<string, void, unknown> {
  if (!model) {
    throw new Error('Gemini API 未初始化，请先在设置中配置 API Key')
  }

  const result = await model.generateContentStream(prompt)

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) {
      yield text
    }
  }
}

/**
 * 生成大纲
 */
export async function generateOutline(
  inspiration: string,
  constraints: string,
  scale: string,
  genres: string[],
  styles: string[]
): Promise<string> {
  const scaleMap: Record<string, string> = {
    micro: '1-3万字的微小说',
    short: '3-10万字的短篇小说',
    million: '100万字左右的长篇小说',
    three_million: '300万字以上的巨著'
  }

  const prompt = `你是一个顶级的网文主编兼金牌编剧，精通番茄、起点等平台的市场风向。

请根据以下信息，生成一个完整的小说大纲：

【核心灵感】
${inspiration}

【额外约束】
${constraints || '无'}

【创作规模】
${scaleMap[scale] || '百万字长篇'}

【题材】
${genres.join('、') || '未指定'}

【风格】
${styles.join('、') || '未指定'}

请生成以下内容：

## 一、作品概要
- 书名建议（3个备选）
- 一句话卖点
- 核心冲突
- 爽点循环设计

## 二、黄金三章设定
- 第一章：如何开篇吸引读者
- 第二章：如何深化矛盾
- 第三章：如何设置钩子

## 三、力量体系/金手指
- 详细的能力设定
- 成长路线图

## 四、50章细纲
按照"第X章 章节名：简要剧情"的格式列出前50章的大纲。

注意：
1. 必须包含明确的"爽点循环"设计
2. 每章结尾必须有悬念
3. 避免降智打脸、无脑送人头等网文毒点
4. 采用"现代轻快、画面感强"的网文风格`

  return generateText(prompt)
}

/**
 * 生成角色设定
 */
export async function generateCharacter(
  name: string,
  role: string,
  context: string
): Promise<string> {
  const prompt = `你是一个专业的角色设计师。

请根据以下信息，生成详细的角色设定：

【角色名称】${name}
【角色类型】${role === 'protagonist' ? '主角' : role === 'antagonist' ? '反派' : '配角'}
【故事背景】
${context}

请生成以下内容：

## 外貌特征
详细描述角色的外貌，包括身高、体型、发色、瞳色、穿着风格等

## 性格特点
列出3-5个核心性格特征，并解释其成因

## 内在欲望
角色最深层的渴望是什么？

## 核心弱点
角色的致命缺陷是什么？这个弱点如何影响剧情？

## 人物弧光
角色从故事开始到结束会经历怎样的成长变化？

## 标志性口头禅
设计1-2句有特色的口头禅

## 不可告人的秘密
这个角色隐藏着什么秘密？

注意：拒绝脸谱化，角色必须立体、真实、有矛盾感。`

  return generateText(prompt)
}

/**
 * 生成正文内容
 */
export async function generateContent(
  outline: string,
  previousContent: string,
  style: string
): Promise<string> {
  const prompt = `你是一个专业的网文作家。

请根据以下大纲和前文，续写2000-3000字的正文：

【本章大纲】
${outline}

【前文回顾】
${previousContent || '这是故事的开始'}

【写作风格】
${style || '现代轻快、画面感强'}

写作要求：
1. 坚持"Show, don't tell"原则，通过动作和反应表现情绪
2. 章节结尾必须留有悬念（断章艺术）
3. 字数控制在2000-3000字
4. 避免降智打脸、无脑送人头等网文毒点
5. 保持节奏紧凑，避免大段心理描写

请直接输出正文内容，不要包含任何解释或元信息。`

  return generateText(prompt)
}

/**
 * 润色内容
 */
export async function polishContent(content: string): Promise<string> {
  const prompt = `你是一个专业的文字编辑。

请润色以下内容，优化词藻、增强节奏感、检查逻辑漏洞：

【原文】
${content}

润色要求：
1. 保持原意不变
2. 优化用词，使表达更加精准生动
3. 调整句式，增强节奏感和可读性
4. 检查并修复逻辑漏洞
5. 保持网文风格的轻快感

请直接输出润色后的内容，不要包含任何解释。`

  return generateText(prompt)
}

/**
 * 生成故事摘要
 */
export async function generateSummary(content: string): Promise<string> {
  const prompt = `请为以下小说内容生成一个简洁的故事摘要（200字以内）：

${content}

要求：
1. 概括主要剧情走向
2. 突出核心冲突
3. 不剧透关键转折
4. 语言简洁有力`

  return generateText(prompt)
}

/**
 * AI 续写
 */
export async function continueWriting(
  currentContent: string,
  wordCount: number = 500
): Promise<string> {
  const prompt = `请基于以下内容，自然地续写约${wordCount}字：

${currentContent}

要求：
1. 保持风格一致
2. 情节自然衔接
3. 推动剧情发展
4. 如果到了合适的位置可以设置小悬念

请直接输出续写内容，不要包含任何解释。`

  return generateText(prompt)
}

/**
 * 生成小说封面图片
 * 使用 Gemini SDK 生成图像
 */
export async function generateCoverImage(
  bookTitle: string,
  _authorName: string,
  style: string,
  genres: string[]
): Promise<string> {
  if (!genAI || !apiKeyStore) {
    throw new Error('Gemini API 未初始化，请先在设置中配置 API Key')
  }

  const styleDescriptions: Record<string, string> = {
    fantasy: 'epic fantasy digital painting, magical glowing elements, mystical purple and blue atmosphere',
    scifi: 'sci-fi cyberpunk style, neon lights, holographic elements, dark blue and cyan colors',
    wuxia: 'Chinese wuxia ink painting style, misty mountains, clouds, warrior silhouette',
    modern: 'modern minimalist urban style, clean design, warm sunset colors, city skyline',
    romance: 'romantic dreamy style, warm golden and pink colors, floral elements, bokeh lights',
    horror: 'dark gothic horror style, deep shadows, red and black atmosphere, fog',
    historical: 'classical oil painting style, rich vintage colors, historical architecture',
    anime: 'anime manga style illustration, dynamic composition, bold colors, clean lines'
  }

  const styleDesc = styleDescriptions[style] || styleDescriptions.fantasy
  const genreDesc = genres.slice(0, 2).join(' ') || 'fantasy'

  const prompt = `Create a beautiful book cover image: ${styleDesc}, theme "${bookTitle}", genre ${genreDesc}, professional quality, vertical portrait orientation, atmospheric, cinematic lighting, high detail, no text, no letters, no watermarks`

  const errors: string[] = []

  // 使用 gemini-3-pro-image-preview 模型生成图像
  try {
    console.log(`Using image model: ${IMAGE_MODEL}`)
    const imageModel = genAI.getGenerativeModel({
      model: IMAGE_MODEL,
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
      } as any,
    })

    const result = await imageModel.generateContent(prompt)
    const response = result.response
    const parts = response.candidates?.[0]?.content?.parts || []

    for (const part of parts) {
      const p = part as any
      if (p.inlineData?.data) {
        console.log('Image generated successfully')
        return `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`
      }
    }
    errors.push('SDK: 无图像返回')
  } catch (e: any) {
    console.error('SDK method error:', e)
    errors.push(`SDK: ${e.message}`)
  }

  // 备用: 直接 REST API 调用
  try {
    console.log('Fallback: Direct REST API call')
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${apiKeyStore}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT']
          }
        })
      }
    )

    const responseText = await response.text()
    console.log('REST API response status:', response.status)

    if (response.ok) {
      const data = JSON.parse(responseText)
      const parts = data.candidates?.[0]?.content?.parts || []

      for (const part of parts) {
        if (part.inlineData?.data) {
          console.log('Image generated via REST API')
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        }
      }
      errors.push('REST: 无图像返回')
    } else {
      errors.push(`REST: ${response.status}`)
    }
  } catch (e: any) {
    console.error('REST API error:', e)
    errors.push(`REST: ${e.message}`)
  }

  console.error('Image generation failed:', errors)
  throw new Error(`封面生成失败: ${errors.join('; ')}`)
}

/**
 * 获取当前使用的模型名称
 */
export function getCurrentModelName(): string {
  return TEXT_MODEL
}

/**
 * 配额检查结果
 */
export interface QuotaInfo {
  isValid: boolean           // API Key 是否有效
  model: string              // 当前使用的模型
  error?: string             // 错误信息
  quotaExceeded?: boolean    // 是否超过配额
  rateLimitInfo?: {
    requestsPerMinute?: number
    tokensPerMinute?: number
    requestsPerDay?: number
  }
}

/**
 * 检查 API 配额和健康状态
 */
export async function checkQuota(): Promise<QuotaInfo> {
  if (!apiKeyStore) {
    return {
      isValid: false,
      model: TEXT_MODEL,
      error: 'API Key 未配置'
    }
  }

  try {
    // 发送一个最小的测试请求
    const testModel = genAI?.getGenerativeModel({ model: TEXT_MODEL })
    if (!testModel) {
      return {
        isValid: false,
        model: TEXT_MODEL,
        error: '模型初始化失败'
      }
    }

    const result = await testModel.generateContent('Hi')
    await result.response

    return {
      isValid: true,
      model: TEXT_MODEL,
      quotaExceeded: false
    }
  } catch (error: any) {
    console.error('Quota check error:', error)

    const errorMessage = error.message || String(error)
    const isQuotaError = errorMessage.includes('429') ||
                         errorMessage.includes('quota') ||
                         errorMessage.includes('rate limit')

    // 解析错误信息
    let parsedError = errorMessage
    if (errorMessage.includes('429')) {
      parsedError = '⚠️ 配额已用尽或达到速率限制'
    } else if (errorMessage.includes('invalid') || errorMessage.includes('401')) {
      parsedError = '❌ API Key 无效或已过期'
    } else if (errorMessage.includes('403')) {
      parsedError = '🚫 API Key 无权限访问该模型'
    }

    return {
      isValid: !isQuotaError,
      model: TEXT_MODEL,
      error: parsedError,
      quotaExceeded: isQuotaError
    }
  }
}

/**
 * 测试所有可用模型，找到可用的模型
 */
export async function findAvailableModel(): Promise<{
  availableModel: string | null
  results: Record<string, { available: boolean; error?: string }>
}> {
  if (!apiKeyStore || !genAI) {
    throw new Error('Gemini API 未初始化')
  }

  const results: Record<string, { available: boolean; error?: string }> = {}
  let availableModel: string | null = null

  for (const modelName of Object.keys(AVAILABLE_MODELS)) {
    try {
      console.log(`Testing model: ${modelName}`)
      const testModel = genAI.getGenerativeModel({ model: modelName })
      const result = await testModel.generateContent('Test')
      await result.response

      results[modelName] = { available: true }
      if (!availableModel) {
        availableModel = modelName
      }
      console.log(`✅ ${modelName} is available`)
    } catch (error: any) {
      const errorMsg = error.message || String(error)
      results[modelName] = {
        available: false,
        error: errorMsg.slice(0, 100)
      }
      console.log(`❌ ${modelName} failed: ${errorMsg.slice(0, 100)}`)
    }
  }

  return { availableModel, results }
}

/**
 * 分析章节内容，更新角色档案（生死、出场、关系）
 * 节约token版：精简提示词
 */
export async function analyzeChapterForCharacters(
  chapterTitle: string,
  chapterContent: string,
  characterNames: string[]
): Promise<{
  appearances: string[]           // 本章出场的角色名
  deaths: string[]                // 本章死亡的角色名
  relationships: { char1: string; char2: string; relation: string }[]  // 新发现的关系
}> {
  if (!model) {
    throw new Error('Gemini API 未初始化')
  }

  const names = characterNames.join('、')
  const content = chapterContent.slice(0, 3000) // 限制内容长度节约token

  const prompt = `分析章节，找出角色信息。
章节：${chapterTitle}
已知角色：${names}
内容：${content}

返回JSON：{"appearances":["出场角色名"],"deaths":["死亡角色名"],"relationships":[{"char1":"角色1","char2":"角色2","relation":"关系"}]}`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  try {
    let jsonStr = text.trim()
    const match = jsonStr.match(/\{[\s\S]*\}/)
    if (match) jsonStr = match[0]
    const data = JSON.parse(jsonStr)
    return {
      appearances: data.appearances || [],
      deaths: data.deaths || [],
      relationships: data.relationships || []
    }
  } catch {
    return { appearances: [], deaths: [], relationships: [] }
  }
}

/**
 * 批量分析所有章节，生成完整角色档案更新
 * 节约token版：只传必要信息
 */
export async function analyzeAllChaptersForArchive(
  chapters: { title: string; content: string }[],
  characterNames: string[],
  onProgress?: (current: number, total: number) => void
): Promise<{
  characterUpdates: {
    name: string
    appearances: string[]
    isDead: boolean
    deathChapter: string
    relationships: { targetName: string; relation: string }[]
  }[]
}> {
  const characterMap: Record<string, {
    appearances: string[]
    isDead: boolean
    deathChapter: string
    relationships: Map<string, string>
  }> = {}

  // 初始化所有角色
  for (const name of characterNames) {
    characterMap[name] = {
      appearances: [],
      isDead: false,
      deathChapter: '',
      relationships: new Map()
    }
  }

  // 逐章分析
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    if (!chapter.content) continue

    onProgress?.(i + 1, chapters.length)

    const result = await analyzeChapterForCharacters(
      chapter.title,
      chapter.content,
      characterNames
    )

    // 更新出场记录
    for (const name of result.appearances) {
      if (characterMap[name]) {
        if (!characterMap[name].appearances.includes(chapter.title)) {
          characterMap[name].appearances.push(chapter.title)
        }
      }
    }

    // 更新死亡状态
    for (const name of result.deaths) {
      if (characterMap[name] && !characterMap[name].isDead) {
        characterMap[name].isDead = true
        characterMap[name].deathChapter = chapter.title
      }
    }

    // 更新关系
    for (const rel of result.relationships) {
      if (characterMap[rel.char1]) {
        characterMap[rel.char1].relationships.set(rel.char2, rel.relation)
      }
      if (characterMap[rel.char2]) {
        characterMap[rel.char2].relationships.set(rel.char1, rel.relation)
      }
    }
  }

  // 转换为输出格式
  const characterUpdates = Object.entries(characterMap).map(([name, data]) => ({
    name,
    appearances: data.appearances,
    isDead: data.isDead,
    deathChapter: data.deathChapter,
    relationships: Array.from(data.relationships.entries()).map(([targetName, relation]) => ({
      targetName,
      relation
    }))
  }))

  return { characterUpdates }
}

/**
 * 根据灵感生成书名建议
 */
export async function generateBookTitle(
  inspiration: string,
  genres: string[],
  count: number = 5
): Promise<string[]> {
  if (!model) {
    throw new Error('Gemini API 未初始化，请先在设置中配置 API Key')
  }

  const prompt = `你是一个资深的网文编辑，精通起点、番茄等平台的书名策划。

请根据以下灵感，生成${count}个有吸引力的书名。

【核心灵感】
${inspiration}

【题材标签】
${genres.join('、') || '未指定'}

要求：
1. 书名要简洁有力，2-8个字为宜
2. 要能引起读者好奇心
3. 符合网文平台的命名风格
4. 避免过于普通或烂大街的名字
5. 每个书名风格要有差异

请严格按照以下JSON格式返回（只返回纯JSON）：

{
  "titles": ["书名1", "书名2", "书名3", "书名4", "书名5"]
}

只返回JSON，不要有任何解释文字。`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  try {
    let jsonStr = text.trim()
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }
    const startIndex = jsonStr.indexOf('{')
    const endIndex = jsonStr.lastIndexOf('}')
    if (startIndex !== -1 && endIndex !== -1) {
      jsonStr = jsonStr.substring(startIndex, endIndex + 1)
    }

    const data = JSON.parse(jsonStr)
    return data.titles || []
  } catch (error) {
    console.error('Failed to parse title response:', error)
    return []
  }
}
