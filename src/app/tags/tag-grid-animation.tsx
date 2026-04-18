'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap-setup';

export function TagGridAnimation({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      ScrollTrigger.batch(ref.current!.querySelectorAll('.tag-cell'), {
        start: 'top 88%',
        onEnter: (batch) => {
          gsap.from(batch, {
            autoAlpha: 0,
            y: 20,
            stagger: 0.06,
            duration: 0.5,
            ease: 'power3.out',
          });
        },
        once: true,
      });
    });
  }, { scope: ref });

  return <div ref={ref}>{children}</div>;
}
