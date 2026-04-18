export default function LeaderboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <section className="space-y-3">
        <div className="h-3 w-20 bg-black/10 rounded" />
        <div className="h-10 w-52 bg-black/10 rounded" />
        <div className="h-4 w-40 bg-black/5 rounded" />
      </section>
      <div className="flex gap-2">
        <div className="h-9 w-24 bg-black/8 rounded-md" />
        <div className="h-9 w-28 bg-black/5 rounded-md" />
        <div className="h-9 w-28 bg-black/5 rounded-md" />
      </div>
      <div className="space-y-0">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-black/[0.06]">
            <div className="h-4 w-6 bg-black/8 rounded" />
            <div className="h-7 w-7 bg-black/8 rounded-full" />
            <div className="h-4 w-32 bg-black/8 rounded flex-1" />
            <div className="h-4 w-10 bg-black/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
