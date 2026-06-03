import { NextResponse } from "next/server";
import { listBranches, listMenuItems } from "../../../../../lib/restaurant-db";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";

function escapeHtml(value = "") {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function groupByCategory(items = []) {
  const groups = new Map();
  items.forEach((item) => {
    const category = item.category || "Món ăn";
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category).push(item);
  });
  return [...groups.entries()].map(([category, categoryItems]) => ({
    category,
    items: categoryItems.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"))
  }));
}

function renderMenuHtml({ branch, items }) {
  const groups = groupByCategory(items);
  const today = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date());
  const branchName = branch?.name || "San Hô Đỏ";

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Menu ${escapeHtml(branchName)}</title>
    <style>
      @page { size: A4; margin: 16mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #f7efe5;
        color: #2f1814;
        font-family: "Be Vietnam Pro", "Segoe UI", sans-serif;
      }
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        justify-content: center;
        gap: 12px;
        padding: 14px;
        background: rgba(255, 250, 244, 0.92);
        border-bottom: 1px solid #ead8c8;
        backdrop-filter: blur(14px);
      }
      button {
        border: 0;
        border-radius: 999px;
        padding: 11px 18px;
        background: #b72d24;
        color: white;
        font-weight: 800;
        cursor: pointer;
      }
      .page {
        width: min(900px, calc(100vw - 24px));
        margin: 24px auto;
        padding: 42px;
        background: #fffaf4;
        border: 1px solid #ead8c8;
        border-radius: 32px;
        box-shadow: 0 24px 80px rgba(74, 31, 23, 0.12);
      }
      .header {
        display: grid;
        gap: 10px;
        padding-bottom: 24px;
        border-bottom: 2px solid #b72d24;
      }
      .kicker {
        color: #b72d24;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        color: #8f211b;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(36px, 7vw, 68px);
        line-height: 0.92;
        text-transform: uppercase;
      }
      .meta {
        color: #7a6258;
        font-size: 14px;
        line-height: 1.6;
      }
      .category {
        margin-top: 28px;
        break-inside: avoid;
      }
      h2 {
        display: inline-flex;
        margin: 0 0 14px;
        border-radius: 999px;
        background: #f3d9cf;
        padding: 8px 14px;
        color: #8f211b;
        font-size: 14px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .dish {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        padding: 14px 0;
        border-bottom: 1px dashed #dcc4b6;
        break-inside: avoid;
      }
      .dish strong {
        display: block;
        color: #2f1814;
        font-size: 17px;
      }
      .dish p {
        margin: 5px 0 0;
        color: #80685d;
        font-size: 13px;
        line-height: 1.55;
      }
      .price {
        color: #b72d24;
        font-size: 16px;
        font-weight: 900;
        white-space: nowrap;
      }
      .badge {
        display: inline-flex;
        margin-left: 8px;
        border-radius: 999px;
        background: #fff0d7;
        padding: 3px 8px;
        color: #9b4a16;
        font-size: 11px;
        font-weight: 800;
      }
      @media print {
        body { background: white; }
        .toolbar { display: none; }
        .page {
          width: auto;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 0;
          box-shadow: none;
          background: white;
        }
      }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <button onclick="window.print()">In / Lưu PDF</button>
    </div>
    <main class="page">
      <section class="header">
        <span class="kicker">San Hô Đỏ Menu</span>
        <h1>${escapeHtml(branchName)}</h1>
        <div class="meta">
          ${branch?.address ? `${escapeHtml(branch.address)}<br />` : ""}
          ${branch?.phone ? `Hotline: ${escapeHtml(branch.phone)}<br />` : ""}
          Cập nhật: ${escapeHtml(today)}
        </div>
      </section>
      ${groups
        .map(
          (group) => `<section class="category">
            <h2>${escapeHtml(group.category)}</h2>
            ${group.items
              .map(
                (item) => `<article class="dish">
                  <div>
                    <strong>${escapeHtml(item.name)}${item.isFeatured ? '<span class="badge">Nổi bật</span>' : ""}</strong>
                    <p>${escapeHtml(item.description || item.seasonNote || "Món đang được phục vụ tại nhà hàng.")}</p>
                  </div>
                  <div class="price">${escapeHtml(formatCurrency(item.price))}</div>
                </article>`
              )
              .join("")}
          </section>`
        )
        .join("")}
    </main>
  </body>
</html>`;
}

export async function GET(request) {
  const context = await requireAdminApi("menu.view");
  if (!context) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId") || "";
  const [items, branches] = await Promise.all([
    listMenuItems(context.supabase, { branchId }),
    listBranches(context.supabase, { activeOnly: false })
  ]);
  const branch = branches.find((item) => item.id === branchId) || branches[0] || null;

  return new NextResponse(renderMenuHtml({ branch, items }), {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}
