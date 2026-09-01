import { useEffect, useMemo, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { Bold, Italic, List, Code, Link2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotesChangePayload {
  content: any
  contentText: string
}

interface NotesEditorProps {
  value?: any
  onChange?: (payload: NotesChangePayload) => void
}

export function NotesEditor({ value, onChange }: NotesEditorProps) {
  const pendingLocalRef = useRef(false)

  const content = useMemo(() => {
    if (!value) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'object' && Object.keys(value).length > 0) return value
    return ''
  }, [value])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Add architecture documentation and description notes here…',
        emptyNodeClass: 'is-editor-empty',
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-white underline underline-offset-4 font-semibold',
        },
      }),
    ],
    content: content || undefined,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none text-[13px] leading-relaxed text-[#a1a1aa] min-h-[120px]',
      },
    },
    onUpdate: ({ editor }) => {
      const nextContent = editor.getJSON()
      const nextText = editor.getText()
      pendingLocalRef.current = true
      onChange?.({ content: nextContent, contentText: nextText })
    },
  })

  // Apply external (remote) updates without breaking caret on local typing.
  useEffect(() => {
    if (!editor) return
    if (!content) return
    if (pendingLocalRef.current) {
      pendingLocalRef.current = false
      return
    }
    editor.commands.setContent(content, false)
  }, [content, editor])

  const toggleBold = () => editor?.chain().focus().toggleBold().run()
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run()
  const toggleCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run()
  const toggleLink = () => {
    const url = window.prompt('Enter documentation URL')
    if (!url) return
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="border-t border-white/[0.05] bg-[#0d0d10]">
      {/* Editor toolbar */}
      <div className="h-10 border-b border-white/[0.05] bg-[#0a0a0d] flex items-center px-4 justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[#52525b]" />
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">Architecture Notes</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleBold}
            className="p-1.5 rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-colors"
            disabled={!editor}
            aria-label="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleItalic}
            className="p-1.5 rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-colors"
            disabled={!editor}
            aria-label="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleBulletList}
            className="p-1.5 rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-colors"
            disabled={!editor}
            aria-label="Bullet list"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleCodeBlock}
            className="p-1.5 rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-colors"
            disabled={!editor}
            aria-label="Code block"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleLink}
            className="p-1.5 rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-colors"
            disabled={!editor}
            aria-label="Link"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor surface */}
      <div className="p-4 bg-[#0d0d10]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
