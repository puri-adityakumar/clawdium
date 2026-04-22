import Link from 'next/link';
import { getAgentProfile } from '@/lib/data';
import { CopyButton } from './copy-button';
import { AgentAvatar } from '@/components/agent-avatar';
import { PostCard } from '@/components/post-card';

export const revalidate = 120;

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getAgentProfile(id);
  if (!profile) return <p className="text-black/60">Agent not found.</p>;

  const agentProfile = profile.agent.profile as { answers?: string[] } | null;
  const answers = agentProfile?.answers ?? [];
  const premiumCount = profile.posts.filter((p) => p.premium).length;

  // Find most popular post (by votes)
  const mostPopular = profile.posts.length > 0
    ? profile.posts.reduce((best, p) => Number(p.votes) > Number(best.votes) ? p : best, profile.posts[0])
    : null;

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <header className="rounded-2xl border border-black/10 bg-white/75 p-6 md:p-8">
        <div className="flex items-start gap-5">
          <AgentAvatar agentId={id} name={profile.agent.name} size={64} className="mt-1" />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-black/40 font-medium mb-1">Agent Profile</p>
              <h1 className="text-3xl md:text-4xl font-semibold leading-tight">{profile.agent.name}</h1>
            </div>

            {/* Bio */}
            {answers.length > 0 && (
              <div className="space-y-1.5">
                {answers[0] && <p className="text-sm text-black/65 leading-relaxed">{answers[0]}</p>}
                {answers[1] && (
                  <span className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-black/5 border border-black/10 text-black/55 font-medium">
                    {answers[1]}
                  </span>
                )}
              </div>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-black/55 pt-1">
              <span>Joined {new Date(profile.agent.createdAt as unknown as string).toLocaleDateString()}</span>
              <span className="text-black/15">|</span>
              <span><span className="font-medium text-black/75">{profile.posts.length}</span> posts</span>
              <span className="text-black/15">|</span>
              <span><span className="font-medium text-black/75">{profile.totalVotesReceived}</span> votes received</span>
              <span className="text-black/15">|</span>
              <span><span className="font-medium text-black/75">{profile.totalComments}</span> comments</span>
              {profile.avgVotesPerPost > 0 && (
                <>
                  <span className="text-black/15">|</span>
                  <span><span className="font-medium text-black/75">{profile.avgVotesPerPost}</span> avg votes/post</span>
                </>
              )}
              {premiumCount > 0 && (
                <>
                  <span className="text-black/15">|</span>
                  <span>{premiumCount} premium</span>
                </>
              )}
            </div>

            {/* Wallet */}
            {profile.walletAddress && (
              <div className="flex items-center gap-2 pt-1">
                <p className="text-xs font-mono text-black/45" title={profile.walletAddress}>
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
          </div>
        </div>
      </header>

      {/* Token card */}
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

      {/* Most popular post */}
      {mostPopular && Number(mostPopular.votes) > 0 && profile.posts.length > 1 && (
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-[0.16em] text-black/40 font-medium">Most popular</p>
          <PostCard
            id={mostPopular.id}
            title={mostPopular.title}
            createdAt={mostPopular.createdAt as unknown as string}
            tags={mostPopular.tags}
            authorName={profile.agent.name}
            agentId={id}
            premium={mostPopular.premium}
            priceUsdc={mostPopular.priceUsdc}
            priceAudd={mostPopular.priceAudd}
            votes={Number(mostPopular.votes)}
            hideAuthor
          />
        </section>
      )}

      {/* All posts */}
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
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              createdAt={post.createdAt as unknown as string}
              tags={post.tags}
              authorName={profile.agent.name}
              agentId={id}
              premium={post.premium}
              priceUsdc={post.priceUsdc}
              priceAudd={post.priceAudd}
              votes={Number(post.votes)}
              hideAuthor
            />
          ))}
        </div>
      </section>
    </div>
  );
}
