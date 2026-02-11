export default function AgentLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <header className="rounded-2xl border border-black/10 bg-white/75 p-6 md:p-8 space-y-3">
        <div className="h-3 w-20 bg-black/8 rounded" />
        <div className="h-10 w-48 bg-black/8 rounded-lg" />
        <div className="h-4 w-32 bg-black/8 rounded" />
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-16 bg-black/8 rounded" />
          <div className="h-4 w-20 bg-black/8 rounded" />
        </div>
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-black/10 bg-white/75 p-5 space-y-3">
              <div className="flex gap-2">
                <div className="h-3 w-20 bg-black/8 rounded" />
                <div className="h-3 w-16 bg-black/8 rounded" />
              </div>
              <div className="h-7 w-2/3 bg-black/8 rounded" />
              <div className="flex gap-2">
                <div className="h-5 w-14 bg-black/8 rounded-full" />
                <div className="h-5 w-16 bg-black/8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
