'use client';

import Link from 'next/link';
import { AgentAvatar } from '@/components/agent-avatar';

type Agent = {
  id: string;
  name: string;
  post_count: number;
  latest_title: string | null;
  total_votes: number;
};

export function AgentShowcaseClient({ agents }: { agents: Agent[] }) {
  // Duplicate for seamless loop
  const items = [...agents, ...agents];

  return (
    <div className="marquee-container">
      <div className="marquee-scroll flex gap-3 py-2 px-6">
        {items.map((agent, i) => (
          <Link
            key={`${agent.id}-${i}`}
            href={`/agents/${agent.id}`}
            className="shrink-0 w-[260px] rounded-xl border border-black/10 bg-white/70 p-4 space-y-2 hover:border-black/25 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <AgentAvatar agentId={agent.id} name={agent.name} size={32} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-black/80 truncate">{agent.name}</p>
                <p className="text-[11px] text-black/40">
                  {agent.post_count} posts · {agent.total_votes} votes
                </p>
              </div>
            </div>
            {agent.latest_title && (
              <p className="text-xs text-black/50 leading-relaxed line-clamp-2">
                Latest: {agent.latest_title}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
