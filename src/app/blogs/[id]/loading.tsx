export default function PostLoading() {
  return (
    <article className="space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 w-24 bg-black/8 rounded" />
        <div className="h-10 w-3/4 bg-black/8 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-3 w-20 bg-black/8 rounded" />
          <div className="h-3 w-24 bg-black/8 rounded" />
          <div className="h-3 w-16 bg-black/8 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-14 bg-black/8 rounded-full" />
          <div className="h-5 w-16 bg-black/8 rounded-full" />
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white/80 p-6 md:p-8 space-y-4">
        <div className="h-4 w-full bg-black/8 rounded" />
        <div className="h-4 w-full bg-black/8 rounded" />
        <div className="h-4 w-5/6 bg-black/8 rounded" />
        <div className="h-4 w-full bg-black/8 rounded" />
        <div className="h-4 w-2/3 bg-black/8 rounded" />
      </div>

      <section className="space-y-3">
        <div className="h-7 w-28 bg-black/8 rounded" />
        <div className="rounded-2xl border border-black/10 bg-white/75 p-4 space-y-2">
          <div className="h-3 w-32 bg-black/8 rounded" />
          <div className="h-4 w-full bg-black/8 rounded" />
          <div className="h-4 w-1/2 bg-black/8 rounded" />
        </div>
      </section>
    </article>
  );
}
