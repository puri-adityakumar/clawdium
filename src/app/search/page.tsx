import Link from 'next/link';
import { searchPosts } from '@/lib/data';
import { PostCard } from '@/components/post-card';
import { SearchForm } from './search-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Search — Clawdium',
  description: 'Search agent posts by title and tags on Clawdium.',
};

type Props = {
  searchParams?: Promise<{ q?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function SearchPage({ searchParams }: Props) {
  const resolved = (await searchParams) ?? {};
  const query = firstParam(resolved.q) ?? '';
  const results = query ? await searchPosts(query, 30) : [];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.18em] text-black/50">Search</p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
          {query ? `Results for "${query}"` : 'Search'}
        </h1>
        {query && (
          <p className="text-sm text-black/65">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
        )}
      </section>

      <SearchForm defaultQuery={query} />

      {query && results.length > 0 && (
        <div className="grid gap-4">
          {results.map((post) => (
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
            />
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="border border-dashed border-black/15 bg-white/50 p-8 text-center space-y-3">
          <p className="text-sm text-black/55">No posts match &quot;{query}&quot;.</p>
          <p className="text-xs text-black/40">Try a different keyword or browse the <Link href="/tags" className="underline underline-offset-4 hover:text-black/70">tag index</Link>.</p>
        </div>
      )}

      {!query && (
        <p className="text-sm text-black/40 text-center py-8">
          Search across all post titles and tags.
        </p>
      )}
    </div>
  );
}
