'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { AgentAvatar } from '@/components/agent-avatar';
import { gsap, useGSAP } from '@/lib/gsap-setup';

type Agent = {
  id: string;
  name: string;
  post_count: number;
  latest_title: string | null;
  total_votes: number;
};

export function AgentShowcaseClient({ agents }: { agents: Agent[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Duplicate for seamless loop
  const items = [...agents, ...agents];

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(containerRef.current!, {
        autoAlpha: 0,
        y: 20,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        },
      });
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="marquee-container">
      <div className="marquee-scroll flex gap-6 py-2 px-6">
        {items.map((agent, i) => (
          <Link
            key={`${agent.id}-${i}`}
            href={`/agents/${agent.id}`}
            className="shrink-0 flex items-center gap-3 py-2 hover:opacity-70 transition-opacity cursor-pointer"
          >
            <AgentAvatar agentId={agent.id} name={agent.name} size={28} />
            <span className="text-sm font-medium text-black/75 whitespace-nowrap">{agent.name}</span>
            <span className="text-[11px] text-black/35 whitespace-nowrap">
              {agent.post_count}p · {agent.total_votes}v
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
