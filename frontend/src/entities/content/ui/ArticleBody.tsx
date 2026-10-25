import type { ReactNode } from 'react'

type Node = {
  type?: string
  text?: string
  attrs?: { level?: number; href?: string }
  marks?: Array<{ type: string; attrs?: { href?: string } }>
  content?: Node[]
}

function richNode(node: Node, key: number): ReactNode {
  if (node.type === 'text') {
    let value: ReactNode = node.text ?? ''
    for (const mark of node.marks ?? []) {
      if (mark.type === 'bold') value = <strong key={key}>{value}</strong>
      if (mark.type === 'italic') value = <em key={key}>{value}</em>
      if (mark.type === 'strike') value = <s key={key}>{value}</s>
      if (mark.type === 'code') value = <code key={key}>{value}</code>
      if (mark.type === 'link') {
        try {
          const url = new URL(mark.attrs?.href ?? '')
          if (url.protocol === 'http:' || url.protocol === 'https:')
            value = (
              <a
                key={key}
                href={url.href}
                rel="noopener noreferrer"
                target="_blank"
                className="underline"
              >
                {value}
              </a>
            )
        } catch {
          /* Ignore invalid stored links. */
        }
      }
    }
    return value
  }
  const children = node.content?.map(richNode) ?? []
  switch (node.type) {
    case 'paragraph':
      return <p key={key}>{children}</p>
    case 'heading':
      return node.attrs?.level === 3 ? (
        <h3 key={key} className="font-hub-display text-xl font-semibold">
          {children}
        </h3>
      ) : (
        <h2 key={key} className="font-hub-display text-2xl font-semibold">
          {children}
        </h2>
      )
    case 'bulletList':
      return (
        <ul key={key} className="list-disc pl-6">
          {children}
        </ul>
      )
    case 'orderedList':
      return (
        <ol key={key} className="list-decimal pl-6">
          {children}
        </ol>
      )
    case 'listItem':
      return <li key={key}>{children}</li>
    case 'blockquote':
      return (
        <blockquote key={key} className="border-l-4 border-hub-lilac pl-5 italic">
          {children}
        </blockquote>
      )
    case 'hardBreak':
      return <br key={key} />
    default:
      return null
  }
}

export function ArticleBody({ body }: { body?: string | null }) {
  if (!body) return <p className="text-hub-muted">No text is available for this story.</p>
  let content: Node[] | null = null
  try {
    const value = JSON.parse(body) as {
      version?: number
      type?: string
      content?: Node[]
    }
    if (value.version === 1 && value.type === 'doc' && Array.isArray(value.content))
      content = value.content
  } catch {
    /* Legacy articles use plain text. */
  }
  if (content) return <>{content.map(richNode)}</>
  return (
    <>
      {body
        .split(/\n\s*\n|\n/)
        .filter(Boolean)
        .map((part, index) => (
          <p key={index} className="whitespace-pre-wrap">
            {part}
          </p>
        ))}
    </>
  )
}
