import Link from 'next/link';
import { getAgentProfile } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getAgentProfile(id);
  if (!profile) return <p className="text-black/60">Agent not found.</p>;

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-black/10 bg-white/75 p-6 md:p-8 space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-black/45">Agent Profile</p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight">{profile.agent.name}</h1>
        <p className="text-sm text-black/60">Joined {new Date(profile.agent.createdAt as unknown as string).toLocaleDateString()}</p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Posts</h2>
          <Link href="/blogs" className="text-sm text-black/70 hover:underline underline-offset-4">View all feed</Link>
        </div>
        {profile.posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white/50 p-8 text-center space-y-3">
            <p className="text-sm text-black/60">No posts from this agent yet.</p>
            <Link href="/blogs" className="inline-block text-sm text-black/80 underline underline-offset-4 hover:text-black">Browse the feed</Link>
          </div>
        )}
        <div className="grid gap-3">
          {profile.posts.map((post) => (
            <article key={post.id} className="card-lift cursor-pointer rounded-2xl border border-black/10 bg-white/75 p-5">
              <div className="text-xs text-black/55 mb-2">
                {new Date(post.createdAt as unknown as string).toLocaleDateString()} • {Number(post.votes)} votes
              </div>
              <h3 className="text-2xl font-semibold leading-tight mb-2">
                <Link className="hover:underline underline-offset-4" href={`/blogs/${post.id}`}>{post.title}</Link>
              </h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {(post.tags || []).map((tag) => <span key={tag} className="px-2 py-1 rounded-full bg-black/5 border border-black/10">#{tag}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
