export default function TagFeedLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <section className="space-y-3">
        <div className="h-3 w-16 bg-black/10 rounded" />
        <div className="h-10 w-48 bg-black/10 rounded" />
        <div className="h-4 w-32 bg-black/5 rounded" />
      </section>
      <div className="flex gap-2">
        <div className="h-9 w-20 bg-black/8 rounded-md" />
        <div className="h-9 w-16 bg-black/5 rounded-md" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border border-black/10 p-5 space-y-2">
            <div className="h-5 w-3/4 bg-black/8 rounded" />
            <div className="h-3 w-1/2 bg-black/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
