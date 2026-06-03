import { NextResponse } from "next/server";
import { listMenuItems } from "../../../../../lib/restaurant-db";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";

const MENU_EXPORT_HEADERS = [
  "ma_mon",
  "ten_mon",
  "danh_muc",
  "gia_ban",
  "mo_ta",
  "trang_thai",
  "mon_noi_bat",
  "hien_thi",
  "duong_dan_anh",
  "ghi_chu_theo_mua"
];

function csvEscape(value = "") {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET(request) {
  const context = await requireAdminApi("menu.view");
  if (!context) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId") || "";
  const items = await listMenuItems(context.supabase, { branchId });
  const rows = [
    MENU_EXPORT_HEADERS,
    ...items.map((item) => [
      item.slug,
      item.name,
      item.category,
      item.price,
      item.description,
      item.availabilityStatus,
      item.isFeatured ? "yes" : "no",
      item.isAvailable ? "yes" : "no",
      item.imageUrl,
      item.seasonNote
    ])
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="san-ho-do-menu-export.csv"'
    }
  });
}
