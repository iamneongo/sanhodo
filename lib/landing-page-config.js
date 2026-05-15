export const DEFAULT_LANDING_PAGE_CONFIG = {
  seoTitle: "",
  seoDescription: "",
  heroImageUrl: "",
  aboutImageUrl: "",
  spaceImageOneUrl: "",
  spaceImageTwoUrl: "",
  spaceImageThreeUrl: "",
  spaceImageFourUrl: "",
  newsImageOneUrl: "",
  newsImageTwoUrl: "",
  newsImageThreeUrl: "",
  heroEyebrow: "Nhà hàng",
  brandPrimary: "",
  brandSecondary: "",
  heroTitle: "",
  heroSubtitle: "",
  heroDescription:
    "Không gian ẩm thực sang trọng - Dấu ấn riêng tinh tế\nTrải nghiệm đáng nhớ trong từng bữa tiệc sum vầy",
  primaryCtaLabel: "Đặt bàn ngay",
  secondaryCtaLabel: "Gọi ngay",
  comboSectionKicker: "Combo gợi ý",
  comboSectionTitle: "Tối ưu lựa chọn theo số người",
  comboOneTitle: "Combo 2 người",
  comboOnePrice: "1.590.000đ",
  comboOneOriginalPrice: "1.740.000đ",
  comboOneDescription: "1 tôm hùm nướng, 1 sashimi tổng hợp, 1 món rau và 2 nước.",
  comboOneBadge: "Tiết kiệm 8%",
  comboOneServes: "Phù hợp 2 khách",
  comboTwoTitle: "Combo 4 người",
  comboTwoPrice: "2.990.000đ",
  comboTwoOriginalPrice: "3.360.000đ",
  comboTwoDescription: "Cua huỳnh đế, ốc hương hấp sả, sashimi, cơm chiên hải sản, nước.",
  comboTwoBadge: "Bán chạy",
  comboTwoServes: "Phù hợp 4 khách",
  comboThreeTitle: "Combo tiệc",
  comboThreePrice: "6.890.000đ",
  comboThreeOriginalPrice: "7.650.000đ",
  comboThreeDescription: "Set dành cho 8-10 khách, tối ưu cho sinh nhật, tiếp khách, họp nhóm.",
  comboThreeBadge: "Ưu tiên upsell",
  comboThreeServes: "Phù hợp 8-10 khách",
  aboutTitle: "Không gian chỉn chu cho những buổi gặp gỡ đáng nhớ",
  aboutParagraphOne:
    "San Hô Đỏ mang đến trải nghiệm ẩm thực trọn vẹn với mặt tiền nổi bật, sảnh đón tiếp sang trọng và không gian bài trí chỉn chu cho những bữa ăn gia đình, tiếp khách hay hội họp.",
  aboutParagraphTwo:
    "Từ khu vực bàn tiệc rộng rãi đến phòng riêng ấm cúng, từng góc nhỏ đều được chăm chút để tạo cảm giác thoải mái, lịch sự và dễ lưu lại ấn tượng tốt với thực khách.",
  aboutBadgeTitle: "Mặt tiền",
  aboutBadgeSubtitle: "ấn tượng và sang trọng",
  spaceKicker: "Không gian",
  spaceTitle: "Đa dạng khu vực, linh hoạt cho mọi nhu cầu dùng bữa",
  spaceActionLabel: "Xem thêm hình ảnh",
  featureSeafoodTitle: "Hải sản tươi sống",
  featureSeafoodDescription: "Nguồn hải sản tươi sống được tuyển chọn mỗi ngày cho chi nhánh.",
  featureChefTitle: "Đầu bếp chuyên nghiệp",
  featureChefDescription: "Đội ngũ đầu bếp giàu kinh nghiệm, chế biến tinh tế.",
  featureSpaceTitle: "Không gian tuyệt đẹp",
  featureSpaceDescription: "Không gian sang trọng, nhiều khu vực phù hợp tiếp khách và gia đình.",
  featureServiceTitle: "Phục vụ tận tâm",
  featureServiceDescription: "Đội ngũ nhân viên nhiệt tình, chu đáo, chuyên nghiệp.",
  newsKicker: "Tin tức & Ưu đãi",
  newsTitle: "Những góc ấn tượng từ không gian thực tế của nhà hàng",
  newsOneTag: "Không gian",
  newsOneTitle: "Tủ rượu lớn tạo điểm nhấn cho khu vực dùng bữa",
  newsOneDescription:
    "Khu vực trung tâm được bố trí hệ tủ rượu sang trọng, phù hợp cho những buổi gặp gỡ cần sự chỉn chu.",
  newsOneDateLabel: "Bộ ảnh thực tế",
  newsTwoTag: "Chi tiết",
  newsTwoTitle: "Bàn tiệc được chuẩn bị gọn gàng và đồng bộ",
  newsTwoDescription:
    "Từ ly tách, khăn bàn đến cách đặt món đều được chuẩn bị kỹ để nâng trải nghiệm của thực khách.",
  newsTwoDateLabel: "Bộ ảnh thực tế",
  newsThreeTag: "Riêng tư",
  newsThreeTitle: "Không gian riêng phù hợp cho nhóm nhỏ và tiếp khách",
  newsThreeDescription:
    "Một lựa chọn phù hợp cho bữa tối thân mật, gặp gỡ đối tác hoặc những buổi sum họp cần sự riêng tư.",
  newsThreeDateLabel: "Bộ ảnh thực tế",
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
    heroImageUrl: cleanConfigText(config.heroImageUrl),
    aboutImageUrl: cleanConfigText(config.aboutImageUrl),
    spaceImageOneUrl: cleanConfigText(config.spaceImageOneUrl),
    spaceImageTwoUrl: cleanConfigText(config.spaceImageTwoUrl),
    spaceImageThreeUrl: cleanConfigText(config.spaceImageThreeUrl),
    spaceImageFourUrl: cleanConfigText(config.spaceImageFourUrl),
    newsImageOneUrl: cleanConfigText(config.newsImageOneUrl),
    newsImageTwoUrl: cleanConfigText(config.newsImageTwoUrl),
    newsImageThreeUrl: cleanConfigText(config.newsImageThreeUrl),
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
    comboSectionKicker: cleanConfigText(
      config.comboSectionKicker,
      DEFAULT_LANDING_PAGE_CONFIG.comboSectionKicker
    ),
    comboSectionTitle: cleanConfigText(
      config.comboSectionTitle,
      DEFAULT_LANDING_PAGE_CONFIG.comboSectionTitle
    ),
    comboOneTitle: cleanConfigText(config.comboOneTitle, DEFAULT_LANDING_PAGE_CONFIG.comboOneTitle),
    comboOnePrice: cleanConfigText(config.comboOnePrice, DEFAULT_LANDING_PAGE_CONFIG.comboOnePrice),
    comboOneOriginalPrice: cleanConfigText(
      config.comboOneOriginalPrice,
      DEFAULT_LANDING_PAGE_CONFIG.comboOneOriginalPrice
    ),
    comboOneDescription: cleanConfigText(
      config.comboOneDescription,
      DEFAULT_LANDING_PAGE_CONFIG.comboOneDescription
    ),
    comboOneBadge: cleanConfigText(config.comboOneBadge, DEFAULT_LANDING_PAGE_CONFIG.comboOneBadge),
    comboOneServes: cleanConfigText(config.comboOneServes, DEFAULT_LANDING_PAGE_CONFIG.comboOneServes),
    comboTwoTitle: cleanConfigText(config.comboTwoTitle, DEFAULT_LANDING_PAGE_CONFIG.comboTwoTitle),
    comboTwoPrice: cleanConfigText(config.comboTwoPrice, DEFAULT_LANDING_PAGE_CONFIG.comboTwoPrice),
    comboTwoOriginalPrice: cleanConfigText(
      config.comboTwoOriginalPrice,
      DEFAULT_LANDING_PAGE_CONFIG.comboTwoOriginalPrice
    ),
    comboTwoDescription: cleanConfigText(
      config.comboTwoDescription,
      DEFAULT_LANDING_PAGE_CONFIG.comboTwoDescription
    ),
    comboTwoBadge: cleanConfigText(config.comboTwoBadge, DEFAULT_LANDING_PAGE_CONFIG.comboTwoBadge),
    comboTwoServes: cleanConfigText(config.comboTwoServes, DEFAULT_LANDING_PAGE_CONFIG.comboTwoServes),
    comboThreeTitle: cleanConfigText(
      config.comboThreeTitle,
      DEFAULT_LANDING_PAGE_CONFIG.comboThreeTitle
    ),
    comboThreePrice: cleanConfigText(
      config.comboThreePrice,
      DEFAULT_LANDING_PAGE_CONFIG.comboThreePrice
    ),
    comboThreeOriginalPrice: cleanConfigText(
      config.comboThreeOriginalPrice,
      DEFAULT_LANDING_PAGE_CONFIG.comboThreeOriginalPrice
    ),
    comboThreeDescription: cleanConfigText(
      config.comboThreeDescription,
      DEFAULT_LANDING_PAGE_CONFIG.comboThreeDescription
    ),
    comboThreeBadge: cleanConfigText(
      config.comboThreeBadge,
      DEFAULT_LANDING_PAGE_CONFIG.comboThreeBadge
    ),
    comboThreeServes: cleanConfigText(
      config.comboThreeServes,
      DEFAULT_LANDING_PAGE_CONFIG.comboThreeServes
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
    spaceKicker: cleanConfigText(config.spaceKicker, DEFAULT_LANDING_PAGE_CONFIG.spaceKicker),
    spaceTitle: cleanConfigText(config.spaceTitle, DEFAULT_LANDING_PAGE_CONFIG.spaceTitle),
    spaceActionLabel: cleanConfigText(
      config.spaceActionLabel,
      DEFAULT_LANDING_PAGE_CONFIG.spaceActionLabel
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
    newsKicker: cleanConfigText(config.newsKicker, DEFAULT_LANDING_PAGE_CONFIG.newsKicker),
    newsTitle: cleanConfigText(config.newsTitle, DEFAULT_LANDING_PAGE_CONFIG.newsTitle),
    newsOneTag: cleanConfigText(config.newsOneTag, DEFAULT_LANDING_PAGE_CONFIG.newsOneTag),
    newsOneTitle: cleanConfigText(config.newsOneTitle, DEFAULT_LANDING_PAGE_CONFIG.newsOneTitle),
    newsOneDescription: cleanConfigText(
      config.newsOneDescription,
      DEFAULT_LANDING_PAGE_CONFIG.newsOneDescription
    ),
    newsOneDateLabel: cleanConfigText(
      config.newsOneDateLabel,
      DEFAULT_LANDING_PAGE_CONFIG.newsOneDateLabel
    ),
    newsTwoTag: cleanConfigText(config.newsTwoTag, DEFAULT_LANDING_PAGE_CONFIG.newsTwoTag),
    newsTwoTitle: cleanConfigText(config.newsTwoTitle, DEFAULT_LANDING_PAGE_CONFIG.newsTwoTitle),
    newsTwoDescription: cleanConfigText(
      config.newsTwoDescription,
      DEFAULT_LANDING_PAGE_CONFIG.newsTwoDescription
    ),
    newsTwoDateLabel: cleanConfigText(
      config.newsTwoDateLabel,
      DEFAULT_LANDING_PAGE_CONFIG.newsTwoDateLabel
    ),
    newsThreeTag: cleanConfigText(
      config.newsThreeTag,
      DEFAULT_LANDING_PAGE_CONFIG.newsThreeTag
    ),
    newsThreeTitle: cleanConfigText(
      config.newsThreeTitle,
      DEFAULT_LANDING_PAGE_CONFIG.newsThreeTitle
    ),
    newsThreeDescription: cleanConfigText(
      config.newsThreeDescription,
      DEFAULT_LANDING_PAGE_CONFIG.newsThreeDescription
    ),
    newsThreeDateLabel: cleanConfigText(
      config.newsThreeDateLabel,
      DEFAULT_LANDING_PAGE_CONFIG.newsThreeDateLabel
    ),
    footerDescription: cleanConfigText(
      config.footerDescription,
      DEFAULT_LANDING_PAGE_CONFIG.footerDescription
    )
  };
}
