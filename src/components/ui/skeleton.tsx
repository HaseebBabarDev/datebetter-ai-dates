import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

// Loading skeleton for candidate cards
function CandidateCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-8 w-12 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

// Loading skeleton for dashboard stats
function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-lg border border-border bg-card">
          <Skeleton className="h-6 w-8 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

// Loading skeleton for interaction list
function InteractionListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

// Loading skeleton for profile form
function ProfileFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-10 w-full rounded-md" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <Skeleton className="h-20 w-full rounded-md" />
    </div>
  );
}

// Full page loading skeleton
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 space-y-4 safe-area-inset">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>
      <DashboardStatsSkeleton />
      <div className="space-y-3 mt-6">
        <CandidateCardSkeleton />
        <CandidateCardSkeleton />
        <CandidateCardSkeleton />
      </div>
    </div>
  );
}

export { 
  Skeleton, 
  CandidateCardSkeleton, 
  DashboardStatsSkeleton, 
  InteractionListSkeleton,
  ProfileFormSkeleton,
  PageSkeleton 
};
