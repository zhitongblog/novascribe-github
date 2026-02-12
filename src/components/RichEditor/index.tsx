import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { Button, Tooltip, Divider } from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  HighlightOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  UndoOutlined,
  RedoOutlined
} from '@ant-design/icons'

interface RichEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
}

function RichEditor({
  content,
  onChange,
  placeholder = '开始写作...',
  editable = true
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Placeholder.configure({
        placeholder
      }),
      CharacterCount,
      Highlight.configure({
        multicolor: true
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Underline
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-invert max-w-none focus:outline-none'
      }
    }
  })

  // 同步外部内容变化
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    icon,
    title
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    icon: React.ReactNode
    title: string
  }) => (
    <Tooltip title={title}>
      <Button
        type={isActive ? 'primary' : 'text'}
        size="small"
        icon={icon}
        onClick={onClick}
        disabled={disabled}
        className={isActive ? '' : 'text-dark-muted hover:text-dark-text'}
      />
    </Tooltip>
  )

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      {editable && (
        <div
          className="flex items-center gap-1 p-2 border-b border-dark-border bg-dark-card"
          style={{ flexWrap: 'wrap' }}
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            icon={<BoldOutlined />}
            title="加粗 (Ctrl+B)"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            icon={<ItalicOutlined />}
            title="斜体 (Ctrl+I)"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            icon={<UnderlineOutlined />}
            title="下划线 (Ctrl+U)"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            icon={<StrikethroughOutlined />}
            title="删除线"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            icon={<HighlightOutlined />}
            title="高亮"
          />

          <Divider type="vertical" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            icon={<UnorderedListOutlined />}
            title="无序列表"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            icon={<OrderedListOutlined />}
            title="有序列表"
          />

          <Divider type="vertical" />

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            icon={<AlignLeftOutlined />}
            title="左对齐"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            icon={<AlignCenterOutlined />}
            title="居中"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            icon={<AlignRightOutlined />}
            title="右对齐"
          />

          <Divider type="vertical" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            icon={<UndoOutlined />}
            title="撤销 (Ctrl+Z)"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            icon={<RedoOutlined />}
            title="重做 (Ctrl+Y)"
          />

          {/* 字数统计 */}
          <div className="ml-auto text-dark-muted text-sm">
            {editor.storage.characterCount.characters()} 字
          </div>
        </div>
      )}

      {/* 编辑区域 */}
      <div className="flex-1 overflow-auto p-4 bg-dark-bg">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  )
}

export default RichEditor
