import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-200/80 ${className}`}
      {...props}
    />
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-zinc-50 border-b border-zinc-100 p-4 flex gap-4">
          {[...Array(cols)].map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        <div className="divide-y divide-zinc-100 p-4 space-y-4">
          {[...Array(rows)].map((_, r) => (
            <div key={r} className="flex gap-4 items-center">
              {[...Array(cols)].map((_, c) => (
                <Skeleton key={c} className="h-5 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
