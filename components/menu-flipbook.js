"use client";

import dynamic from "next/dynamic";
import { forwardRef, useEffect, useState } from "react";
import { BookOpen, LoaderCircle } from "lucide-react";

const HTMLFlipBook = dynamic(() => import("react-pageflip"), {
  ssr: false
});

const MENU_COPY = {
  vi: {
    kicker: "Menu album",
    title: "Lật từng trang menu như đang xem quyển thực đơn tại bàn",
    description:
      "Xem trực tiếp menu PDF của chi nhánh, lật từng trang để khách cảm nhận rõ bố cục, món và phong cách trình bày.",
    openPdf: "Mở PDF toàn màn hình",
    loading: "Đang tải menu PDF...",
    error: "Chưa render được menu ngay lúc này. Bạn vẫn có thể mở PDF gốc."
  },
  en: {
    kicker: "Menu album",
    title: "Flip through the menu like a premium printed booklet",
    description:
      "Preview the actual PDF menu page by page so guests can feel the structure, dishes and visual style before booking.",
    openPdf: "Open full PDF",
    loading: "Loading the PDF menu...",
    error: "The menu preview is unavailable right now. You can still open the original PDF."
  },
  zh: {
    kicker: "菜单画册",
    title: "像翻阅餐桌菜单一样逐页查看",
    description:
      "直接预览分店菜单 PDF，逐页翻看整体排版、菜品内容与呈现风格。",
    openPdf: "打开完整 PDF",
    loading: "正在加载菜单 PDF...",
    error: "暂时无法生成菜单预览，你仍可打开原始 PDF。"
  }
};

const FlipPage = forwardRef(function FlipPage({ src, alt }, ref) {
  return (
    <div className="menu-flipbook-page-sheet" ref={ref}>
      <div className="menu-flipbook-page-inner">
        <img src={src} alt={alt} loading="eager" decoding="async" />
      </div>
    </div>
  );
});

function resolveLocale(locale = "vi") {
  return MENU_COPY[locale] ? locale : "vi";
}

const MENU_MANIFEST_URL = "/assets/menu/sanhodo-hotram-seafood-2026/manifest.json";

export default function MenuFlipbook({
  locale = "vi",
  pdfUrl,
  branchName = "San Hô Đỏ Hồ Tràm"
}) {
  const activeLocale = resolveLocale(locale);
  const copy = MENU_COPY[activeLocale];
  const [pages, setPages] = useState([]);
  const [pageSize, setPageSize] = useState({ width: 430, height: 610 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadManifest = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(MENU_MANIFEST_URL, { cache: "force-cache" });
        if (!response.ok) {
          throw new Error(`Manifest request failed: ${response.status}`);
        }
        const manifest = await response.json();
        const nextPages = Array.isArray(manifest.pages)
          ? manifest.pages.map((src, index) => ({
              pageNumber: index + 1,
              src
            }))
          : [];

        if (!nextPages.length) {
          throw new Error("Manifest contains no pages");
        }

        if (!cancelled) {
          setPages(nextPages);
          setPageSize({
            width: Number(manifest.width) || 1072,
            height: Number(manifest.height) || 1516
          });
        }
      } catch (manifestError) {
        if (!cancelled) {
          console.error("Menu flipbook manifest failed:", manifestError);
          setError(copy.error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadManifest();

    return () => {
      cancelled = true;
    };
  }, [copy.error, pdfUrl]);

  const totalPages = pages.length;

  return (
    <div className="menu-flipbook-shell reveal">
      <div className="menu-flipbook-stage">
        {loading ? (
          <div className="menu-flipbook-loading" role="status" aria-live="polite">
            <LoaderCircle className="size-5 animate-spin" />
            <span>{copy.loading}</span>
          </div>
        ) : error ? (
          <div className="menu-flipbook-loading is-error">
            <BookOpen className="size-5" />
            <span>{error}</span>
          </div>
        ) : totalPages && mounted ? (
          <div className="menu-flipbook-bookwrap">
            <HTMLFlipBook
              width={pageSize.width}
              height={pageSize.height}
              size="stretch"
              minWidth={260}
              maxWidth={pageSize.width}
              minHeight={360}
              maxHeight={pageSize.height}
              maxShadowOpacity={0.28}
              showCover
              drawShadow
              useMouseEvents
              mobileScrollSupport={false}
              flippingTime={900}
              className="menu-flipbook-book"
            >
              {pages.map((page) => (
                <FlipPage
                  key={page.pageNumber}
                  src={page.src}
                  alt={`${branchName} menu page ${page.pageNumber}`}
                />
              ))}
            </HTMLFlipBook>
          </div>
        ) : null}
      </div>
    </div>
  );
}
