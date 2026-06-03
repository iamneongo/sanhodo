import { NextResponse } from "next/server";
import { importMenuItemsFromCsv } from "../../../../../lib/menu-import";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";

const MAX_CSV_BYTES = 3 * 1024 * 1024;

function toGoogleSheetCsvUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) {
    throw new Error("Vui lòng nhập link Google Sheet đã publish CSV.");
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Link Google Sheet không hợp lệ.");
  }

  if (url.protocol !== "https:") {
    throw new Error("Chỉ hỗ trợ link https.");
  }

  if (url.hostname.endsWith("docs.google.com")) {
    const sheetMatch = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
    const gid = url.searchParams.get("gid") || "0";

    if (sheetMatch?.[1] && !url.pathname.includes("/export")) {
      return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=csv&gid=${encodeURIComponent(gid)}`;
    }

    if (url.pathname.includes("/pubhtml")) {
      url.pathname = url.pathname.replace("/pubhtml", "/pub");
      url.searchParams.set("output", "csv");
      return url.toString();
    }
  }

  return url.toString();
}

async function fetchCsvText(sheetUrl) {
  const csvUrl = toGoogleSheetCsvUrl(sheetUrl);
  const response = await fetch(csvUrl, {
    cache: "no-store",
    headers: {
      Accept: "text/csv,text/plain,*/*"
    }
  });

  if (!response.ok) {
    throw new Error("Không đọc được Google Sheet. Hãy kiểm tra Sheet đã được share/publish public.");
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_CSV_BYTES) {
    throw new Error("File Google Sheet quá lớn. Vui lòng tách nhỏ menu hoặc import bằng CSV.");
  }

  const csvText = new TextDecoder("utf-8").decode(buffer);
  if (/^\s*<!doctype html/i.test(csvText) || /^\s*<html/i.test(csvText)) {
    throw new Error("Link hiện trả về HTML, chưa phải CSV. Hãy dùng File > Share > Publish to web dạng CSV.");
  }

  return { csvText, csvUrl };
}

export async function POST(request) {
  const context = await requireAdminApi("menu.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const branchId = String(body.branchId || "").trim();
    const { csvText, csvUrl } = await fetchCsvText(body.sheetUrl);
    const data = await importMenuItemsFromCsv(context.supabase, { csvText, branchId });

    return NextResponse.json({
      ok: true,
      data: {
        ...data,
        sourceUrl: csvUrl
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không import được menu từ Google Sheet." },
      { status: 500 }
    );
  }
}
