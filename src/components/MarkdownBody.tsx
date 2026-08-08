import { useMemo } from 'react';
import { marked } from 'marked';

// Configure marked
marked.setOptions({ breaks: true, gfm: true });

// Basic sanitizer — strip dangerous attributes/tags
function sanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

interface MarkdownBodyProps {
  content: string;
  accent?: string;
}

export function MarkdownBody({ content, accent = '#1bca8e' }: MarkdownBodyProps) {
  const html = useMemo(() => {
    const raw = marked.parse(content) as string;
    return sanitize(raw);
  }, [content]);

  return (
    <>
      <style>{`
        .md-body { font-family: 'DM Sans', sans-serif; font-size: 14px; line-height: 1.75; color: var(--text-secondary); word-break: break-word; }
        .md-body h1, .md-body h2, .md-body h3, .md-body h4 {
          font-family: 'Syne', sans-serif; font-weight: 700; color: var(--text-primary);
          margin: 1.4em 0 0.5em; line-height: 1.2;
        }
        .md-body h1 { font-size: 1.5em; }
        .md-body h2 { font-size: 1.25em; }
        .md-body h3 { font-size: 1.1em; }
        .md-body h4 { font-size: 1em; }
        .md-body p { margin: 0.75em 0; }
        .md-body a { color: ${accent}; text-decoration: none; font-weight: 500; }
        .md-body a:hover { text-decoration: underline; }
        .md-body img { max-width: 100%; border-radius: 10px; margin: 0.5em 0; display: block; }
        .md-body ul, .md-body ol { padding-left: 1.4em; margin: 0.6em 0; }
        .md-body li { margin: 0.25em 0; }
        .md-body blockquote {
          margin: 0.75em 0; padding: 8px 14px;
          border-left: 3px solid ${accent}60;
          background: ${accent}08; border-radius: 0 8px 8px 0;
          color: var(--text-muted); font-style: italic;
        }
        .md-body code {
          font-family: 'DM Mono', monospace; font-size: 0.85em;
          background: var(--surface); border: 1px solid var(--border);
          padding: 1px 5px; border-radius: 4px; color: var(--text-primary);
        }
        .md-body pre {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 10px; padding: 12px 14px; overflow-x: auto;
          margin: 0.75em 0;
        }
        .md-body pre code { background: none; border: none; padding: 0; font-size: 0.82em; }
        .md-body table { width: 100%; border-collapse: collapse; margin: 0.75em 0; font-size: 0.9em; }
        .md-body th { background: var(--surface); font-weight: 600; color: var(--text-primary); }
        .md-body td, .md-body th { padding: 7px 10px; border: 1px solid var(--border); text-align: left; }
        .md-body hr { border: none; border-top: 1px solid var(--border); margin: 1.2em 0; }
        .md-body strong { font-weight: 600; color: var(--text-primary); }
        .md-body em { font-style: italic; }
      `}</style>
      <div
        className="md-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
