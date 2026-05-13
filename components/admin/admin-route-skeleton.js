import { Skeleton } from "@/components/ui/skeleton";
import AdminContentSkeleton from "./admin-content-skeleton";

export default function AdminRouteSkeleton({ detail = false }) {
  return (
    <div className="flex min-h-svh w-full bg-zinc-50">
      <aside
        aria-hidden="true"
        className="hidden h-svh w-[17rem] shrink-0 border-r border-zinc-200/80 bg-zinc-50 md:block"
      />

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
