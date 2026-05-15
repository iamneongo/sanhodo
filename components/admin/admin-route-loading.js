export default function AdminRouteLoading({ detail = false }) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-zinc-50 px-6 py-12">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-8 py-8 text-center shadow-sm">
        <div className="size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
        <div className="grid gap-1">
          <strong className="text-sm font-semibold text-zinc-900">
            {detail ? "Đang tải chi tiết" : "Đang tải nội dung"}
          </strong>
          <p className="text-sm text-zinc-500">Dữ liệu sẽ xuất hiện ngay khi sẵn sàng.</p>
        </div>
      </div>
    </div>
  );
}
