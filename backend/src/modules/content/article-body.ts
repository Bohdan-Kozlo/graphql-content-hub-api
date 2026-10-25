import { BadRequestException } from '@nestjs/common';

type RichNode = { type?: unknown; text?: unknown; attrs?: unknown; marks?: unknown; content?: unknown };
const blocks = new Set(['doc', 'paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote']);
const leaves = new Set(['text', 'hardBreak']);
const marks = new Set(['bold', 'italic', 'strike', 'code', 'link']);

function validNode(value: unknown, depth = 0): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value) || depth > 20) return false;
  const node = value as RichNode;
  if (typeof node.type !== 'string' || (!blocks.has(node.type) && !leaves.has(node.type))) return false;
  const keys = Object.keys(node);
  if (keys.some((key) => !['type', 'text', 'attrs', 'marks', 'content'].includes(key))) return false;
  if (node.type === 'text') {
    if (
      typeof node.text !== 'string' ||
      node.text.length === 0 ||
      node.content !== undefined ||
      node.attrs !== undefined
    )
      return false;
    if (
      node.marks !== undefined &&
      (!Array.isArray(node.marks) || node.marks.some((mark: unknown) => !validMark(mark)))
    )
      return false;
    return true;
  }
  if (node.text !== undefined || node.marks !== undefined) return false;
  if (node.type === 'hardBreak') return node.attrs === undefined && node.content === undefined;
  if (node.type === 'heading') {
    if (!node.attrs || typeof node.attrs !== 'object' || Array.isArray(node.attrs)) return false;
    const attrs = node.attrs as Record<string, unknown>;
    if (Object.keys(attrs).length !== 1 || ![1, 2, 3].includes(attrs.level as number)) return false;
  } else if (node.attrs !== undefined) return false;
  if (node.content === undefined) return true;
  return (
    Array.isArray(node.content) &&
    node.content.length <= 1000 &&
    node.content.every((child: unknown) => validNode(child, depth + 1))
  );
}

function validMark(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const mark = value as { type?: unknown; attrs?: unknown };
  if (typeof mark.type !== 'string' || !marks.has(mark.type)) return false;
  if (mark.type !== 'link') return Object.keys(mark).length === 1;
  if (!mark.attrs || typeof mark.attrs !== 'object' || Array.isArray(mark.attrs)) return false;
  const attrs = mark.attrs as Record<string, unknown>;
  if (Object.keys(attrs).some((key) => !['href', 'target', 'rel', 'class'].includes(key))) return false;
  if (typeof attrs.href !== 'string') return false;
  try {
    return ['http:', 'https:'].includes(new URL(attrs.href).protocol);
  } catch {
    return false;
  }
}

export function validateArticleBody(body: string | undefined): void {
  if (!body || body.length > 200_000) throw new BadRequestException('Article body is required');
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new BadRequestException('Invalid article body');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new BadRequestException('Invalid article body');
  const document = parsed as { version?: unknown; type?: unknown; content?: unknown };
  if (
    Object.keys(document).some((key) => !['version', 'type', 'content'].includes(key)) ||
    document.version !== 1 ||
    document.type !== 'doc' ||
    !Array.isArray(document.content) ||
    !validNode({ type: 'doc', content: document.content })
  ) {
    throw new BadRequestException('Invalid article body');
  }
}

export function validatePublishableArticleBody(body: string | undefined): void {
  validateArticleBody(body);
  const document = JSON.parse(body!) as { content: RichNode[] };
  function hasText(node: RichNode): boolean {
    if (typeof node.text === 'string' && node.text.trim()) return true;
    return Array.isArray(node.content) && node.content.some((child: RichNode) => hasText(child));
  }
  if (!document.content.some(hasText)) throw new BadRequestException('Article text is required before publishing');
}
