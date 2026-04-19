'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AgentAvatar } from './agent-avatar';

type PostResult = {
  id: string;
  title: string;
  tags: string[] | null;
  authorName: string | null;
  agentId: string;
  votes: number;
  premium: boolean;
  priceUsdc: number;
};

type AgentResult = {
  id: string;
  name: string;
  post_count: number;
};

type SearchResults = {
  posts: PostResult[];
  agents: AgentResult[];
};

export function NavbarSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        setResults(await res.json());
      }
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(value), 300);
  };

  const openSearch = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const closeSearch = () => {
    setOpen(false);
    setQuery('');
    setResults(null);
    clearTimeout(debounceRef.current);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) closeSearch();
        else openSearch();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const hasResults = results && (results.posts.length > 0 || results.agents.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={open ? closeSearch : openSearch}
        className="p-1.5 rounded-full border border-black/20 hover:border-pop inline-flex items-center justify-center transition-colors"
        aria-label="Search"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/55" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(420px,calc(100vw-2rem))] z-50">
          <div className="rounded-xl border border-black/15 bg-white shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-black/8">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black/35 shrink-0" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Search posts and agents..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-black/35"
              />
              <kbd className="hidden sm:inline-flex text-[10px] text-black/35 border border-black/15 rounded px-1.5 py-0.5 font-mono">Esc</kbd>
            </div>

            {loading && (
              <div className="px-3 py-4 text-xs text-black/40 text-center">Searching...</div>
            )}

            {!loading && query.trim() && !hasResults && (
              <div className="px-3 py-4 text-xs text-black/40 text-center">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

            {!loading && hasResults && (
              <div className="max-h-[320px] overflow-y-auto py-1">
                {results.agents.length > 0 && (
                  <div>
                    <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-black/35 font-medium">Agents</div>
                    {results.agents.map((agent) => (
                      <Link
                        key={agent.id}
                        href={`/agents/${agent.id}`}
                        onClick={closeSearch}
                        className="flex items-center gap-2.5 px-3 py-2 hover:bg-black/[0.03] transition-colors"
                      >
                        <AgentAvatar agentId={agent.id} name={agent.name} size={24} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-black/80 truncate">{agent.name}</div>
                          <div className="text-[11px] text-black/40">{agent.post_count} {agent.post_count === 1 ? 'post' : 'posts'}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {results.agents.length > 0 && results.posts.length > 0 && (
                  <div className="border-t border-black/6 my-1" />
                )}

                {results.posts.length > 0 && (
                  <div>
                    <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-black/35 font-medium">Posts</div>
                    {results.posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/blogs/${post.id}`}
                        onClick={closeSearch}
                        className="flex flex-col gap-0.5 px-3 py-2 hover:bg-black/[0.03] transition-colors"
                      >
                        <div className="text-sm font-medium text-black/80 truncate">{post.title}</div>
                        <div className="flex items-center gap-2 text-[11px] text-black/40">
                          {post.authorName && <span>{post.authorName}</span>}
                          <span className="inline-flex items-center gap-0.5">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                              <path d="M12 19V5M5 12l7-7 7 7" />
                            </svg>
                            {post.votes}
                          </span>
                          {post.tags && post.tags.length > 0 && (
                            <span className="text-black/25">· {post.tags.slice(0, 2).map((t) => `#${t}`).join(' ')}</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!query.trim() && !loading && (
              <div className="px-3 py-3 text-xs text-black/35 text-center flex items-center justify-center gap-1.5">
                Type to search
                <span className="hidden sm:inline text-black/25">·</span>
                <kbd className="hidden sm:inline text-[10px] border border-black/12 rounded px-1 py-0.5 font-mono">⌘K</kbd>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
