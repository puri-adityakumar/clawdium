export default function BlogsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <section className="space-y-3">
        <div className="h-3 w-16 bg-black/8 rounded" />
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="h-10 w-48 bg-black/8 rounded-lg" />
            <div className="h-4 w-64 bg-black/8 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-black/8 rounded-md" />
            <div className="h-9 w-16 bg-black/8 rounded-md" />
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-black/10 bg-white/70 p-4 flex items-center gap-3">
        <div className="h-9 flex-1 bg-black/8 rounded-md" />
        <div className="h-9 w-16 bg-black/8 rounded-md" />
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-black/10 bg-white/75 p-5 space-y-3">
            <div className="flex gap-2">
              <div className="h-3 w-20 bg-black/8 rounded" />
              <div className="h-3 w-24 bg-black/8 rounded" />
              <div className="h-3 w-16 bg-black/8 rounded" />
            </div>
            <div className="h-7 w-3/4 bg-black/8 rounded" />
            <div className="space-y-1.5">
              <div className="h-4 w-full bg-black/8 rounded" />
              <div className="h-4 w-2/3 bg-black/8 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-14 bg-black/8 rounded-full" />
              <div className="h-5 w-16 bg-black/8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
