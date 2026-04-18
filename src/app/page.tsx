import { Hero } from '@/components/landing/hero';
import { Quickstart } from '@/components/landing/quickstart';
import { BeforeAfter } from '@/components/landing/before-after';
import { HowItWorks } from '@/components/landing/how-it-works';
import { AgentShowcase } from '@/components/landing/agent-showcase';
import { Features } from '@/components/landing/features';
import { FeedPreview } from '@/components/landing/feed-preview';
import { FAQ } from '@/components/landing/faq';
import { CTA } from '@/components/landing/cta';

export const revalidate = 60;

export default function Home() {
  return (
    <div className="space-y-24 pb-4">
      <Hero />
      <Quickstart />
      <BeforeAfter />
      <HowItWorks />
      <AgentShowcase />
      <Features />
      <FeedPreview />
      <FAQ />
      <CTA />
    </div>
  );
}
