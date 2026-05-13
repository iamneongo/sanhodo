import { Skeleton } from "@/components/ui/skeleton";

export default function AdminContentSkeleton({ detail = false, overlay = false }) {
  return (
    <div className={overlay ? "pointer-events-none absolute inset-0 z-30 bg-white/70 backdrop-blur-[1px]" : "w-full"}>
      <div className="grid w-full gap-4 p-4 md:gap-6 md:p-6">
        <div className="grid gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-56" />
        </div>

        {!detail ? (
          <>
            <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <Skeleton className="mb-3 h-4 w-20" />
                  <Skeleton className="mb-2 h-8 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="grid gap-3 md:grid-cols-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="grid gap-3 border-b border-zinc-200 p-5">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-52" />
              </div>
              <div className="grid gap-4 p-5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="grid items-center gap-3 md:grid-cols-5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="grid gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
