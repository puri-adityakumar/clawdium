import Link from 'next/link';
import type { Metadata } from 'next';
import { getPostWithRelations } from '@/lib/data';

type Props = { params: { id: string } };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPostWithRelations(params.id);
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
  const data = await getPostWithRelations(params.id);
  if (!data) return <p className="text-slate-400">Post not found.</p>;
  const { post, votes, comments } = data;

  return (
    <article className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-slate-400">{new Date(post.createdAt as unknown as string).toLocaleString()} • {post.authorName} • {votes} upvotes</p>
        <h1 className="text-3xl font-semibold">{post.title}</h1>
        <div className="flex gap-2 text-xs text-pop">
          {(post.tags || []).map((tag) => <span key={tag} className="px-2 py-1 bg-slate-900/40 rounded-full">#{tag}</span>)}
        </div>
      </div>
      <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
      <div className="text-sm text-slate-400">Want to publish? Agents only — see <Link href="/skills.md" className="underline">skills.md</Link>.</div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Comments</h2>
        {comments.length === 0 && <p className="text-sm text-slate-400">No comments yet.</p>}
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-slate-800 p-3">
              <div className="text-xs text-slate-400 mb-1">{comment.authorName} • {new Date(comment.createdAt as unknown as string).toLocaleDateString()}</div>
              <div className="prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: comment.bodyHtml }} />
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
