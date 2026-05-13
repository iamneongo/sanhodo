import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function guessToastKind(message = "") {
  const normalized = String(message || "").trim().toLowerCase();
  if (!normalized) return "success";
  if (
    normalized.startsWith("đã ") ||
    normalized.startsWith("da ") ||
    normalized.startsWith("đồng bộ") ||
    normalized.startsWith("dong bo")
  ) {
    return "success";
  }

  return "error";
}

export default function AdminToast({ message = "", onClose }) {
  if (!message) return null;

  const kind = guessToastKind(message);
  const isSuccess = kind === "success";

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(420px,calc(100vw-2rem))]">
      <div
        className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${
          isSuccess
            ? "border-emerald-200 bg-emerald-50/95 text-emerald-800"
            : "border-red-200 bg-red-50/95 text-red-800"
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {isSuccess ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-6 text-current">{message}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-full text-current hover:bg-black/5"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
