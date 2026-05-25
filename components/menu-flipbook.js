"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Download, LoaderCircle } from "lucide-react";
import HTMLFlipBook from "react-pageflip";

const MENU_COPY = {
  vi: {
    kicker: "Menu album",
    title: "Lật từng trang menu như đang xem quyển thực đơn tại bàn",
    description:
      "Xem trực tiếp menu PDF của chi nhánh, lật từng trang để khách cảm nhận rõ bố cục, món và phong cách trình bày.",
    prev: "Trang trước",
    next: "Trang sau",
    page: "Trang",
    of: "trên",
    openPdf: "Mở PDF toàn màn hình",
    loading: "Đang tải menu PDF...",
    error: "Chưa render được menu ngay lúc này. Bạn vẫn có thể mở PDF gốc."
  },
  en: {
    kicker: "Menu album",
    title: "Flip through the menu like a premium printed booklet",
    description:
      "Preview the actual PDF menu page by page so guests can feel the structure, dishes and visual style before booking.",
    prev: "Previous page",
    next: "Next page",
    page: "Page",
    of: "of",
    openPdf: "Open full PDF",
    loading: "Loading the PDF menu...",
    error: "The menu preview is unavailable right now. You can still open the original PDF."
  },
  zh: {
    kicker: "菜单画册",
    title: "像翻阅餐桌菜单一样逐页查看",
    description:
      "直接预览分店菜单 PDF，逐页翻看整体排版、菜品内容与呈现风格。",
    prev: "上一页",
    next: "下一页",
    page: "第",
    of: "页，共",
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

export default function MenuFlipbook({
  locale = "vi",
  pdfUrl,
  branchName = "San Hô Đỏ Hồ Tràm"
}) {
  const activeLocale = resolveLocale(locale);
  const copy = MENU_COPY[activeLocale];
  const bookRef = useRef(null);
  const [pages, setPages] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 430, height: 610 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const renderPdf = async () => {
      setLoading(true);
      setError("");

      try {
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const documentTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await documentTask.promise;
        const nextPages = [];
        let nextPageSize = null;

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const targetWidth = 880;
          const scale = Math.min(1.5, targetWidth / baseViewport.width);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { alpha: false });

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          await page.render({
            canvasContext: context,
            viewport
          }).promise;

          if (!nextPageSize) {
            nextPageSize = {
              width: Math.round(viewport.width),
              height: Math.round(viewport.height)
            };
          }

          nextPages.push({
            pageNumber,
            src: canvas.toDataURL("image/webp", 0.86)
          });
        }

        if (!cancelled) {
          setPages(nextPages);
          if (nextPageSize) {
            setPageSize(nextPageSize);
          }
          setPageIndex(0);
        }
      } catch (renderError) {
        if (!cancelled) {
          console.error("Menu PDF preview failed:", renderError);
          setError(copy.error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
    };
  }, [copy.error, pdfUrl]);

  const totalPages = pages.length;
  const statusLabel = useMemo(() => {
    if (!totalPages) {
      return "";
    }

    return activeLocale === "zh"
      ? `${copy.page}${pageIndex + 1}${copy.of}${totalPages}`
      : `${copy.page} ${pageIndex + 1} ${copy.of} ${totalPages}`;
  }, [activeLocale, copy.of, copy.page, pageIndex, totalPages]);

  const flipPrev = () => {
    if (!bookRef.current) {
      return;
    }
    bookRef.current.pageFlip().flipPrev();
  };

  const flipNext = () => {
    if (!bookRef.current) {
      return;
    }
    bookRef.current.pageFlip().flipNext();
  };

  return (
    <div className="menu-flipbook-shell reveal">
      <div className="menu-flipbook-topline">
        <div>
          <p className="menu-flipbook-kicker">{copy.kicker}</p>
          <h3>{copy.title}</h3>
        </div>
        <a
          className="menu-flipbook-link"
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          download
        >
          <Download className="size-4" />
          <span>{copy.openPdf}</span>
        </a>
      </div>
      <p className="menu-flipbook-description">
        {copy.description} <strong>{branchName}</strong>.
      </p>

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
        ) : totalPages ? (
          <div className="menu-flipbook-bookwrap">
            <HTMLFlipBook
              ref={bookRef}
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
              onFlip={(event) => setPageIndex(event.data)}
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

      <div className="menu-flipbook-controls">
        <button
          type="button"
          className="menu-flipbook-nav"
          onClick={flipPrev}
          disabled={loading || pageIndex === 0}
        >
          <ChevronLeft className="size-4" />
          <span>{copy.prev}</span>
        </button>
        <div className="menu-flipbook-status" aria-live="polite">
          {statusLabel}
        </div>
        <button
          type="button"
          className="menu-flipbook-nav"
          onClick={flipNext}
          disabled={loading || pageIndex >= totalPages - 1}
        >
          <span>{copy.next}</span>
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
