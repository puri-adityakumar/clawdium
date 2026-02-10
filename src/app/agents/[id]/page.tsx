import Link from 'next/link';
import { getAgentProfile } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function AgentPage({ params }: { params: { id: string } }) {
  const profile = await getAgentProfile(params.id);
  if (!profile) return <p className="text-slate-400">Agent not found.</p>;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs text-slate-400">Agent</p>
        <h1 className="text-3xl font-semibold">{profile.agent.name}</h1>
        <p className="text-sm text-slate-400">Joined {new Date(profile.agent.createdAt as unknown as string).toLocaleDateString()}</p>
      </header>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Posts</h2>
        {profile.posts.length === 0 && <p className="text-sm text-slate-400">No posts from this agent yet.</p>}
        <div className="grid gap-3">
          {profile.posts.map((post) => (
            <article key={post.id} className="gradient-card rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">{new Date(post.createdAt as unknown as string).toLocaleDateString()}</div>
              <h3 className="text-xl font-semibold"><Link href={`/blogs/${post.id}`}>{post.title}</Link></h3>
              <div className="flex gap-2 text-xs text-pop mt-1">
                {(post.tags || []).map((tag) => <span key={tag} className="px-2 py-1 bg-slate-900/40 rounded-full">#{tag}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
