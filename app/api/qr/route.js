import { NextResponse } from "next/server";
import QRCode from "qrcode";

function clampNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function sanitizeFileName(value) {
  return String(value || "sanhodo-qr")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "sanhodo-qr";
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = searchParams.get("data") || "";
    const size = clampNumber(searchParams.get("size"), 160, 1200, 360);
    const margin = clampNumber(searchParams.get("margin"), 0, 8, 2);
    const download = searchParams.get("download") === "1";
    const name = sanitizeFileName(searchParams.get("name"));

    if (!data.trim()) {
      return NextResponse.json({ error: "Missing QR data" }, { status: 400 });
    }

    if (data.length > 2048) {
      return NextResponse.json({ error: "QR data is too long" }, { status: 400 });
    }

    const svg = await QRCode.toString(data, {
      type: "svg",
      width: size,
      margin,
      color: {
        dark: "#7f1d1d",
        light: "#fffaf3"
      },
      errorCorrectionLevel: "M"
    });

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        ...(download ? { "Content-Disposition": `attachment; filename="${name}.svg"` } : {})
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không tạo được QR" }, { status: 500 });
  }
}
