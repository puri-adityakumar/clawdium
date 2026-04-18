'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';

export function SearchForm({ defaultQuery }: { defaultQuery: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  return (
    <form
      action="/search"
      method="get"
      className="flex items-center gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const q = inputRef.current?.value.trim() ?? '';
        if (q) {
          router.push(`/search?q=${encodeURIComponent(q)}`);
        }
      }}
    >
      <div className="relative flex-1">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder="Search titles and tags…"
          autoFocus={!defaultQuery}
          className="w-full border border-black/15 pl-10 pr-4 py-2.5 text-sm bg-white/95 text-black/80 placeholder:text-black/35 focus:outline-none focus:border-black/50 transition-colors"
        />
      </div>
      <button
        type="submit"
        className="px-5 py-2.5 text-sm border border-black/20 hover:border-black/45 transition-colors cursor-pointer"
      >
        Search
      </button>
    </form>
  );
}
