import React, { useState } from 'react';
import { parseTextWithUrls, ParsedTextPart } from '../../lib/linkSafety';
import { LinkWarningModal } from './LinkWarningModal';

interface SafeMessageTextProps {
  text: string;
  isOwnMessage?: boolean;
  className?: string;
}

export function SafeMessageText({ text, isOwnMessage = false, className = '' }: SafeMessageTextProps) {
  const [pendingWarningUrl, setPendingWarningUrl] = useState<string | null>(null);

  const parts: ParsedTextPart[] = parseTextWithUrls(text);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isWarning: boolean) => {
    e.stopPropagation();
    if (isWarning) {
      e.preventDefault();
      setPendingWarningUrl(href);
    }
  };

  const handleStopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const safeLinkStyle = isOwnMessage
    ? 'text-cyan-200 hover:text-white underline font-bold transition-colors cursor-pointer [direction:ltr] [unicode-bidi:isolate] [word-break:break-all] [overflow-wrap:anywhere] inline'
    : 'text-blue-600 hover:text-blue-800 underline font-bold transition-colors cursor-pointer [direction:ltr] [unicode-bidi:isolate] [word-break:break-all] [overflow-wrap:anywhere] inline';

  const warningLinkStyle = isOwnMessage
    ? 'text-amber-300 hover:text-amber-100 underline font-bold transition-colors cursor-pointer [direction:ltr] [unicode-bidi:isolate] [word-break:break-all] [overflow-wrap:anywhere] inline'
    : 'text-amber-600 hover:text-amber-700 underline font-bold transition-colors cursor-pointer [direction:ltr] [unicode-bidi:isolate] [word-break:break-all] [overflow-wrap:anywhere] inline';

  return (
    <>
      <span className={className}>
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return <React.Fragment key={index}>{part.content}</React.Fragment>;
          }

          if (part.type === 'link' && part.href && part.displayText) {
            const isWarning = Boolean(part.isWarning);
            return (
              <a
                key={index}
                href={part.href}
                target={isWarning ? undefined : '_blank'}
                rel={isWarning ? undefined : 'noopener noreferrer'}
                onClick={(e) => handleLinkClick(e, part.href!, isWarning)}
                onMouseDown={handleStopPropagation}
                onTouchStart={handleStopPropagation}
                className={isWarning ? warningLinkStyle : safeLinkStyle}
                title={isWarning ? 'رابط قد يكون غير آمن (HTTP)' : 'رابط آمن'}
              >
                {part.displayText}
              </a>
            );
          }

          return null;
        })}
      </span>

      {pendingWarningUrl && (
        <LinkWarningModal
          url={pendingWarningUrl}
          onConfirm={() => {
            const targetUrl = pendingWarningUrl;
            setPendingWarningUrl(null);
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
          }}
          onCancel={() => setPendingWarningUrl(null)}
        />
      )}
    </>
  );
}
