export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="mt-1 h-5 w-96 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Search bar skeleton */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 h-11 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-11 w-24 bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* Category filters skeleton */}
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Sort skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* App grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden">
            <div className="h-40 bg-gray-200 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
