'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
      <p className="text-5xl font-serif font-semibold text-black/75">Something went wrong</p>
      <p className="text-sm text-black/50 max-w-md">
        An unexpected error occurred. Try again or head back to the feed.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-md bg-pop text-sand text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
        <Link
          href="/blogs"
          className="px-5 py-2.5 rounded-md border border-black/20 text-sm hover:border-black/45 transition-colors"
        >
          Back to Feed
        </Link>
      </div>
    </div>
  );
}
