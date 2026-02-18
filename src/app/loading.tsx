export default function HomeLoading() {
  return (
    <div className="space-y-24 pb-4 animate-pulse">
      {/* Hero */}
      <section className="pt-8 md:pt-12 space-y-6 text-center">
        <div className="h-3 w-24 bg-black/8 rounded mx-auto" />
        <div className="h-12 w-3/4 bg-black/8 rounded-lg mx-auto" />
        <div className="h-5 w-1/2 bg-black/8 rounded mx-auto" />
        <div className="flex justify-center gap-3">
          <div className="h-10 w-32 bg-black/8 rounded-md" />
          <div className="h-10 w-28 bg-black/8 rounded-md" />
        </div>
      </section>

      {/* Before / After */}
      <section className="grid gap-4 md:grid-cols-[1fr_auto_1fr] items-stretch">
        <div className="rounded-2xl border border-black/10 bg-white/60 p-6 space-y-3">
          <div className="h-3 w-16 bg-black/8 rounded" />
          <div className="h-4 w-full bg-black/8 rounded" />
          <div className="h-4 w-2/3 bg-black/8 rounded" />
        </div>
        <div className="hidden md:flex items-center"><div className="h-6 w-6 bg-black/8 rounded" /></div>
        <div className="rounded-2xl border border-black/10 bg-white/60 p-6 space-y-3">
          <div className="h-3 w-20 bg-black/8 rounded" />
          <div className="h-4 w-full bg-black/8 rounded" />
          <div className="h-4 w-2/3 bg-black/8 rounded" />
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <div className="text-center space-y-3">
          <div className="h-8 w-52 bg-black/8 rounded mx-auto" />
          <div className="h-4 w-64 bg-black/8 rounded mx-auto" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-black/10 bg-white/60 p-5 space-y-2">
              <div className="h-7 w-6 bg-black/8 rounded" />
              <div className="h-4 w-12 bg-black/8 rounded" />
              <div className="h-4 w-full bg-black/8 rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="space-y-6">
        <div className="text-center space-y-3">
          <div className="h-8 w-40 bg-black/8 rounded mx-auto" />
          <div className="h-4 w-56 bg-black/8 rounded mx-auto" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-black/10 bg-white/60 p-5 space-y-3">
              <div className="h-3 w-20 bg-black/8 rounded" />
              <div className="h-4 w-full bg-black/8 rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* Latest posts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-44 bg-black/8 rounded" />
          <div className="h-4 w-16 bg-black/8 rounded" />
        </div>
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-black/10 bg-white/70 p-5 space-y-3">
              <div className="flex gap-2">
                <div className="h-3 w-20 bg-black/8 rounded" />
                <div className="h-3 w-24 bg-black/8 rounded" />
              </div>
              <div className="h-6 w-2/3 bg-black/8 rounded" />
              <div className="h-4 w-full bg-black/8 rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
