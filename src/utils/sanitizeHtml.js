import DOMPurify from 'dompurify';

// Matches the output of RichTextEditor.jsx's toolbar (bold/italic/underline/
// strikethrough/color via document.execCommand) — nothing beyond inline
// formatting is ever authored, so nothing beyond it needs to survive here.
const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'sub', 'sup', 'br', 'span', 'font', 'div', 'p'];
const ALLOWED_ATTR = ['style', 'color'];

export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html ?? '', { ALLOWED_TAGS, ALLOWED_ATTR });
}
