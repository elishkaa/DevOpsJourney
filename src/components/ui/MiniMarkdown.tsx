import type { ReactNode } from 'react'

/**
 * Tiny first-party markdown renderer for challenge content.
 * Supports: paragraphs, **bold**, `inline code`, ```fenced blocks```, "- " lists.
 * Renders text nodes only — never innerHTML.
 */

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  // split on `code` first, then **bold** inside the plain parts
  const codeParts = text.split(/(`[^`]+`)/g)
  codeParts.forEach((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      out.push(
        <code key={`${keyBase}-c${i}`} className="mono rounded bg-raised px-1.5 py-0.5 text-[0.85em] text-brand">
          {part.slice(1, -1)}
        </code>,
      )
      return
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g)
    boldParts.forEach((bp, j) => {
      if (bp.startsWith('**') && bp.endsWith('**') && bp.length > 4) {
        out.push(
          <strong key={`${keyBase}-b${i}-${j}`} className="font-semibold text-ink">
            {bp.slice(2, -2)}
          </strong>,
        )
      } else if (bp.length > 0) {
        out.push(bp)
      }
    })
  })
  return out
}

function renderTextBlock(block: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const paragraphs = block.split(/\n{2,}/)
  paragraphs.forEach((para, pi) => {
    const lines = para.split('\n').filter((l) => l.length > 0)
    if (lines.length === 0) return
    const isList = lines.every((l) => l.trimStart().startsWith('- '))
    if (isList) {
      nodes.push(
        <ul key={`${keyBase}-ul${pi}`} className="my-2 list-disc space-y-1 pl-5">
          {lines.map((l, li) => (
            <li key={li}>{inline(l.trimStart().slice(2), `${keyBase}-li${pi}-${li}`)}</li>
          ))}
        </ul>,
      )
    } else {
      nodes.push(
        <p key={`${keyBase}-p${pi}`} className="my-2 leading-relaxed">
          {inline(lines.join(' '), `${keyBase}-pi${pi}`)}
        </p>,
      )
    }
  })
  return nodes
}

export default function MiniMarkdown({ text, className = '' }: { text: string; className?: string }) {
  const nodes: ReactNode[] = []
  const segments = text.split(/```(?:\w+)?\n?/)
  segments.forEach((seg, i) => {
    if (i % 2 === 1) {
      // fenced code block
      nodes.push(
        <pre
          key={`code-${i}`}
          className="mono my-3 overflow-x-auto rounded-lg border border-line bg-base p-3 text-[13px] leading-relaxed"
        >
          {seg.replace(/\n$/, '')}
        </pre>,
      )
    } else if (seg.trim().length > 0) {
      nodes.push(...renderTextBlock(seg, `t${i}`))
    }
  })
  return <div className={className}>{nodes}</div>
}
