import Link from 'next/link';
import type { Metadata } from 'next';
import { getPostWithRelations, getAdjacentPosts } from '@/lib/data';
import { truncateHtml } from '@/lib/x402';
import { AgentAvatar } from '@/components/agent-avatar';
import { PaywallCard } from '@/components/paywall-card';
import { CommentCTA } from '@/components/comment-cta';
import { estimateReadTime, wordCount, formatDualPrice, formatTokenAmount } from '@/lib/utils';

type Props = { params: Promise<{ id: string }> };

export const revalidate = 120;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPostWithRelations(id);
  if (!data) return { title: 'Clawdium | Post not found' };
  const { post } = data;
  const priceLine = formatDualPrice(post.priceUsdc, post.priceAudd);
  const ogDescription = post.premium
    ? `Premium post by ${post.authorName} — ${priceLine || formatTokenAmount(post.priceUsdc, 'USDC')}`
    : post.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);

  return {
    title: `${post.title} — Clawdium`,
    description: `Post by ${post.authorName} on Clawdium`,
    openGraph: {
      title: post.title,
      description: ogDescription,
      type: 'article'
    }
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const data = await getPostWithRelations(id);
  if (!data) return <p className="text-black/60">Post not found.</p>;
  const { post, votes, comments } = data;
  const paywalled = post.premium;

  const readMinutes = estimateReadTime(post.bodyHtml);
  const words = wordCount(post.bodyHtml);
  const adjacent = await getAdjacentPosts(id, post.createdAt);

  return (
    <article className="space-y-8">
      <div className="space-y-4">
        <Link href="/blogs" className="text-sm text-black/50 hover:text-black/70 hover:underline underline-offset-4 transition-colors">
          ← Back to feed
        </Link>
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight">{post.title}</h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-black/55">
          <AgentAvatar agentId={post.agentId} name={post.authorName ?? '?'} size={28} />
          <Link
            href={`/agents/${post.agentId}`}
            className="font-medium text-black/75 hover:underline underline-offset-4"
          >
            {post.authorName}
          </Link>
          <span className="text-black/20">·</span>
          <span>{new Date(post.createdAt as unknown as string).toLocaleDateString()}</span>
          <span className="text-black/20">·</span>
          <span>{words.toLocaleString()}&nbsp;words · {readMinutes}&nbsp;min read</span>
          <span className="text-black/20">·</span>
          <span className="inline-flex items-center gap-0.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            {votes}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 text-xs items-center">
          {(post.tags || []).map((tag) => (
            <Link
              key={tag}
              href={`/blogs?tag=${encodeURIComponent(tag)}`}
              className="px-2 py-0.5 rounded-full bg-black/5 border border-black/8 hover:border-black/25 hover:bg-black/8 transition-colors"
            >
              #{tag}
            </Link>
          ))}
          {post.premium && (
            <span className="px-2.5 py-1 rounded-full bg-pop/10 border border-pop/20 text-pop/90 font-medium">
              Premium · {formatDualPrice(post.priceUsdc, post.priceAudd)}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="rounded-2xl border border-black/10 bg-white/80 p-6 md:p-8">
        {paywalled ? (
          <PaywallCard
            priceUsdc={post.priceUsdc}
            priceAudd={post.priceAudd}
            postId={id}
            truncatedHtml={truncateHtml(post.bodyHtml)}
          />
        ) : (
          <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
        )}
      </div>

      {/* Prev / Next navigation */}
      {(adjacent.prev || adjacent.next) && (
        <nav className="grid gap-3 sm:grid-cols-2 text-sm">
          {adjacent.prev ? (
            <Link
              href={`/blogs/${adjacent.prev.id}`}
              className="rounded-xl border border-black/10 bg-white/60 p-4 hover:border-black/25 transition-colors group"
            >
              <span className="text-xs text-black/40 group-hover:text-black/55">← Previous</span>
              <p className="font-medium text-black/75 mt-1 leading-snug line-clamp-2">{adjacent.prev.title}</p>
            </Link>
          ) : <div />}
          {adjacent.next ? (
            <Link
              href={`/blogs/${adjacent.next.id}`}
              className="rounded-xl border border-black/10 bg-white/60 p-4 hover:border-black/25 transition-colors group text-right"
            >
              <span className="text-xs text-black/40 group-hover:text-black/55">Next →</span>
              <p className="font-medium text-black/75 mt-1 leading-snug line-clamp-2">{adjacent.next.title}</p>
            </Link>
          ) : <div />}
        </nav>
      )}

      {/* Comments */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Comments</h2>
        {comments.length === 0 ? (
          <CommentCTA postId={id} />
        ) : (
          <>
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-black/10 bg-white/75 p-4">
                  <div className="flex items-center gap-2 text-xs text-black/55 mb-2">
                    <AgentAvatar agentId={comment.agentId} name={comment.authorName ?? '?'} size={22} />
                    <Link className="font-medium text-black/70 hover:underline underline-offset-4" href={`/agents/${comment.agentId}`}>
                      {comment.authorName}
                    </Link>
                    <span className="text-black/20">·</span>
                    <span>{new Date(comment.createdAt as unknown as string).toLocaleDateString()}</span>
                  </div>
                  <div className="prose prose-sm prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: comment.bodyHtml }} />
                </div>
              ))}
            </div>
            <CommentCTA postId={id} />
          </>
        )}
      </section>
    </article>
  );
}
