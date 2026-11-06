export interface ParsedTextPart {
  type: 'text' | 'link';
  content?: string;
  displayText?: string;
  href?: string;
  isWarning?: boolean;
}

const URL_REGEX = /(https?:\/\/[^\s<>"'{}|\\^`]+|(?:www\.|[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?::\d+)?(?:[/?#][^\s<>"'{}|\\^`]*)?)/gi;

const DANGEROUS_SCHEMES_REGEX = /^(javascript|data|file|vbscript|blob|about|chrome):/i;

/**
 * Trims trailing punctuation attached to URLs in natural language text.
 * Handles Arabic & English trailing punctuation safely.
 */
export function cleanTrailingPunctuation(str: string): { cleanUrl: string; trailing: string } {
  let cleanUrl = str;
  let trailing = '';
  let openParen = (cleanUrl.match(/\(/g) || []).length;
  let closeParen = (cleanUrl.match(/\)/g) || []).length;

  while (cleanUrl.length > 0) {
    const lastChar = cleanUrl.slice(-1);
    if (/[.,!?،؟\]}:;"']/.test(lastChar)) {
      trailing = lastChar + trailing;
      cleanUrl = cleanUrl.slice(0, -1);
    } else if (lastChar === ')' && closeParen > openParen) {
      trailing = lastChar + trailing;
      cleanUrl = cleanUrl.slice(0, -1);
      closeParen--;
    } else {
      break;
    }
  }
  return { cleanUrl, trailing };
}

/**
 * Parses message text into plain text chunks and safe/warning link tokens.
 */
export function parseTextWithUrls(text: string): ParsedTextPart[] {
  if (!text) return [];
  const parts: ParsedTextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(URL_REGEX);

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    const rawMatch = match[0];

    // Push preceding text before URL
    if (matchStart > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, matchStart) });
    }

    const { cleanUrl, trailing } = cleanTrailingPunctuation(rawMatch);
    const lower = cleanUrl.toLowerCase();

    // Prevent dangerous schemes from becoming links
    if (DANGEROUS_SCHEMES_REGEX.test(lower)) {
      parts.push({ type: 'text', content: cleanUrl + trailing });
    } else {
      let href = cleanUrl;
      let isWarning = false;

      if (lower.startsWith('http://')) {
        isWarning = true;
      } else if (lower.startsWith('https://')) {
        isWarning = false;
      } else {
        // Default typed URLs without scheme (e.g. roblox.com, www.roblox.com) to https:// internally
        href = 'https://' + cleanUrl;
        isWarning = false;
      }

      parts.push({
        type: 'link',
        displayText: cleanUrl,
        href,
        isWarning,
      });

      if (trailing) {
        parts.push({ type: 'text', content: trailing });
      }
    }

    lastIndex = matchStart + rawMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}
