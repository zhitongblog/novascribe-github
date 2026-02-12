import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '../stores/editor'
import { useProjectStore } from '../stores/project'

/**
 * 自动保存 Hook
 * @param delay 延迟时间（毫秒），默认2秒
 */
export function useAutoSave(delay: number = 2000) {
  const { content, isModified, setSaving, setLastSavedAt } = useEditorStore()
  const { currentChapter, updateChapter } = useProjectStore()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const contentRef = useRef(content)

  // 保持内容引用最新
  contentRef.current = content

  const save = useCallback(async () => {
    if (!currentChapter || !isModified) return

    setSaving(true)
    try {
      await updateChapter(currentChapter.id, { content: contentRef.current })
      setLastSavedAt(new Date().toISOString())
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setSaving(false)
    }
  }, [currentChapter, isModified, updateChapter, setSaving, setLastSavedAt])

  // 内容变化时触发延迟保存
  useEffect(() => {
    if (!isModified) return

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      save()
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, isModified, delay, save])

  // 组件卸载时保存
  useEffect(() => {
    return () => {
      if (isModified && currentChapter) {
        // 同步保存
        updateChapter(currentChapter.id, { content: contentRef.current })
      }
    }
  }, [])

  return { save }
}

export default useAutoSave
