import { create } from 'zustand'

interface EditorState {
  // 编辑器状态
  content: string
  wordCount: number
  isModified: boolean
  isSaving: boolean
  lastSavedAt: string | null

  // AI 状态
  isAiGenerating: boolean
  aiProgress: number
  aiMessage: string

  // 自动续写模式
  autoWriteMode: boolean
  autoWriteInterval: number // 毫秒

  // Actions
  setContent: (content: string) => void
  setWordCount: (count: number) => void
  setModified: (modified: boolean) => void
  setSaving: (saving: boolean) => void
  setLastSavedAt: (time: string) => void

  // AI Actions
  setAiGenerating: (generating: boolean) => void
  setAiProgress: (progress: number) => void
  setAiMessage: (message: string) => void

  // 自动续写
  toggleAutoWrite: () => void
  setAutoWriteInterval: (interval: number) => void

  // 重置
  reset: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  content: '',
  wordCount: 0,
  isModified: false,
  isSaving: false,
  lastSavedAt: null,
  isAiGenerating: false,
  aiProgress: 0,
  aiMessage: '',
  autoWriteMode: false,
  autoWriteInterval: 30000, // 默认30秒

  setContent: (content: string) => {
    const wordCount = content.replace(/\s/g, '').length
    set({ content, wordCount, isModified: true })
  },

  setWordCount: (wordCount: number) => set({ wordCount }),

  setModified: (isModified: boolean) => set({ isModified }),

  setSaving: (isSaving: boolean) => set({ isSaving }),

  setLastSavedAt: (lastSavedAt: string) => set({ lastSavedAt, isModified: false }),

  setAiGenerating: (isAiGenerating: boolean) => set({ isAiGenerating }),

  setAiProgress: (aiProgress: number) => set({ aiProgress }),

  setAiMessage: (aiMessage: string) => set({ aiMessage }),

  toggleAutoWrite: () => set({ autoWriteMode: !get().autoWriteMode }),

  setAutoWriteInterval: (autoWriteInterval: number) => set({ autoWriteInterval }),

  reset: () =>
    set({
      content: '',
      wordCount: 0,
      isModified: false,
      isSaving: false,
      lastSavedAt: null,
      isAiGenerating: false,
      aiProgress: 0,
      aiMessage: '',
      autoWriteMode: false
    })
}))
