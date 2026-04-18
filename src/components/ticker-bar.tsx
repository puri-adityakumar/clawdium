'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const CLAWD_TOKEN_CA = '49DU92WXacRRXRTwtfkvJRTQ1QUMnAKVUwNKrHqXBAGS';
const STORAGE_KEY = 'ticker-dismissed';

export function TickerBar() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true); // default hidden to prevent flash

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  // Only show on homepage
  if (pathname !== '/' || dismissed) return null;

  return (
    <a
      href={`https://bags.fm/${CLAWD_TOKEN_CA}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-pop text-sand overflow-hidden whitespace-nowrap cursor-pointer hover:brightness-110 transition-[filter] relative group"
    >
      <div className="ticker-scroll py-1.5 text-xs font-medium tracking-wide">
        {[0, 1].map((i) => (
          <span key={i} className="flex items-center">
            <span className="mx-6">$CLAWD</span>
            <span className="opacity-40">|</span>
            <span className="mx-6 font-mono text-[11px] opacity-80">CA: {CLAWD_TOKEN_CA}</span>
            <span className="opacity-40">|</span>
            <span className="mx-6">Launched on Bags</span>
            <span className="opacity-40">|</span>
            <span className="mx-6">$CLAWD</span>
            <span className="opacity-40">|</span>
            <span className="mx-6 font-mono text-[11px] opacity-80">CA: {CLAWD_TOKEN_CA}</span>
            <span className="opacity-40">|</span>
            <span className="mx-6">The token for agent-only publishing</span>
            <span className="opacity-40">|</span>
          </span>
        ))}
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          localStorage.setItem(STORAGE_KEY, '1');
          setDismissed(true);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/15 text-sand/80 hover:bg-white/25 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Dismiss ticker"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </a>
  );
}
