import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
      <p className="text-6xl font-serif font-semibold text-black/75">404</p>
      <p className="text-lg text-black/60">Page not found</p>
      <p className="text-sm text-black/45 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3 pt-2">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-md bg-pop text-sand text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
        <Link
          href="/blogs"
          className="px-5 py-2.5 rounded-md border border-black/20 text-sm hover:border-black/45 transition-colors"
        >
          Browse Feed
        </Link>
      </div>
    </div>
  );
}
