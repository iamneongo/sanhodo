export const DEFAULT_LANDING_PAGE_CONFIG = {
  seoTitle: "",
  seoDescription: "",
  heroEyebrow: "Nhà hàng",
  brandPrimary: "",
  brandSecondary: "",
  heroTitle: "",
  heroSubtitle: "",
  heroDescription:
    "Không gian ẩm thực sang trọng - Dấu ấn riêng tinh tế\nTrải nghiệm đáng nhớ trong từng bữa tiệc sum vầy",
  primaryCtaLabel: "Đặt bàn ngay",
  secondaryCtaLabel: "Gọi ngay",
  aboutTitle: "Không gian chỉn chu cho những buổi gặp gỡ đáng nhớ",
  aboutParagraphOne:
    "San Hô Đỏ mang đến trải nghiệm ẩm thực trọn vẹn với mặt tiền nổi bật, sảnh đón tiếp sang trọng và không gian bài trí chỉn chu cho những bữa ăn gia đình, tiếp khách hay hội họp.",
  aboutParagraphTwo:
    "Từ khu vực bàn tiệc rộng rãi đến phòng riêng ấm cúng, từng góc nhỏ đều được chăm chút để tạo cảm giác thoải mái, lịch sự và dễ lưu lại ấn tượng tốt với thực khách.",
  aboutBadgeTitle: "Mặt tiền",
  aboutBadgeSubtitle: "ấn tượng và sang trọng",
  featureSeafoodTitle: "Hải sản tươi sống",
  featureSeafoodDescription: "Nguồn hải sản tươi sống được tuyển chọn mỗi ngày cho chi nhánh.",
  featureChefTitle: "Đầu bếp chuyên nghiệp",
  featureChefDescription: "Đội ngũ đầu bếp giàu kinh nghiệm, chế biến tinh tế.",
  featureSpaceTitle: "Không gian tuyệt đẹp",
  featureSpaceDescription: "Không gian sang trọng, nhiều khu vực phù hợp tiếp khách và gia đình.",
  featureServiceTitle: "Phục vụ tận tâm",
  featureServiceDescription: "Đội ngũ nhân viên nhiệt tình, chu đáo, chuyên nghiệp.",
  footerDescription:
    "Bộ ảnh thực tế cho thấy một không gian chỉn chu, sang trọng và phù hợp cho nhiều nhu cầu dùng bữa, từ họp mặt gia đình đến tiếp khách và tổ chức tiệc nhỏ."
};

function cleanConfigText(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function normalizeLandingPageConfig(config = {}) {
  return {
    seoTitle: cleanConfigText(config.seoTitle),
    seoDescription: cleanConfigText(config.seoDescription),
    heroEyebrow: cleanConfigText(config.heroEyebrow, DEFAULT_LANDING_PAGE_CONFIG.heroEyebrow),
    brandPrimary: cleanConfigText(config.brandPrimary),
    brandSecondary: cleanConfigText(config.brandSecondary),
    heroTitle: cleanConfigText(config.heroTitle),
    heroSubtitle: cleanConfigText(config.heroSubtitle),
    heroDescription: cleanConfigText(
      config.heroDescription,
      DEFAULT_LANDING_PAGE_CONFIG.heroDescription
    ),
    primaryCtaLabel: cleanConfigText(
      config.primaryCtaLabel,
      DEFAULT_LANDING_PAGE_CONFIG.primaryCtaLabel
    ),
    secondaryCtaLabel: cleanConfigText(
      config.secondaryCtaLabel,
      DEFAULT_LANDING_PAGE_CONFIG.secondaryCtaLabel
    ),
    aboutTitle: cleanConfigText(config.aboutTitle, DEFAULT_LANDING_PAGE_CONFIG.aboutTitle),
    aboutParagraphOne: cleanConfigText(
      config.aboutParagraphOne,
      DEFAULT_LANDING_PAGE_CONFIG.aboutParagraphOne
    ),
    aboutParagraphTwo: cleanConfigText(
      config.aboutParagraphTwo,
      DEFAULT_LANDING_PAGE_CONFIG.aboutParagraphTwo
    ),
    aboutBadgeTitle: cleanConfigText(
      config.aboutBadgeTitle,
      DEFAULT_LANDING_PAGE_CONFIG.aboutBadgeTitle
    ),
    aboutBadgeSubtitle: cleanConfigText(
      config.aboutBadgeSubtitle,
      DEFAULT_LANDING_PAGE_CONFIG.aboutBadgeSubtitle
    ),
    featureSeafoodTitle: cleanConfigText(
      config.featureSeafoodTitle,
      DEFAULT_LANDING_PAGE_CONFIG.featureSeafoodTitle
    ),
    featureSeafoodDescription: cleanConfigText(
      config.featureSeafoodDescription,
      DEFAULT_LANDING_PAGE_CONFIG.featureSeafoodDescription
    ),
    featureChefTitle: cleanConfigText(
      config.featureChefTitle,
      DEFAULT_LANDING_PAGE_CONFIG.featureChefTitle
    ),
    featureChefDescription: cleanConfigText(
      config.featureChefDescription,
      DEFAULT_LANDING_PAGE_CONFIG.featureChefDescription
    ),
    featureSpaceTitle: cleanConfigText(
      config.featureSpaceTitle,
      DEFAULT_LANDING_PAGE_CONFIG.featureSpaceTitle
    ),
    featureSpaceDescription: cleanConfigText(
      config.featureSpaceDescription,
      DEFAULT_LANDING_PAGE_CONFIG.featureSpaceDescription
    ),
    featureServiceTitle: cleanConfigText(
      config.featureServiceTitle,
      DEFAULT_LANDING_PAGE_CONFIG.featureServiceTitle
    ),
    featureServiceDescription: cleanConfigText(
      config.featureServiceDescription,
      DEFAULT_LANDING_PAGE_CONFIG.featureServiceDescription
    ),
    footerDescription: cleanConfigText(
      config.footerDescription,
      DEFAULT_LANDING_PAGE_CONFIG.footerDescription
    )
  };
}
