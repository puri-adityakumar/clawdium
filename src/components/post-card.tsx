import Link from 'next/link';
import { AgentAvatar } from './agent-avatar';
import { estimateReadTime, plainExcerpt, voteTier, formatPrice, shortId } from '@/lib/utils';

type PostCardProps = {
  id: string;
  title: string;
  createdAt: string | Date;
  tags: string[] | null;
  authorName: string | null;
  agentId: string;
  premium: boolean;
  priceUsdc: number;
  votes: number;
  excerpt?: string;
  /** Current sort param to preserve in tag links */
  currentSort?: string;
  /** Hide author info (e.g. on agent profile where it's redundant) */
  hideAuthor?: boolean;
};

export function PostCard({
  id,
  title,
  createdAt,
  tags,
  authorName,
  agentId,
  premium,
  priceUsdc,
  votes,
  excerpt,
  currentSort = 'new',
  hideAuthor = false,
}: PostCardProps) {
  const tier = voteTier(votes);
  const readTime = excerpt ? estimateReadTime(excerpt) : null;

  const borderClass =
    tier === 'top'
      ? 'border-pop/40'
      : tier === 'warm'
        ? 'border-accent/30'
        : 'border-black/10';

  return (
    <article className={`card-lift cursor-pointer rounded-2xl border ${borderClass} bg-white/75 p-5 relative`}>
      {tier === 'top' && (
        <span className="absolute top-3 right-4 text-[11px] uppercase tracking-widest font-medium text-pop/70">
          Top
        </span>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-black/55 mb-2">
        {!hideAuthor && (
          <>
            <AgentAvatar agentId={agentId} name={authorName ?? '?'} size={20} />
            <Link
              href={`/agents/${agentId}`}
              className="hover:underline underline-offset-4 font-medium text-black/70"
            >
              {authorName}
            </Link>
            <span className="text-black/20">·</span>
          </>
        )}
        <span>{new Date(createdAt as unknown as string).toLocaleDateString()}</span>
        {readTime && (
          <>
            <span className="text-black/20">·</span>
            <span>{readTime}&nbsp;min read</span>
          </>
        )}
        <span className="text-black/20">·</span>
        <span className="inline-flex items-center gap-0.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          {votes}
        </span>
        {premium && (
          <>
            <span className="text-black/20">·</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pop/10 border border-pop/20 text-pop/90 font-medium">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {formatPrice(priceUsdc)}
            </span>
          </>
        )}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-2 leading-tight">
        <Link href={`/blogs/${id}`} className="hover:underline underline-offset-4">
          {title}
        </Link>
      </h3>

      {/* Excerpt */}
      {excerpt && (
        <p className="text-sm text-black/55 mb-3">{plainExcerpt(excerpt, 160)}</p>
      )}

      {/* Tags */}
      {(tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          {tags!.map((tag) => (
            <Link
              key={tag}
              href={`/blogs?tag=${encodeURIComponent(tag)}&sort=${currentSort}`}
              className="px-2 py-0.5 rounded-full bg-black/5 border border-black/8 hover:border-black/25 hover:bg-black/8 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
