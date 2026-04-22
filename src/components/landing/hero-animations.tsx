'use client';

import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap-setup';

export function HeroAnimations() {
  useGSAP(() => {
    const section = document.querySelector('[data-hero-section]');
    if (!section) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: '(min-width: 768px)',
        reduceMotion: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { reduceMotion, isDesktop } = context.conditions!;
        if (reduceMotion) {
          gsap.set(section.querySelectorAll('.gsap-fade'), { autoAlpha: 1, y: 0 });
          gsap.set(section.querySelector('.hero-headline')!, { autoAlpha: 1 });
          section.querySelectorAll('.stat-number').forEach((el) => {
            const val = Number((el as HTMLElement).dataset.value || 0);
            el.textContent = val.toLocaleString();
          });
          return;
        }

        // ── Hero headline SplitText ──
        const headline = section.querySelector('.hero-headline') as HTMLElement;
        if (headline) {
          SplitText.create(headline, {
            type: 'words',
            autoSplit: true,
            onSplit(self) {
              return gsap.from(self.words, {
                y: 50,
                autoAlpha: 0,
                stagger: 0.04,
                duration: 0.7,
                ease: 'power3.out',
                delay: 0.2,
              });
            },
          });
        }

        // ── Fade in elements ──
        gsap.to(section.querySelectorAll('.gsap-fade'), {
          autoAlpha: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.6,
          ease: 'power2.out',
          delay: 0.5,
        });

        // ── Stat counter ──
        section.querySelectorAll('.stat-number').forEach((el) => {
          const target = Number((el as HTMLElement).dataset.value || 0);
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: 1.5,
            ease: 'power2.out',
            delay: 0.8,
            snap: { val: 1 },
            onUpdate() {
              el.textContent = Math.round(obj.val).toLocaleString();
            },
          });
        });

        // ── Hero parallax (desktop only) ──
        if (isDesktop) {
          const heroImg = section.querySelector('.gsap-hero-img');
          if (heroImg) {
            gsap.to(heroImg, {
              yPercent: 15,
              ease: 'none',
              scrollTrigger: {
                trigger: heroImg,
                start: 'top top',
                end: 'bottom top',
                scrub: true,
              },
            });
          }
        }
      }
    );
  });

  return null;
}
