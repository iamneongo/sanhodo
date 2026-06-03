import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";

const MENU_TEMPLATE_HEADERS = [
  "ma_mon",
  "ten_mon",
  "danh_muc",
  "gia_ban",
  "mo_ta",
  "trang_thai",
  "mon_noi_bat",
  "duong_dan_anh",
  "ghi_chu_theo_mua"
];

function csvEscape(value = "") {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET() {
  const context = await requireAdminApi("menu.view");
  if (!context) {
    return unauthorizedResponse();
  }

  const rows = [
    MENU_TEMPLATE_HEADERS,
    [
      "tom-hum-nuong-pho-mai",
      "Tôm hùm nướng phô mai",
      "Hải sản",
      "1250000",
      "Tôm hùm tươi nướng phô mai béo nhẹ.",
      "available",
      "yes",
      "",
      "Món nổi bật cuối tuần"
    ]
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="san-ho-do-menu-template.csv"'
    }
  });
}
