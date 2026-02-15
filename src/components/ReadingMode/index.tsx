import { useState, useEffect, useCallback } from 'react'
import { Button, Slider, Tooltip, Drawer, List, Typography, Segmented } from 'antd'
import {
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  MenuOutlined,
  FontSizeOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  BgColorsOutlined,
  ReadOutlined
} from '@ant-design/icons'
import type { Chapter, Volume } from '../../types'

const { Text } = Typography

interface ReadingModeProps {
  visible: boolean
  onClose: () => void
  currentChapter: Chapter | null
  chapters: Chapter[]
  volumes: Volume[]
  onChapterChange: (chapter: Chapter) => void
}

// 背景色主题配置
const THEME_OPTIONS = [
  { key: 'dark', label: '夜间', bg: '#0f0f1a', text: '#d0d0d0', title: '#e0e0e0' },
  { key: 'sepia', label: '羊皮纸', bg: '#f4ecd8', text: '#5b4636', title: '#3d2914' },
  { key: 'green', label: '护眼绿', bg: '#cce8cf', text: '#2d4a32', title: '#1a3d1f' },
  { key: 'light', label: '日间', bg: '#ffffff', text: '#333333', title: '#000000' },
  { key: 'gray', label: '灰色', bg: '#e8e8e8', text: '#444444', title: '#222222' }
]

// 将HTML内容转换为纯文本并保持段落格式
function htmlToReadableText(html: string): string {
  if (!html) return ''

  // 替换段落标签为换行
  let text = html
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '') // 移除其他HTML标签
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim()

  // 清理多余的空行
  text = text.replace(/\n{3,}/g, '\n\n')

  return text
}

