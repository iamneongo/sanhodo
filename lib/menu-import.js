import { createMenuItem, listMenuItems } from "./restaurant-db";

const HEADER_ALIASES = {
  ma_mon: ["ma_mon", "mã món", "ma mon", "slug", "code"],
  ten_mon: ["ten_mon", "tên món", "ten mon", "name"],
  danh_muc: ["danh_muc", "danh mục", "danh muc", "category"],
  gia_ban: ["gia_ban", "giá bán", "gia ban", "price"],
  mo_ta: ["mo_ta", "mô tả", "mo ta", "description"],
  trang_thai: ["trang_thai", "trạng thái", "trang thai", "status", "availability"],
  mon_noi_bat: ["mon_noi_bat", "món nổi bật", "mon noi bat", "featured"],
  hien_thi: ["hien_thi", "hiển thị", "hien thi", "available", "visible"],
  duong_dan_anh: ["duong_dan_anh", "đường dẫn ảnh", "duong dan anh", "image", "image_url"],
  ghi_chu_theo_mua: ["ghi_chu_theo_mua", "ghi chú theo mùa", "ghi chu theo mua", "season_note"]
};

function normalizeHeader(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, "");
}

export function parseMenuCsv(text = "") {
  const rows = [];
  let cell = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((item) => String(item).trim())) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((item) => String(item).trim())) {
    rows.push(row);
  }

  return rows;
}

function resolveHeaderIndexes(headers) {
  const normalized = headers.map(normalizeHeader);
  return Object.fromEntries(
    Object.entries(HEADER_ALIASES).map(([key, aliases]) => [
      key,
      normalized.findIndex((header) => aliases.includes(header))
    ])
  );
}

function getCell(row, indexes, key) {
  const index = indexes[key];
  return index >= 0 ? String(row[index] || "").trim() : "";
}

function slugify(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseMoney(value = "") {
  const normalized = String(value || "").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
}

function parseBoolean(value = "", fallback = false) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["yes", "true", "1", "co", "có", "x", "noi bat", "nổi bật"].includes(normalized)) {
    return true;
  }
  if (["no", "false", "0", "khong", "không", "thuong", "thường"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function normalizeStatus(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (["hidden", "hide", "an", "ẩn"].includes(normalized)) return "hidden";
  if (["sold_out", "sold-out", "het", "hết", "het mon", "hết món"].includes(normalized)) return "sold_out";
  if (["seasonal", "theo mua", "theo mùa"].includes(normalized)) return "seasonal";
  return "available";
}

export async function importMenuItemsFromCsv(supabase, { csvText = "", branchId = "" } = {}) {
  const rows = parseMenuCsv(csvText);

  if (rows.length < 2) {
    throw new Error("File CSV cần có dòng tiêu đề và ít nhất một món ăn.");
  }

  const indexes = resolveHeaderIndexes(rows[0]);
  if (indexes.ten_mon < 0) {
    throw new Error("CSV thiếu cột ten_mon / Tên món.");
  }

  const existing = await listMenuItems(supabase, { branchId });
  const existingSlugs = new Set(existing.map((item) => String(item.slug || "").toLowerCase()));
  const existingNames = new Set(existing.map((item) => String(item.name || "").trim().toLowerCase()));
  const seenSlugs = new Set();
  const seenNames = new Set();
  const errors = [];
  const created = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const lineNumber = rowIndex + 1;
    const name = getCell(row, indexes, "ten_mon");
    const slug = getCell(row, indexes, "ma_mon") || slugify(name);
    const price = parseMoney(getCell(row, indexes, "gia_ban"));

    if (!name) {
      errors.push({ line: lineNumber, message: "Thiếu tên món." });
      continue;
    }

    if (!Number.isFinite(price)) {
      errors.push({ line: lineNumber, message: "Giá bán không hợp lệ." });
      continue;
    }

    const normalizedSlug = String(slug || "").toLowerCase();
    const normalizedName = name.toLowerCase();
    if (existingSlugs.has(normalizedSlug) || seenSlugs.has(normalizedSlug)) {
      errors.push({ line: lineNumber, message: `Trùng mã món: ${slug}.` });
      continue;
    }
    if (existingNames.has(normalizedName) || seenNames.has(normalizedName)) {
      errors.push({ line: lineNumber, message: `Trùng tên món: ${name}.` });
      continue;
    }

    const payload = {
      branchId,
      slug,
      name,
      category: getCell(row, indexes, "danh_muc") || "Hải sản",
      price,
      description: getCell(row, indexes, "mo_ta"),
      availabilityStatus: normalizeStatus(getCell(row, indexes, "trang_thai")),
      isAvailable: parseBoolean(getCell(row, indexes, "hien_thi"), true),
      isFeatured: parseBoolean(getCell(row, indexes, "mon_noi_bat"), false),
      imageUrl: getCell(row, indexes, "duong_dan_anh"),
      seasonNote: getCell(row, indexes, "ghi_chu_theo_mua")
    };

    const item = await createMenuItem(supabase, payload);
    created.push(item);
    seenSlugs.add(normalizedSlug);
    seenNames.add(normalizedName);
  }

  return {
    created,
    createdCount: created.length,
    errorCount: errors.length,
    errors
  };
}
