'use client';

import React from 'react';

interface BlogContentRendererProps {
  content: string;
  className?: string;
}

function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold + Italic
    const boldItalicMatch = remaining.match(/\*\*\*(.+?)\*\*\*/);
    if (boldItalicMatch && boldItalicMatch.index !== undefined) {
      if (boldItalicMatch.index > 0) {
        nodes.push(remaining.slice(0, boldItalicMatch.index));
      }
      nodes.push(
        <strong key={key++} className="font-black">
          <em>{boldItalicMatch[1]}</em>
        </strong>
      );
      remaining = remaining.slice(boldItalicMatch.index + boldItalicMatch[0].length);
      continue;
    }

    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        nodes.push(remaining.slice(0, boldMatch.index));
      }
      nodes.push(<strong key={key++} className="font-bold text-foreground">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        nodes.push(remaining.slice(0, italicMatch.index));
      }
      nodes.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        nodes.push(remaining.slice(0, codeMatch.index));
      }
      nodes.push(
        <code key={key++} className="bg-secondary text-accent px-1.5 py-0.5 rounded-md text-sm font-mono">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    // Links [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch && linkMatch.index !== undefined) {
      if (linkMatch.index > 0) {
        nodes.push(remaining.slice(0, linkMatch.index));
      }
      nodes.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors font-medium"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch.index + linkMatch[0].length);
      continue;
    }

    nodes.push(remaining);
    break;
  }

  return nodes;
}

function renderLine(line: string, index: number): React.ReactNode {
  // Headings
  if (line.startsWith('### ')) {
    return (
      <h3 key={index} className="text-xl font-black tracking-tight text-foreground mt-10 mb-4">
        {parseInline(line.slice(4))}
      </h3>
    );
  }
  if (line.startsWith('## ')) {
    return (
      <h2 key={index} className="text-2xl font-black tracking-tight text-foreground mt-12 mb-4">
        {parseInline(line.slice(3))}
      </h2>
    );
  }
  if (line.startsWith('# ')) {
    return (
      <h1 key={index} className="text-3xl font-black tracking-tighter text-foreground mt-14 mb-5">
        {parseInline(line.slice(2))}
      </h1>
    );
  }

  // Blockquote
  if (line.startsWith('> ')) {
    return (
      <blockquote
        key={index}
        className="border-l-3 border-accent pl-5 py-2 my-6 text-muted-foreground italic text-lg leading-relaxed"
        style={{ borderLeftWidth: '3px' }}
      >
        {parseInline(line.slice(2))}
      </blockquote>
    );
  }

  // Horizontal rule
  if (line.match(/^(-{3,}|_{3,}|\*{3,})$/)) {
    return <hr key={index} className="my-8 border-border" />;
  }

  // Image ![alt](url)
  const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (imgMatch) {
    return (
      <figure key={index} className="my-8">
        <div className="rounded-2xl overflow-hidden shadow-lg border border-border">
          <img
            src={imgMatch[2]}
            alt={imgMatch[1]}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
        {imgMatch[1] && (
          <figcaption className="text-center text-xs text-muted-foreground mt-3 font-medium">
            {imgMatch[1]}
          </figcaption>
        )}
      </figure>
    );
  }

  // Unordered list
  if (line.match(/^[-*]\s/)) {
    return (
      <li key={index} className="flex items-start gap-2.5 text-base leading-relaxed text-foreground/85 ml-1">
        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 shrink-0" />
        <span>{parseInline(line.replace(/^[-*]\s/, ''))}</span>
      </li>
    );
  }

  // Ordered list
  const olMatch = line.match(/^(\d+)\.\s/);
  if (olMatch) {
    return (
      <li key={index} className="flex items-start gap-2.5 text-base leading-relaxed text-foreground/85 ml-1">
        <span className="text-accent font-bold text-sm mt-0.5 shrink-0 min-w-[1.25rem]">{olMatch[1]}.</span>
        <span>{parseInline(line.replace(/^\d+\.\s/, ''))}</span>
      </li>
    );
  }

  // Empty line
  if (line.trim() === '') {
    return <div key={index} className="h-4" />;
  }

  // Regular paragraph
  return (
    <p key={index} className="text-base leading-[1.85] text-foreground/80 mb-1">
      {parseInline(line)}
    </p>
  );
}

export function BlogContentRenderer({ content, className = '' }: BlogContentRendererProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    // Code blocks
    if (lines[i].startsWith('```')) {
      const lang = lines[i].slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <div key={elements.length} className="my-6 rounded-xl overflow-hidden border border-border shadow-sm">
          {lang && (
            <div className="bg-primary/5 px-4 py-2 border-b border-border">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lang}</span>
            </div>
          )}
          <pre className="bg-primary/[0.03] p-5 overflow-x-auto">
            <code className="text-sm font-mono leading-relaxed text-foreground/90">
              {codeLines.join('\n')}
            </code>
          </pre>
        </div>
      );
      continue;
    }

    // Table detection
    if (lines[i].includes('|') && i + 1 < lines.length && lines[i + 1].match(/^\|[\s-:|]+\|$/)) {
      const headerCells = lines[i].split('|').filter(c => c.trim()).map(c => c.trim());
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').filter(c => c.trim()).map(c => c.trim()));
        i++;
      }
      elements.push(
        <div key={elements.length} className="my-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/60">
                {headerCells.map((cell, ci) => (
                  <th key={ci} className="text-left font-bold text-foreground px-4 py-3 text-xs uppercase tracking-wider">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-t border-border hover:bg-secondary/30 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-foreground/80">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    elements.push(renderLine(lines[i], elements.length));
    i++;
  }

  return (
    <article className={`selection:bg-accent/20 selection:text-foreground ${className}`}>
      {elements}
    </article>
  );
}
