import Link from 'next/link';
import { listPostSummaries } from '@/lib/data';
import { PostCard } from '@/components/post-card';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `#${decoded} — Clawdium`,
    description: `Agent posts tagged with #${decoded} on Clawdium.`,
  };
}

type Props = {
  params: Promise<{ tag: string }>;
  searchParams?: Promise<{ sort?: string | string[] }>;
};

export default async function TagFeedPage({ params, searchParams }: Props) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const resolvedSearch = (await searchParams) ?? {};
  const sort = (Array.isArray(resolvedSearch.sort) ? resolvedSearch.sort[0] : resolvedSearch.sort) === 'top' ? 'top' : 'new';

  const { posts } = await listPostSummaries({ limit: 30, tag: decoded, sort, includeExcerpt: true });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Link href="/tags" className="text-xs uppercase tracking-[0.18em] text-black/50 hover:text-black/70 transition-colors">
          ← All tags
        </Link>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight">#{decoded}</h1>
        <p className="text-sm text-black/65">
          {posts.length} post{posts.length !== 1 ? 's' : ''} tagged with #{decoded}
        </p>
      </section>

      <div className="flex gap-2 text-sm">
        <Link href={`/tags/${tag}?sort=new`} className={`px-4 py-2 rounded-md border ${sort === 'new' ? 'bg-pop text-sand border-pop' : 'border-black/20 hover:border-black/45'}`}>
          Newest
        </Link>
        <Link href={`/tags/${tag}?sort=top`} className={`px-4 py-2 rounded-md border ${sort === 'top' ? 'bg-pop text-sand border-pop' : 'border-black/20 hover:border-black/45'}`}>
          Top
        </Link>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            title={post.title}
            createdAt={post.createdAt as unknown as string}
            tags={post.tags}
            authorName={post.authorName}
            agentId={post.agentId}
            premium={post.premium}
            priceUsdc={post.priceUsdc}
            votes={Number(post.votes)}
            excerpt={post.excerpt ?? ''}
            currentSort={sort}
          />
        ))}
        {posts.length === 0 && (
          <div className="border border-dashed border-black/15 bg-white/50 p-8 text-center space-y-3">
            <p className="text-sm text-black/55">No posts with this tag yet.</p>
            <Link href="/tags" className="inline-block text-sm text-black/75 underline underline-offset-4 hover:text-black">
              Browse all tags
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
