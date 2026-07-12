import { useRef, useCallback, useEffect } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Eraser, Palette,
} from 'lucide-react';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

/**
 * RichTextEditor — Mini contenteditable editor with formatting toolbar.
 *
 * Value is stored as an HTML string. Use `dangerouslySetInnerHTML`
 * when displaying in exam view.
 *
 * Props:
 *   value        {string}   HTML string (may be plain text for backward compat)
 *   onChange     {fn}       called with new HTML string on every change
 *   placeholder  {string}
 *   minHeight    {number}   px, default 80
 *   className    {string}   extra class on wrapper
 *   hasError     {boolean}
 */

const PRESET_COLORS = [
  { hex: '#1e293b', label: 'Đen'    },
  { hex: '#ef4444', label: 'Đỏ'     },
  { hex: '#f97316', label: 'Cam'    },
  { hex: '#eab308', label: 'Vàng'   },
  { hex: '#16a34a', label: 'Xanh lá'},
  { hex: '#2563eb', label: 'Xanh dương'},
  { hex: '#7c3aed', label: 'Tím'    },
  { hex: '#db2777', label: 'Hồng'   },
];

const execCmd = (cmd, value = null) => {
  document.execCommand(cmd, false, value);
};

const ToolbarBtn = ({ title, active, onClick, children }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all ${
      active
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-inner'
        : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-slate-100'
    }`}
  >
    {children}
  </button>
);

export const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  minHeight = 80,
  className = '',
  hasError = false,
}) => {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

  /* Sync external value changes into the DOM (only when value differs) */
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    // Avoid re-setting HTML during user typing (causes cursor jump)
    if (el.innerHTML !== value) {
      isInternalChange.current = true;
      el.innerHTML = sanitizeHtml(value);
      isInternalChange.current = false;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isInternalChange.current) return;
    onChange?.(editorRef.current.innerHTML);
  }, [onChange]);

  const applyColor = useCallback((hex) => {
    editorRef.current?.focus();
    execCmd('foreColor', hex);
    handleInput();
  }, [handleInput]);

  const isEmpty = !value || value === '<br>' || value === '' || value.replace(/<[^>]*>/g, '').trim() === '';

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all ${hasError ? 'border-red-400 dark:border-red-700' : 'border-gray-200 dark:border-slate-600 focus-within:border-indigo-400 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'} ${className}`}>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600 flex-wrap">
        <ToolbarBtn title="In đậm (Ctrl+B)" onClick={() => execCmd('bold')}>
          <Bold className="w-3.5 h-3.5" strokeWidth={2.5} />
        </ToolbarBtn>
        <ToolbarBtn title="In nghiêng (Ctrl+I)" onClick={() => execCmd('italic')}>
          <Italic className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Gạch dưới (Ctrl+U)" onClick={() => execCmd('underline')}>
          <Underline className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Gạch ngang" onClick={() => execCmd('strikeThrough')}>
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarBtn>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-200 dark:bg-slate-600 mx-1 flex-shrink-0" />

        {/* Color swatches */}
        <div className="flex items-center gap-0.5 relative group">
          <button
            type="button"
            title="Màu chữ"
            className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all text-xs font-bold"
            onMouseDown={(e) => e.preventDefault()}
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          {/* Color popover */}
          <div className="absolute top-full left-0 z-20 mt-1 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700/60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 flex gap-1.5 flex-wrap w-40">
            {PRESET_COLORS.map(({ hex, label }) => (
              <button
                key={hex}
                type="button"
                title={label}
                onMouseDown={(e) => { e.preventDefault(); applyColor(hex); }}
                className="w-6 h-6 rounded-lg border-2 border-white shadow-sm hover:scale-110 transition-transform flex-shrink-0"
                style={{ background: hex }}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-200 dark:bg-slate-600 mx-1 flex-shrink-0" />

        <ToolbarBtn title="Xoá định dạng" onClick={() => { execCmd('removeFormat'); execCmd('unlink'); handleInput(); }}>
          <Eraser className="w-3.5 h-3.5" />
        </ToolbarBtn>
      </div>

      {/* ── Editor area ── */}
      <div className="relative">
        {/* Placeholder */}
        {isEmpty && (
          <div
            className="absolute inset-0 px-4 py-3 text-sm text-gray-300 dark:text-slate-600 pointer-events-none select-none leading-relaxed"
            aria-hidden
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              if (e.shiftKey) {
                // Shift+Tab: try to remove leading spaces from current selection
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  const range = sel.getRangeAt(0);
                  const node = range.startContainer;
                  if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    const offset = range.startOffset;
                    // Check if there are 4 spaces before the cursor
                    const before = text.substring(0, offset);
                    const spaces = '    ';
                    if (before.endsWith(spaces)) {
                      node.textContent = text.substring(0, offset - 4) + text.substring(offset);
                      range.setStart(node, offset - 4);
                      range.setEnd(node, offset - 4);
                      sel.removeAllRanges();
                      sel.addRange(range);
                      handleInput();
                    }
                  }
                }
              } else {
                // Tab: insert 4 spaces
                document.execCommand('insertText', false, '    ');
                handleInput();
              }
            }
          }}
          spellCheck={false}
          className="w-full text-sm text-gray-800 dark:text-slate-100 px-4 py-3 outline-none leading-relaxed"
          style={{ minHeight: `${minHeight}px`, wordBreak: 'break-word' }}
        />
      </div>
    </div>
  );
};
