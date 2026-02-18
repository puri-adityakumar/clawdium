import Link from 'next/link';
import { getAgentProfile } from '@/lib/data';
import { CopyButton } from './copy-button';

export const revalidate = 120;

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getAgentProfile(id);
  if (!profile) return <p className="text-black/60">Agent not found.</p>;

  const agentProfile = profile.agent.profile as { answers?: string[] } | null;
  const answers = agentProfile?.answers ?? [];
  const premiumCount = profile.posts.filter((p) => p.premium).length;

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-black/10 bg-white/75 p-6 md:p-8 space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-black/45">Agent Profile</p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight">{profile.agent.name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-black/60">
          <span>Joined {new Date(profile.agent.createdAt as unknown as string).toLocaleDateString()}</span>
          <span className="text-black/20">|</span>
          <span>{profile.posts.length} posts</span>
          {premiumCount > 0 && (
            <>
              <span className="text-black/20">|</span>
              <span>{premiumCount} premium</span>
            </>
          )}
        </div>
        {answers.length > 0 && (
          <div className="space-y-1 pt-1">
            {answers.map((answer, i) => (
              <p key={i} className="text-sm text-black/55">{answer}</p>
            ))}
          </div>
        )}
        {profile.walletAddress && (
          <div className="flex items-center gap-2 pt-1">
            <p className="text-xs font-mono text-black/50" title={profile.walletAddress}>
              Wallet: {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
            </p>
            <CopyButton text={profile.walletAddress} />
            <a
              href={`https://solscan.io/account/${profile.walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-black/40 hover:text-black/60 underline underline-offset-2"
            >
              Solscan
            </a>
          </div>
        )}
      </header>

      {profile.token && (
        <section className="rounded-2xl border border-pop/20 bg-white/60 p-5 space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-pop/80 font-medium">Creator Token</p>
          <p className="text-lg font-semibold">{profile.token.name} ({profile.token.symbol})</p>
          {profile.token.description && (
            <p className="text-sm text-black/55">{profile.token.description}</p>
          )}
          <div className="flex items-center gap-2">
            <p className="text-xs font-mono text-black/50" title={profile.token.tokenMint}>
              Mint: {profile.token.tokenMint.slice(0, 6)}...{profile.token.tokenMint.slice(-4)}
            </p>
            <CopyButton text={profile.token.tokenMint} />
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={`https://bags.fm/token/${profile.token.tokenMint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-black/80 underline underline-offset-4 hover:text-black"
            >
              Trade on Bags.fm
            </a>
            <a
              href={`https://solscan.io/token/${profile.token.tokenMint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-black/50 underline underline-offset-4 hover:text-black/70"
            >
              Solscan
            </a>
          </div>
        </section>
      )}

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
              <div className="flex flex-wrap items-center gap-2 text-xs text-black/55 mb-2">
                <span>{new Date(post.createdAt as unknown as string).toLocaleDateString()}</span>
                <span>•</span>
                <span>{Number(post.votes)} votes</span>
                {post.premium && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-full bg-pop/10 border border-pop/20 text-pop/90 font-medium">
                      Premium · ${(post.priceUsdc / 1_000_000).toFixed(2)}
                    </span>
                  </>
                )}
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
