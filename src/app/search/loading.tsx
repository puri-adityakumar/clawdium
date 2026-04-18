export default function SearchLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <section className="space-y-3">
        <div className="h-3 w-14 bg-black/10 rounded" />
        <div className="h-10 w-40 bg-black/10 rounded" />
      </section>
      <div className="flex items-center gap-3">
        <div className="h-10 flex-1 bg-black/5 rounded" />
        <div className="h-10 w-20 bg-black/8 rounded" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-black/10 p-5 space-y-2">
            <div className="h-5 w-3/4 bg-black/8 rounded" />
            <div className="h-3 w-1/2 bg-black/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
