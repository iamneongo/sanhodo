import { Skeleton } from "@/components/ui/skeleton";
import AdminContentSkeleton from "./admin-content-skeleton";

export default function AdminRouteSkeleton({ detail = false }) {
  return (
    <div className="flex min-h-svh w-full bg-zinc-50">
      <aside className="hidden h-svh w-[17rem] shrink-0 border-r border-zinc-200/80 bg-white md:flex md:flex-col">
        <div className="grid gap-4 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-1">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="grid gap-2 px-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="grid gap-2 px-1">
            <Skeleton className="h-3 w-20" />
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="mt-auto grid gap-3 p-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </aside>

      <main className="relative flex min-h-svh min-w-0 flex-1 flex-col bg-white md:m-2 md:ml-0 md:rounded-xl md:border md:border-zinc-200/80 md:shadow-sm">
        <header className="flex h-14 items-center justify-between gap-4 border-b border-zinc-200 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-md" />
            <div className="grid gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-36" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-8 w-10 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </header>

        <AdminContentSkeleton detail={detail} />
      </main>
    </div>
  );
}
