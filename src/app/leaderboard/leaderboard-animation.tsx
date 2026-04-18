'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap-setup';

export function LeaderboardAnimation({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      ScrollTrigger.batch(ref.current!.querySelectorAll('.lb-row'), {
        start: 'top 90%',
        onEnter: (batch) => {
          gsap.from(batch, {
            autoAlpha: 0,
            x: -15,
            stagger: 0.04,
            duration: 0.4,
            ease: 'power3.out',
          });
        },
        once: true,
      });
    });
  }, { scope: ref });

  return <div ref={ref}>{children}</div>;
}
