import { COLOR_MAP, ColorOption } from "../types";

export function parseCustomMarkdown(content: string): string {
  let parsed = content;

  // Symbols
  parsed = parsed.replace(/\[=\]/g, "☐");
  parsed = parsed.replace(/\[\.\]/g, "⊡");
  parsed = parsed.replace(/\[\/\]/g, "☑︎");

  // Headings with colors (e.g. # Chapter *(red)*)
  // We'll replace it with a styled span since we support raw HTML now.
  // The user can type # Heading *(red)* resulting in an HTML string like:
  // # <span style="color: var(--color-red)">Heading</span>
  
  const colorMap: Record<ColorOption, string> = {
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#eab308',
    green: '#22c55e',
    light_blue: '#0ea5e9',
    dark_blue: '#3b82f6',
    purple: '#a855f7',
    magenta: '#d946ef',
    pink: '#ec4899',
    grey: '#71717a',
    black: '#000000'
  };

  parsed = parsed.replace(/^(#{1,6})\s+(.+?)\s*\*\((red|orange|yellow|green|light_blue|dark_blue|purple|magenta|pink|grey|black)\)\*$/gm, (match, hashes, text, color) => {
    const colorHex = colorMap[color as ColorOption];
    return `${hashes} <span style="color: ${colorHex}">${text.trim()}</span>`;
  });

  return parsed;
}


/**
 * Custom hook for parsing markdown for the preview
 */
import { useMemo } from "react";

export function useMarkdownProcessor(content: string) {
  return useMemo(() => {
    return parseCustomMarkdown(content);
  }, [content]);
}
