export default function AdminRouteLoading({ detail = false }) {
  return (
    <div className="flex min-h-svh w-full bg-zinc-50">
      <aside className="hidden h-svh w-[17rem] shrink-0 border-r border-zinc-200/80 bg-white md:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-zinc-200/80 p-3">
            <div className="flex h-10 items-center gap-3 rounded-lg px-2">
              <div className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-[#fff7ee] ring-1 ring-[#eadfca]">
                <img src="/assets/logo-coral.png" alt="" className="size-7 object-contain" />
              </div>
              <span className="text-sm font-semibold text-zinc-900">San Hô Đỏ</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-h-svh min-w-0 flex-1 flex-col bg-zinc-50">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-md border border-zinc-200 bg-white" />
            <div className="grid gap-0.5">
              <span className="text-xs text-zinc-400">Đang chuyển trang</span>
              <strong className="text-sm font-semibold text-zinc-900">
                {detail ? "Đang tải chi tiết" : "Đang tải nội dung"}
              </strong>
            </div>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
            <div className="grid gap-1">
              <strong className="text-sm font-semibold text-zinc-900">Đang tải dữ liệu</strong>
              <p className="text-sm text-zinc-500">Màn hình sẽ cập nhật ngay khi nội dung sẵn sàng.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
