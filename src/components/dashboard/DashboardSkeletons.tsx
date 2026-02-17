import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header skeleton */}
    <div>
      <Skeleton className="h-8 w-40 mb-2" />
      <Skeleton className="h-4 w-56" />
    </div>

    {/* Stats grid skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass rounded-xl p-3 sm:p-4 lg:p-6 border-glow">
          <Skeleton className="h-8 w-8 rounded-lg mb-3" />
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>

    {/* Quick actions skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass rounded-xl p-4 sm:p-6 border-glow">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Balance skeleton */}
    <div className="glass rounded-xl p-6 border-glow">
      <Skeleton className="h-5 w-32 mb-4" />
      <Skeleton className="h-10 w-48" />
    </div>
  </div>
);

export const FinanceiroSkeleton = () => (
  <div className="space-y-4 sm:space-y-6 animate-fade-in">
    <div>
      <Skeleton className="h-8 w-36 mb-2" />
      <Skeleton className="h-4 w-56" />
    </div>

    {/* Quick input skeleton */}
    <div className="glass rounded-xl p-4 border-glow">
      <Skeleton className="h-10 w-full" />
    </div>

    {/* Stats skeleton */}
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass rounded-xl p-3 sm:p-6 border-glow">
          <Skeleton className="h-6 w-6 rounded-lg mb-2" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>

    {/* List skeleton */}
    <div className="glass rounded-xl border-glow overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-border">
        <Skeleton className="h-4 w-40" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);

export const RotinasSkeleton = () => (
  <div className="space-y-4 sm:space-y-6 animate-fade-in">
    <div>
      <Skeleton className="h-8 w-28 mb-2" />
      <Skeleton className="h-4 w-52" />
    </div>

    {/* Progress skeleton */}
    <div className="glass rounded-xl p-4 sm:p-6 border-glow">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
    </div>

    {/* Tasks skeleton */}
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass rounded-xl p-3 border-glow flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 flex-1 max-w-[200px]" />
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const MetasSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Stats skeleton */}
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="glass rounded-xl p-4 sm:p-6 border-glow">
          <Skeleton className="h-8 w-8 rounded-lg mb-2" />
          <Skeleton className="h-3 w-20 mb-1" />
          <Skeleton className="h-8 w-10" />
        </div>
      ))}
    </div>

    {/* Goals skeleton */}
    {[...Array(3)].map((_, i) => (
      <div key={i} className="glass rounded-xl p-4 sm:p-6 border-glow">
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-3 w-56 mb-4" />
        <Skeleton className="h-2 w-full rounded-full mb-3" />
        <Skeleton className="h-3 w-24" />
      </div>
    ))}
  </div>
);
