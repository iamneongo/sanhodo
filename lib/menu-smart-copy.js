const CATEGORY_PROFILES = [
  {
    match: ["hải sản", "hai san", "seafood", "tôm", "tom", "cua", "ốc", "oc", "mực", "muc"],
    tone: "vị biển tươi ngọt",
    pairing: "rau xanh, cơm niêu nóng hoặc một món nướng bơ tỏi",
    occasion: "bàn gia đình, tiếp khách hoặc nhóm du lịch biển"
  },
  {
    match: ["cơm", "com", "niêu", "nieu", "lẩu", "lau", "bbq"],
    tone: "ấm nóng, đậm đà và dễ chia sẻ",
    pairing: "hải sản nướng, rau xào và nước chấm đặc trưng",
    occasion: "bữa trưa đông người hoặc buổi tối quây quần"
  },
  {
    match: ["coffee", "cafe", "cà phê", "ca phe", "nước", "nuoc", "dessert", "tráng miệng"],
    tone: "nhẹ nhàng, cân vị và dễ thưởng thức",
    pairing: "món khai vị nhẹ hoặc món tráng miệng theo mùa",
    occasion: "khách nghỉ chân, hẹn gặp nhanh hoặc dùng sau bữa chính"
  }
];

function normalize(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function pickProfile(name = "", category = "") {
  const haystack = `${normalize(name)} ${normalize(category)}`;
  return (
    CATEGORY_PROFILES.find((profile) => profile.match.some((keyword) => haystack.includes(normalize(keyword)))) || {
      tone: "hài hòa, dễ ăn và được trình bày chỉn chu",
      pairing: "một món rau, món nóng hoặc thức uống phù hợp",
      occasion: "bàn gia đình, nhóm bạn và khách du lịch"
    }
  );
}

function formatPrice(value) {
  const price = Number(value || 0);
  if (!Number.isFinite(price) || price <= 0) {
    return "";
  }
  return `, mức giá ${new Intl.NumberFormat("vi-VN").format(price)}đ`;
}

export function generateMenuSmartCopy(payload = {}) {
  const name = String(payload.name || "").trim();
  const category = String(payload.category || "Món ngon").trim();
  const profile = pickProfile(name, category);
  const priceText = formatPrice(payload.price);
  const dishName = name || "Món signature";

  return {
    title: `${dishName} - ${category}`,
    description: `${dishName} mang ${profile.tone}${priceText}, phù hợp cho ${profile.occasion}. Món được chuẩn bị theo phong cách San Hô Đỏ: nguyên liệu rõ vị, trình bày gọn đẹp và dễ gọi thêm trong bữa.`,
    seasonNote: `Gợi ý upsell: kết hợp cùng ${profile.pairing}. Nếu là món theo mùa, nên xác nhận tình trạng trước giờ cao điểm.`,
    tags: [category, profile.tone, "San Hô Đỏ"].filter(Boolean)
  };
}
