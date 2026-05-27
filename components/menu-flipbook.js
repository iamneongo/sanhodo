"use client";

import dynamic from "next/dynamic";
import { forwardRef, useEffect, useRef, useState } from "react";
import { BookOpen, LoaderCircle, X } from "lucide-react";

const HTMLFlipBook = dynamic(() => import("react-pageflip"), {
  ssr: false
});

const MENU_COPY = {
  vi: {
    loading: "Dang tai menu...",
    error: "Chua render duoc menu ngay luc nay. Ban van co the mo PDF goc."
  },
  en: {
    loading: "Loading the menu...",
    error: "The menu preview is unavailable right now. You can still open the original PDF."
  },
  zh: {
    loading: "正在加载菜单...",
    error: "暂时无法生成菜单预览，你仍可打开原始 PDF。"
  }
};

const MENU_MANIFEST_URL = "/assets/menu/sanhodo-hotram-seafood-2026/manifest.json";

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
  branchName = "San Ho Do Ho Tram"
}) {
  const activeLocale = resolveLocale(locale);
  const copy = MENU_COPY[activeLocale];
  const [pages, setPages] = useState([]);
  const [pageSize, setPageSize] = useState({ width: 430, height: 610 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastTapRef = useRef(0);
  const fullscreenRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const currentElement = document.fullscreenElement || document.webkitFullscreenElement || null;
      setIsFullscreen(currentElement === fullscreenRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
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

  const openFullscreen = async () => {
    const container = fullscreenRef.current;
    if (!container) {
      return;
    }

    try {
      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (fullscreenError) {
      console.error("Unable to open fullscreen menu:", fullscreenError);
    }
  };

  const closeFullscreen = async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (fullscreenError) {
      console.error("Unable to close fullscreen menu:", fullscreenError);
    } finally {
      setIsFullscreen(false);
    }
  };

  const handleBookTouchEnd = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      openFullscreen();
    }
    lastTapRef.current = now;
  };

  const renderBook = () => (
    <div
      className={`menu-flipbook-bookwrap${isFullscreen ? " is-fullscreen" : ""}`}
      onDoubleClick={openFullscreen}
      onTouchEnd={handleBookTouchEnd}
      role="button"
      tabIndex={0}
      aria-label={`Open ${branchName} menu in fullscreen`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openFullscreen();
        }
      }}
    >
      <HTMLFlipBook
        width={pageSize.width}
        height={pageSize.height}
        size="stretch"
        minWidth={isFullscreen ? 320 : 260}
        maxWidth={pageSize.width}
        minHeight={isFullscreen ? 460 : 360}
        maxHeight={pageSize.height}
        maxShadowOpacity={0.28}
        showCover
        drawShadow
        useMouseEvents
        mobileScrollSupport={false}
        flippingTime={900}
        className={`menu-flipbook-book${isFullscreen ? " is-fullscreen" : ""}`}
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
  );

  return (
    <div className={`menu-flipbook-shell reveal${isFullscreen ? " is-fullscreen" : ""}`} ref={fullscreenRef}>
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
          <>
            {isFullscreen ? (
              <button type="button" className="menu-flipbook-fullscreen-close" onClick={closeFullscreen} aria-label="Close fullscreen menu">
                <X className="size-5" />
              </button>
            ) : null}
            {renderBook()}
          </>
        ) : null}
      </div>
    </div>
  );
}
