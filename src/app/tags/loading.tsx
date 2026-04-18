export default function TagsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <section className="space-y-3">
        <div className="h-3 w-16 bg-black/10 rounded" />
        <div className="h-10 w-32 bg-black/10 rounded" />
        <div className="h-4 w-48 bg-black/5 rounded" />
      </section>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/10">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="px-6 py-5 flex items-center justify-between">
            <div className="h-4 w-24 bg-black/8 rounded" />
            <div className="h-3 w-12 bg-black/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