function ReadingMode({
  visible,
  onClose,
  currentChapter,
  chapters,
  volumes,
  onChapterChange
}: ReadingModeProps) {
  const [fontSize, setFontSize] = useState(18)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showChapterList, setShowChapterList] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [theme, setTheme] = useState<string>('dark')
  const [dualPage, setDualPage] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  // 获取当前主题配置
  const currentTheme = THEME_OPTIONS.find(t => t.key === theme) || THEME_OPTIONS[0]

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      // 宽屏自动启用双栏模式（屏幕宽度 >= 1400px）
      if (window.innerWidth >= 1400 && !dualPage) {
        // 不自动开启，让用户手动选择
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [dualPage])

  // 获取排序后的所有章节
  const getSortedChapters = useCallback(() => {
    const sortedVolumes = [...volumes].sort((a, b) => a.order - b.order)
    const result: Chapter[] = []

    for (const volume of sortedVolumes) {
      const volumeChapters = chapters
        .filter(c => c.volumeId === volume.id)
        .sort((a, b) => a.order - b.order)
      result.push(...volumeChapters)
    }

    return result
  }, [chapters, volumes])

  // 获取当前章节在全书中的索引
  const getCurrentIndex = useCallback(() => {
    if (!currentChapter) return -1
    const sortedChapters = getSortedChapters()
    return sortedChapters.findIndex(c => c.id === currentChapter.id)
  }, [currentChapter, getSortedChapters])

  // 获取全书章节编号
  const getGlobalChapterNumber = useCallback((chapter: Chapter): number => {
    const sortedChapters = getSortedChapters()
    return sortedChapters.findIndex(c => c.id === chapter.id) + 1
  }, [getSortedChapters])

  // 获取章节所属的卷
  const getVolumeForChapter = useCallback((chapter: Chapter): Volume | undefined => {
    return volumes.find(v => v.id === chapter.volumeId)
  }, [volumes])

  // 上一章
  const handlePrevChapter = useCallback(() => {
    const sortedChapters = getSortedChapters()
    const currentIndex = getCurrentIndex()
    if (currentIndex > 0) {
      onChapterChange(sortedChapters[currentIndex - 1])
    }
  }, [getSortedChapters, getCurrentIndex, onChapterChange])

  // 下一章
  const handleNextChapter = useCallback(() => {
    const sortedChapters = getSortedChapters()
    const currentIndex = getCurrentIndex()
    if (currentIndex < sortedChapters.length - 1) {
      onChapterChange(sortedChapters[currentIndex + 1])
    }
  }, [getSortedChapters, getCurrentIndex, onChapterChange])

  // 退出阅读模式
  const handleClose = useCallback(() => {
    // 如果是全屏模式，先退出全屏
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        onClose()
      }).catch(() => {
        onClose()
      })
    } else {
      onClose()
    }
  }, [onClose])

  // 键盘快捷键
  useEffect(() => {
    if (!visible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        handlePrevChapter()
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        handleNextChapter()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [visible, handlePrevChapter, handleNextChapter, handleClose])

  // 监听滚动计算阅读进度
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.scrollHeight > target.clientHeight) {
        const progress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100
        setReadingProgress(Math.min(100, Math.max(0, progress)))
      }
    }

    const contentArea = document.getElementById('reading-content-area')
    if (contentArea) {
      contentArea.addEventListener('scroll', handleScroll)
      return () => contentArea.removeEventListener('scroll', handleScroll)
    }
  }, [visible, currentChapter])

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const sortedChapters = getSortedChapters()
  const currentIndex = getCurrentIndex()
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < sortedChapters.length - 1
  const currentVolume = currentChapter ? getVolumeForChapter(currentChapter) : null

  // 构建章节列表数据（按卷分组）
  const chapterListData = volumes
    .sort((a, b) => a.order - b.order)
    .map(volume => ({
      volume,
      chapters: chapters
        .filter(c => c.volumeId === volume.id)
        .sort((a, b) => a.order - b.order)
    }))

  // 如果不可见或没有章节，不渲染
  if (!visible || !currentChapter) return null

  const content = htmlToReadableText(currentChapter.content || '')
  const paragraphs = content.split('\n\n').filter(p => p.trim())

  // 双栏模式下分割段落
  const canUseDualPage = windowWidth >= 1200
  const midPoint = Math.ceil(paragraphs.length / 2)
  const leftParagraphs = dualPage && canUseDualPage ? paragraphs.slice(0, midPoint) : paragraphs
  const rightParagraphs = dualPage && canUseDualPage ? paragraphs.slice(midPoint) : []

  // 工具栏背景色（根据主题调整）
  const toolbarBg = theme === 'dark' ? '#16213e' : theme === 'light' ? '#f0f0f0' : theme === 'sepia' ? '#e8dcc8' : theme === 'green' ? '#b8d9bb' : '#d8d8d8'
  const toolbarBorder = theme === 'dark' ? '#0f3460' : '#cccccc'
  const toolbarText = theme === 'dark' ? '#9ca3af' : '#666666'

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: currentTheme.bg }}
    >
      {/* 顶部工具栏 */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ background: toolbarBg, borderColor: toolbarBorder }}
      >
        <div className="flex items-center gap-4">
          <Tooltip title="退出阅读模式 (Esc)">
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={handleClose}
              style={{ color: toolbarText }}
              className="hover:opacity-80"
            />
          </Tooltip>
          <Tooltip title="章节目录">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setShowChapterList(true)}
              style={{ color: toolbarText }}
              className="hover:opacity-80"
            />
          </Tooltip>
          <Tooltip title="阅读设置">
            <Button
              type="text"
              icon={<BgColorsOutlined />}
              onClick={() => setShowSettings(true)}
              style={{ color: toolbarText }}
              className="hover:opacity-80"
            />
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Text style={{ color: toolbarText }}>
            {currentVolume?.title} · 第{getGlobalChapterNumber(currentChapter)}章 {currentChapter.title}
          </Text>
        </div>

        <div className="flex items-center gap-2">
          {canUseDualPage && (
            <Tooltip title={dualPage ? '单栏模式' : '双栏模式'}>
              <Button
                type={dualPage ? 'primary' : 'text'}
                icon={<ReadOutlined />}
                onClick={() => setDualPage(!dualPage)}
                style={{ color: dualPage ? undefined : toolbarText }}
                className="hover:opacity-80"
              />
            </Tooltip>
          )}
          <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
            <Button
              type="text"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
              style={{ color: toolbarText }}
              className="hover:opacity-80"
            />
          </Tooltip>
        </div>
      </div>

      {/* 阅读进度条 */}
      <div className="h-1" style={{ background: theme === 'dark' ? '#1f2937' : '#e0e0e0' }}>
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-violet-600 transition-all duration-200"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* 内容区域 */}
      <div
        id="reading-content-area"
        className="flex-1 overflow-auto"
        style={{ background: currentTheme.bg }}
      >
        <div
          className={`mx-auto px-8 py-12 ${dualPage && canUseDualPage ? 'max-w-6xl' : 'max-w-3xl'}`}
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
        >
          {/* 章节标题 */}
          <h1
            className="text-center mb-8 font-bold"
            style={{ fontSize: `${fontSize + 8}px`, color: currentTheme.title }}
          >
            第{getGlobalChapterNumber(currentChapter)}章 {currentChapter.title}
          </h1>

          {/* 章节内容 */}
          {content ? (
            dualPage && canUseDualPage ? (
              // 双栏模式
              <div className="flex gap-12">
                <div className="flex-1" style={{ color: currentTheme.text }}>
                  {leftParagraphs.map((paragraph, index) => (
                    <p key={index} className="mb-6 indent-8">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div
                  className="w-px"
                  style={{ background: theme === 'dark' ? '#333' : '#ddd' }}
                />
                <div className="flex-1" style={{ color: currentTheme.text }}>
                  {rightParagraphs.map((paragraph, index) => (
                    <p key={index} className="mb-6 indent-8">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              // 单栏模式
              <div style={{ color: currentTheme.text }}>
                {paragraphs.map((paragraph, index) => (
                  <p key={index} className="mb-6 indent-8">
                    {paragraph}
                  </p>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-20" style={{ color: toolbarText }}>
              本章暂无内容
            </div>
          )}

          {/* 章节信息 */}
          <div
            className="mt-16 pt-8 border-t text-center text-sm"
            style={{ borderColor: theme === 'dark' ? '#333' : '#ddd', color: toolbarText }}
          >
            本章共 {currentChapter.wordCount || 0} 字
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <div
        className="flex items-center justify-between px-8 py-4 border-t"
        style={{ background: toolbarBg, borderColor: toolbarBorder }}
      >
        <Button
          type="primary"
          icon={<LeftOutlined />}
          onClick={handlePrevChapter}
          disabled={!hasPrev}
          size="large"
        >
          上一章
        </Button>

        <div style={{ color: toolbarText }} className="text-sm">
          {currentIndex + 1} / {sortedChapters.length}
          <span className="mx-2">·</span>
          使用 ← → 键或 PageUp/PageDown 翻页
        </div>

        <Button
          type="primary"
          icon={<RightOutlined />}
          onClick={handleNextChapter}
          disabled={!hasNext}
          size="large"
          iconPosition="end"
        >
          下一章
        </Button>
      </div>

      {/* 章节目录抽屉 */}
      <Drawer
        title="章节目录"
        placement="left"
        onClose={() => setShowChapterList(false)}
        open={showChapterList}
        width={350}
        styles={{
          body: { padding: 0, background: '#16213e' },
          header: { background: '#16213e', borderBottom: '1px solid #0f3460', color: '#fff' }
        }}
      >
        <div className="h-full overflow-auto" style={{ background: '#16213e' }}>
          {chapterListData.map(({ volume, chapters: volChapters }) => (
            <div key={volume.id} className="mb-4">
              <div
                className="px-4 py-2 font-medium text-purple-400 sticky top-0"
                style={{ background: '#16213e' }}
              >
                {volume.title}
              </div>
              <List
                dataSource={volChapters}
                renderItem={(chapter) => {
                  const isActive = chapter.id === currentChapter?.id
                  const globalNum = getGlobalChapterNumber(chapter)
                  const hasContent = chapter.content && chapter.wordCount > 0

                  return (
                    <List.Item
                      className={`cursor-pointer px-4 py-2 border-none ${
                        isActive ? 'bg-purple-500/20' : 'hover:bg-white/5'
                      }`}
                      onClick={() => {
                        onChapterChange(chapter)
                        setShowChapterList(false)
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={isActive ? 'text-purple-400' : 'text-gray-300'}>
                          第{globalNum}章 {chapter.title}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {hasContent ? `${chapter.wordCount}字` : '未写'}
                        </span>
                      </div>
                    </List.Item>
                  )
                }}
              />
            </div>
          ))}
        </div>
      </Drawer>

      {/* 阅读设置抽屉 */}
      <Drawer
        title="阅读设置"
        placement="right"
        onClose={() => setShowSettings(false)}
        open={showSettings}
        width={320}
        styles={{
          body: { background: '#16213e' },
          header: { background: '#16213e', borderBottom: '1px solid #0f3460', color: '#fff' }
        }}
      >
        <div className="space-y-6">
          {/* 字体大小 */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-gray-300">
              <FontSizeOutlined />
              <span>字体大小</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-sm">小</span>
              <Slider
                min={14}
                max={32}
                value={fontSize}
                onChange={setFontSize}
                className="flex-1"
              />
              <span className="text-gray-500 text-sm">大</span>
            </div>
            <div className="text-center text-gray-400 mt-2">{fontSize}px</div>
          </div>

          {/* 背景颜色 */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-gray-300">
              <BgColorsOutlined />
              <span>背景颜色</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {THEME_OPTIONS.map(t => (
                <Tooltip key={t.key} title={t.label}>
                  <div
                    className={`w-12 h-12 rounded-lg cursor-pointer border-2 transition-all ${
                      theme === t.key ? 'border-purple-500 scale-110' : 'border-transparent'
                    }`}
                    style={{ background: t.bg }}
                    onClick={() => setTheme(t.key)}
                  />
                </Tooltip>
              ))}
            </div>
          </div>

          {/* 阅读模式 */}
          {canUseDualPage && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-gray-300">
                <ReadOutlined />
                <span>阅读模式</span>
              </div>
              <Segmented
                block
                value={dualPage ? 'dual' : 'single'}
                onChange={(val) => setDualPage(val === 'dual')}
                options={[
                  { label: '单栏', value: 'single' },
                  { label: '双栏', value: 'dual' }
                ]}
              />
              <div className="text-gray-500 text-xs mt-2">
                屏幕宽度 ≥ 1200px 时可使用双栏模式
              </div>
            </div>
          )}

          {/* 快捷键说明 */}
          <div className="pt-4 border-t border-gray-700">
            <div className="text-gray-400 text-sm mb-2">快捷键</div>
            <div className="space-y-1 text-gray-500 text-xs">
              <div>← / PageUp：上一章</div>
              <div>→ / PageDown：下一章</div>
              <div>Esc：退出阅读模式</div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}

export default ReadingMode
