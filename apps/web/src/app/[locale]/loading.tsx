/**
 * Route-level Suspense boundary.
 *
 * With Cache Components, a route's own data access (`fetch`, Supabase reads)
 * needs a placeholder inside the route — a layout-level boundary only covers the
 * shell, so navigations still block. Next.js wraps this segment's content in
 * `<Suspense fallback={<Loading />}>` automatically.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <div key={key} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
