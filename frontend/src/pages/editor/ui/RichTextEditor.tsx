import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

type Props = {
  initialBody?: string | null
  onChange: (body: string) => void
  label?: string
}

function initialContent(body?: string | null) {
  if (!body) return { type: 'doc', content: [{ type: 'paragraph' }] }
  try {
    const value = JSON.parse(body) as {
      version?: number
      type?: string
      content?: unknown
    }
    if (value.version === 1 && value.type === 'doc' && Array.isArray(value.content))
      return { type: 'doc', content: value.content }
  } catch {
    /* existing plain text is supported when reopened */
  }
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }],
  }
}

export function RichTextEditor({ initialBody, onChange, label = 'Article text' }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        horizontalRule: false,
        heading: { levels: [1, 2, 3] },
      }),
    ],
    content: initialContent(initialBody),
    editorProps: { attributes: { 'aria-label': label } },
    onUpdate({ editor }) {
      onChange(JSON.stringify({ version: 1, ...editor.getJSON() }))
    },
  })
  if (!editor) return <p role="status">Loading editor…</p>
  const action = (label: string, active: boolean, run: () => void) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={run}
      className={`rounded-lg px-3 py-2 text-sm font-semibold ${active ? 'bg-hub-lilac' : 'hover:bg-hub-surface'}`}
    >
      {label}
    </button>
  )
  return (
    <div className="rounded-2xl border border-hub-line bg-hub-page">
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex flex-wrap gap-1 border-b border-hub-line p-2"
      >
        {action('Bold', editor.isActive('bold'), () =>
          editor.chain().focus().toggleBold().run(),
        )}
        {action('Italic', editor.isActive('italic'), () =>
          editor.chain().focus().toggleItalic().run(),
        )}
        {action('Heading', editor.isActive('heading', { level: 2 }), () =>
          editor.chain().focus().toggleHeading({ level: 2 }).run(),
        )}
        {action('Bullet list', editor.isActive('bulletList'), () =>
          editor.chain().focus().toggleBulletList().run(),
        )}
      </div>
      <EditorContent
        editor={editor}
        aria-label={label}
        className="min-h-64 px-5 py-4 leading-8 [&_.ProseMirror]:min-h-56 [&_.ProseMirror]:outline-none [&_h2]:font-hub-display [&_h2]:text-2xl [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  )
}
