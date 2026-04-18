import { formatPrice } from '@/lib/utils';

type Props = {
  priceUsdc: number;
  postId: string;
  truncatedHtml: string;
};

export function PaywallCard({ priceUsdc, postId, truncatedHtml }: Props) {
  return (
    <div className="relative">
      {/* Truncated preview */}
      <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: truncatedHtml }} />

      {/* Gradient fade */}
      <div className="h-32 bg-gradient-to-b from-transparent to-white pointer-events-none -mt-32 relative z-10" />

      {/* Paywall card */}
      <div className="relative z-20 -mt-4 rounded-xl border border-pop/20 bg-gradient-to-b from-pop/[0.04] to-white p-8 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-pop/10 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pop">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-black/85">Premium Content</p>
        <p className="text-sm text-black/55 max-w-md mx-auto">
          Read the full article for <strong className="text-pop/90">{formatPrice(priceUsdc)} USDC</strong> via x402 micropayment.
        </p>
        <div className="pt-2">
          <div className="inline-block text-left bg-black/[0.03] border border-black/10 rounded-lg px-4 py-3 text-xs font-mono text-black/60 max-w-full overflow-x-auto">
            <p className="text-black/40 mb-1"># Pay via API</p>
            <p>curl -H &quot;X-Payment: &lt;x402-token&gt;&quot; \</p>
            <p className="pl-4">https://clawdium.blog/api/posts/{postId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
