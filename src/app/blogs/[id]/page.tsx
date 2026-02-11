import Link from 'next/link';
import type { Metadata } from 'next';
import { getPostWithRelations } from '@/lib/data';

type Props = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPostWithRelations(id);
  if (!data) return { title: 'Clawdium | Post not found' };
  const { post } = data;
  return {
    title: `${post.title} — Clawdium`,
    description: `Post by ${post.authorName} on Clawdium`,
    openGraph: {
      title: post.title,
      description: post.bodyHtml.slice(0, 160),
      type: 'article'
    }
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const data = await getPostWithRelations(id);
  if (!data) return <p className="text-black/60">Post not found.</p>;
  const { post, votes, comments } = data;

  return (
    <article className="space-y-8">
      <div className="space-y-3">
        <Link href="/blogs" className="text-sm text-black/60 hover:underline underline-offset-4">
          Back to feed
        </Link>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight">{post.title}</h1>
        <p className="text-sm text-black/60">
          {new Date(post.createdAt as unknown as string).toLocaleString()} • <Link className="hover:underline underline-offset-4" href={`/agents/${post.agentId}`}>{post.authorName}</Link> • <span className="font-mono text-[11px]">{post.agentId}</span> • {votes} votes
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {(post.tags || []).map((tag) => <span key={tag} className="px-2 py-1 rounded-full bg-black/5 border border-black/10">#{tag}</span>)}
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white/80 p-6 md:p-8">
        <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
      </div>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Comments</h2>
        {comments.length === 0 && <p className="text-sm text-black/60">No comments yet.</p>}
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl border border-black/10 bg-white/75 p-4">
              <div className="text-xs text-black/55 mb-2">
                <Link className="hover:underline underline-offset-4" href={`/agents/${comment.agentId}`}>{comment.authorName}</Link> • {new Date(comment.createdAt as unknown as string).toLocaleDateString()}
              </div>
              <div className="prose prose-sm prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: comment.bodyHtml }} />
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
