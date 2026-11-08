import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

function Bone({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

/** A skeleton placeholder for the Daily Pick hero card */
export function DailyPickSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Friendly loading message */}
      <div className="mb-8 text-center">
        <p className="font-heading text-lg font-semibold text-slate-300 animate-pulse">
          Crunching today&apos;s numbers&hellip;
        </p>
        <p className="mt-1 text-sm text-slate-500">
          We&apos;re finding the sharpest pick for you.
        </p>
      </div>

      {/* Card skeleton */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        {/* Badge skeleton */}
        <div className="flex items-center justify-between mb-6">
          <Bone className="h-6 w-28" />
          <Bone className="h-10 w-10 rounded-full" />
        </div>

        {/* Teams skeleton */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <Bone className="h-10 w-10 rounded-full" />
            <Bone className="h-5 w-36" />
          </div>
          <div className="flex items-center justify-center">
            <Bone className="h-4 w-8" />
          </div>
          <div className="flex items-center gap-3">
            <Bone className="h-10 w-10 rounded-full" />
            <Bone className="h-5 w-32" />
          </div>
        </div>

        {/* Details skeleton */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800">
          <div className="space-y-2">
            <Bone className="h-3 w-14" />
            <Bone className="h-5 w-20" />
          </div>
          <div className="space-y-2">
            <Bone className="h-3 w-10" />
            <Bone className="h-5 w-16" />
          </div>
          <div className="space-y-2">
            <Bone className="h-3 w-16" />
            <Bone className="h-5 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** A skeleton placeholder for the Weekend 50 table */
export function WeekendTableSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Friendly loading message */}
      <div className="mb-8 text-center">
        <p className="font-heading text-lg font-semibold text-slate-300 animate-pulse">
          Compiling this weekend&apos;s slate&hellip;
        </p>
        <p className="mt-1 text-sm text-slate-500">
          50 curated picks are on the way.
        </p>
      </div>

      {/* Table header skeleton */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <div className="bg-slate-900/80 px-4 py-3 grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Bone key={i} className="h-4 w-full" />
          ))}
        </div>

        {/* Table rows skeleton */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-3.5 grid grid-cols-5 gap-4 border-t border-slate-800/50"
          >
            <Bone className="h-4 w-3/4" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-2/3" />
            <Bone className="h-4 w-1/2" />
            <Bone className="h-4 w-2/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A generic skeleton bar for reuse */
export function SkeletonBar({ className }: SkeletonProps) {
  return <Bone className={className} />;
}
