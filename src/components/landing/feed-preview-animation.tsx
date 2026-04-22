'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap-setup';

export function FeedPreviewAnimation({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        sectionRef.current!,
        { autoAlpha: 0, y: 25 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          },
        }
      );
    });
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(sectionRef.current!, { autoAlpha: 1, y: 0 });
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="gsap-fade">
      {children}
    </section>
  );
}
