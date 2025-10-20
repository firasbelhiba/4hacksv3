import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/80", className)}
      {...props}
    />
  )
}

// Specialized skeleton components
function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-6">
      <div className="space-y-3">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonActivity() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start space-x-3 p-3 rounded-lg bg-background/30 border border-border/30">
          <Skeleton className="h-4 w-4 rounded-full mt-1" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function SkeletonQuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonStats,
  SkeletonActivity,
  SkeletonQuickActions
}
