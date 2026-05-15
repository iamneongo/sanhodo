import { Skeleton } from "@/components/ui/skeleton";
import AdminContentSkeleton from "./admin-content-skeleton";

export default function AdminRouteSkeleton({ detail = false }) {
  return (
    <main className="relative flex min-h-svh min-w-0 flex-1 flex-col bg-zinc-50">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur md:px-6">
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
  );
}
