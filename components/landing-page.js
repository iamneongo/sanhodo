"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone, X } from "lucide-react";
import {
  DEFAULT_BRANCHES,
  MAIN_BRANCH_CODE,
  MAIN_BRANCH_ID,
  getBranchByCode,
  getBranchLandingPath
} from "../lib/branches";
import {
  DEFAULT_LANDING_PAGE_CONFIG,
  normalizeLandingPageConfig
} from "../lib/landing-page-config";
import {
  RESERVATION_TIME_SLOTS,
  VOUCHER_PRESET,
  buildFallbackVoucherCampaign,
  formatVoucherBenefit,
  formatVietnamPhone,
  generateVoucherPayload,
  getReservationDateLabel,
  getTodayDateInput,
  isValidVietnamPhone
} from "../lib/business-rules";

const hotline = "0814645999";
const hotlineDisplay = "0814 645 999";
const secondaryHotlineDisplay = "0522 282 229";
const reservationMinDate = getTodayDateInput();
const DEFAULT_BRAND_NAME = "San Hô Đỏ";
const LANDING_LOCALES = ["vi", "en", "zh"];

const LANDING_COPY = {
  vi: {
    localeLabel: "VI",
    localeName: "Tiếng Việt",
    currentLanguageAria: "Ngôn ngữ hiện tại: Tiếng Việt",
    nav: {
      home: "Trang chủ",
      about: "Giới thiệu",
      menu: "Thực đơn",
      reservation: "Đặt bàn",
      space: "Không gian",
      news: "Tin tức",
      contact: "Liên hệ"
    },
    currentBranch: "Chi nhánh đang xem",
    language: "Ngôn ngữ",
    languageApplied: "Tiếng Việt đang được áp dụng cho landing page hiện tại.",
    heroScroll: "Scroll",
    aboutKicker: "Về chúng tôi",
    aboutMore: "Khám phá thêm",
    reservationKicker: "Đặt bàn nhanh",
    reservationTitle: "Chốt khách nhanh hơn với form đặt bàn và hotline rõ ràng",
    reservationDescription:
      "Thanh CTA cố định giúp khách gọi, đặt bàn hoặc nhắn Zalo chỉ với 1 chạm. Form này đã sẵn API nhận lead để đẩy tiếp sang CRM, Google Sheet và Zalo webhook.",
    callNow: "Gọi ngay",
    zaloLabel: "Zalo",
    zaloQuick: "Nhắn tư vấn nhanh",
    selectBranch: "Chọn chi nhánh phục vụ",
    receivingLeadsAt: "Đang nhận lead tại:",
    form: {
      name: "Tên",
      phone: "SĐT",
      guests: "Số khách",
      arrivalDate: "Ngày đến",
      timeSlot: "Khung giờ",
      referralCode: "Mã tài xế / giới thiệu (nếu có)",
      notes: "Ghi chú thêm",
      phonePlaceholder: "Ví dụ: 0814 645 999",
      referralPlaceholder: "Ví dụ: DRV-HOTRAM-01",
      notesPlaceholder: "Ví dụ: cần ghế em bé, bàn yên tĩnh, có sinh nhật..."
    },
    reservationNotePrefix: "Khung giờ nhận đặt bàn:",
    reservationNoteHours: "10:00 - 21:30 mỗi ngày.",
    selectedSchedule: "Lịch hẹn đang chọn:",
    handlingBranch: "Chi nhánh tiếp nhận:",
    submitReservation: "Gửi yêu cầu đặt bàn",
    submitting: "Đang gửi...",
    interestedIn: "Đang quan tâm:",
    menuKicker: "Thực đơn",
    menuTitle: "Menu thông minh với giá, mô tả và combo gợi ý sẵn",
    menuDescription:
      "Mỗi món đều có giá, mô tả ngắn và nút đặt ngay. Khi khách bấm chọn món hoặc combo, hệ thống sẽ bật gợi ý upsell để tăng giá trị đơn hàng.",
    prevDish: "Món trước",
    nextDish: "Món tiếp",
    chooseDish: "Chọn món",
    bookNow: "Đặt luôn",
    chooseCombo: "Chọn combo",
    bookCombo: "Đặt bàn theo combo",
    dishChooser: "Chọn món",
    dishNumber: (index) => `Món ${index + 1}`,
    orderKicker: "Đặt món nhanh",
    orderTitle: "Chọn món trước, admin nhận order trực tiếp trong dashboard",
    orderDescription:
      "Khách có thể chọn trước các món nổi bật và gửi yêu cầu đặt món. Dữ liệu sẽ đi vào Supabase thật và xuất hiện trong tab Orders của admin để đội ngũ xử lý.",
    noDishes:
      "Chưa có món nổi bật trong nhóm này. Bạn có thể chọn nhóm khác hoặc gọi hotline để được tư vấn nhanh.",
    subtotal: "Tạm tính",
    selectedItems: "món đã chọn",
    customerName: "Tên khách",
    additionalNotes: "Ghi chú thêm",
    orderNotesPlaceholder: "Ví dụ: giao trước món khai vị, không cay...",
    submitOrder: "Gửi yêu cầu đặt món",
    voucherKicker: "Voucher",
    voucherTitle: "Nhập SĐT để nhận ưu đãi và thu data khách hàng",
    voucherDescription:
      "Form này phù hợp để kết hợp cùng WiFi Ads GOECO, popup khuyến mãi hoặc chiến dịch remarketing về sau.",
    voucherBranch: "Ưu đãi đang áp dụng tại:",
    voucherCampaign: "Chiến dịch ưu đãi",
    voucherPhone: "Số điện thoại",
    voucherPhonePlaceholder: "Nhập SĐT để nhận ưu đãi",
    voucherSubmit: "Nhận ưu đãi ngay",
    voucherProcessing: "Đang xử lý...",
    voucherCode: "Mã ưu đãi của bạn",
    voucherExpires: "Hạn dùng:",
    voucherMinOrder: "Áp dụng cho hóa đơn từ",
    voucherValidity: "hiệu lực trong",
    voucherDays: "ngày kể từ lúc nhận mã.",
    viewAllNews: "Xem tất cả tin tức",
    footerLinks: "Liên kết nhanh",
    footerContact: "Thông tin liên hệ",
    footerQuickOffer: "Ưu đãi nhanh",
    footerVoucherPlaceholder: "Nhập SĐT để nhận ưu đãi",
    footerVoucherButton: "Nhận voucher",
    footerCopyright: (branchName) => `© 2024 Nhà hàng ${branchName}. All rights reserved.`,
    footerCredit: "Thiết kế bởi Web Designer",
    stickyBook: "Đặt bàn ngay",
    bookWithOffer: "Đặt bàn với ưu đãi này",
    viewMoreCombos: "Xem thêm combo",
    openChat: (branchName) => `Mở trò chuyện với ${branchName}`,
    closeChat: "Đóng trò chuyện",
    chatSummary: (branchName) => `${branchName} xin chào`,
    chatPlaceholder: "Hỏi menu, giá, đường đi...",
    chatSubmit: "Gửi",
    chatReply: (branchName) =>
      `${branchName} đang sẵn sàng hỗ trợ menu, đặt bàn nhanh và hướng dẫn liên hệ.`,
    chatSuggestions: (shortName) => [
      `Menu ${shortName || "hôm nay"}`,
      "Giá combo 4 người",
      `Đặt bàn tại ${shortName || "chi nhánh"}`,
      `Đường đi ${shortName || "chi nhánh"}`
    ],
    chatFallback:
      "Mình có thể hỗ trợ nhanh về menu, giá, đặt bàn, đường đi hoặc gợi ý combo phù hợp số người. Bạn cứ nhắn ngắn gọn là được."
  },
  en: {
    localeLabel: "EN",
    localeName: "English",
    currentLanguageAria: "Current language: English",
    nav: {
      home: "Home",
      about: "About",
      menu: "Menu",
      reservation: "Book",
      space: "Space",
      news: "News",
      contact: "Contact"
    },
    currentBranch: "Current branch",
    language: "Language",
    languageApplied: "English is now applied for this landing page.",
    heroScroll: "Scroll",
    aboutKicker: "About us",
    aboutMore: "Explore more",
    reservationKicker: "Quick booking",
    reservationTitle: "Convert guests faster with a clear booking form and hotline",
    reservationDescription:
      "The sticky CTA helps guests call or reserve with one tap. This form is already wired to push leads to CRM, Google Sheets and Zalo webhooks.",
    callNow: "Call now",
    zaloLabel: "Zalo",
    zaloQuick: "Chat quickly",
    selectBranch: "Choose branch",
    receivingLeadsAt: "Receiving leads at:",
    form: {
      name: "Name",
      phone: "Phone",
      guests: "Guests",
      arrivalDate: "Arrival date",
      timeSlot: "Time slot",
      referralCode: "Driver / referral code",
      notes: "Notes",
      phonePlaceholder: "Example: 0814 645 999",
      referralPlaceholder: "Example: DRV-HOTRAM-01",
      notesPlaceholder: "Example: baby chair, quiet table, birthday setup..."
    },
    reservationNotePrefix: "Reservation hours:",
    reservationNoteHours: "10:00 - 21:30 daily.",
    selectedSchedule: "Selected schedule:",
    handlingBranch: "Serving branch:",
    submitReservation: "Send booking request",
    submitting: "Submitting...",
    interestedIn: "Interested in:",
    menuKicker: "Menu",
    menuTitle: "Smart menu with pricing, short descriptions and combo prompts",
    menuDescription:
      "Each dish shows price, description and a direct action. When guests choose a dish or combo, the upsell flow helps increase basket value.",
    prevDish: "Previous dish",
    nextDish: "Next dish",
    chooseDish: "Choose dish",
    bookNow: "Book now",
    chooseCombo: "Choose combo",
    bookCombo: "Book with combo",
    dishChooser: "Choose dish",
    dishNumber: (index) => `Dish ${index + 1}`,
    orderKicker: "Quick order",
    orderTitle: "Let guests pre-select dishes while admin receives the order in dashboard",
    orderDescription:
      "Guests can pre-select featured dishes and submit an order request. The data goes to Supabase and appears directly in the admin Orders tab.",
    noDishes:
      "No featured dishes in this group yet. You can switch category or call the hotline for quick assistance.",
    subtotal: "Subtotal",
    selectedItems: "selected items",
    customerName: "Customer name",
    additionalNotes: "Notes",
    orderNotesPlaceholder: "Example: starters first, non-spicy...",
    submitOrder: "Send order request",
    voucherKicker: "Voucher",
    voucherTitle: "Collect phone numbers and hand out offers instantly",
    voucherDescription:
      "This form works well with WiFi Ads GOECO, promo popups or remarketing campaigns afterwards.",
    voucherBranch: "Offer applied at:",
    voucherCampaign: "Campaign",
    voucherPhone: "Phone number",
    voucherPhonePlaceholder: "Enter phone number to receive the offer",
    voucherSubmit: "Get the offer now",
    voucherProcessing: "Processing...",
    voucherCode: "Your voucher code",
    voucherExpires: "Expires:",
    voucherMinOrder: "Applied for orders from",
    voucherValidity: "valid for",
    voucherDays: "days after claiming.",
    viewAllNews: "View all news",
    footerLinks: "Quick links",
    footerContact: "Contact info",
    footerQuickOffer: "Quick offer",
    footerVoucherPlaceholder: "Enter phone number for the offer",
    footerVoucherButton: "Get voucher",
    footerCopyright: (branchName) => `© 2024 ${branchName} restaurant. All rights reserved.`,
    footerCredit: "Designed by Web Designer",
    stickyBook: "Book now",
    bookWithOffer: "Book with this offer",
    viewMoreCombos: "View more combos",
    openChat: (branchName) => `Open chat with ${branchName}`,
    closeChat: "Close chat",
    chatSummary: (branchName) => `${branchName} says hello`,
    chatPlaceholder: "Ask about menu, prices, directions...",
    chatSubmit: "Send",
    chatReply: (branchName) =>
      `${branchName} is ready to help with menu suggestions, reservations and contact directions.`,
    chatSuggestions: (shortName) => [
      `${shortName || "today"} menu`,
      "Price for 4-person combo",
      `Book at ${shortName || "this branch"}`,
      `Directions to ${shortName || "this branch"}`
    ],
    chatFallback:
      "I can quickly help with the menu, pricing, reservations, directions or combo suggestions based on party size."
  },
  zh: {
    localeLabel: "中文",
    localeName: "中文",
    currentLanguageAria: "当前语言：中文",
    nav: {
      home: "首页",
      about: "介绍",
      menu: "菜单",
      reservation: "订位",
      space: "空间",
      news: "资讯",
      contact: "联系"
    },
    currentBranch: "当前分店",
    language: "语言",
    languageApplied: "当前落地页已切换为中文。",
    heroScroll: "继续",
    aboutKicker: "关于我们",
    aboutMore: "查看更多",
    reservationKicker: "快速订位",
    reservationTitle: "用清晰的订位表单和热线更快完成转化",
    reservationDescription:
      "固定 CTA 让客人一键拨打或订位。表单已经可把线索推送到 CRM、Google Sheet 与 Zalo webhook。",
    callNow: "立即致电",
    zaloLabel: "Zalo",
    zaloQuick: "快速咨询",
    selectBranch: "选择分店",
    receivingLeadsAt: "当前接收线索：",
    form: {
      name: "姓名",
      phone: "电话",
      guests: "人数",
      arrivalDate: "到店日期",
      timeSlot: "时间段",
      referralCode: "司机 / 推荐码",
      notes: "备注",
      phonePlaceholder: "例如：0814 645 999",
      referralPlaceholder: "例如：DRV-HOTRAM-01",
      notesPlaceholder: "例如：需要宝宝椅、安静位置、生日布置..."
    },
    reservationNotePrefix: "可预订时段：",
    reservationNoteHours: "每日 10:00 - 21:30。",
    selectedSchedule: "当前选择：",
    handlingBranch: "服务分店：",
    submitReservation: "提交订位请求",
    submitting: "提交中...",
    interestedIn: "当前关注：",
    menuKicker: "菜单",
    menuTitle: "带价格、简介和套餐推荐的智能菜单",
    menuDescription:
      "每道菜都有价格、简短说明和直接操作。客人选择菜品或套餐后，系统会给出加购推荐，提高客单价。",
    prevDish: "上一道",
    nextDish: "下一道",
    chooseDish: "选择菜品",
    bookNow: "立即订位",
    chooseCombo: "选择套餐",
    bookCombo: "按套餐订位",
    dishChooser: "选择菜品",
    dishNumber: (index) => `菜品 ${index + 1}`,
    orderKicker: "快速点餐",
    orderTitle: "让客人先选菜，后台直接收到订单",
    orderDescription:
      "客人可以先选热门菜品并提交点餐请求，数据会进入 Supabase，并直接出现在后台 Orders 模块。",
    noDishes: "当前分类暂无推荐菜品。你可以切换分类或直接拨打热线咨询。",
    subtotal: "小计",
    selectedItems: "已选菜品",
    customerName: "顾客姓名",
    additionalNotes: "备注",
    orderNotesPlaceholder: "例如：先上前菜、不要辣...",
    submitOrder: "提交点餐请求",
    voucherKicker: "优惠券",
    voucherTitle: "输入手机号即可领取优惠并收集客户线索",
    voucherDescription:
      "这个表单适合搭配 WiFi Ads GOECO、促销弹窗或后续再营销活动一起使用。",
    voucherBranch: "当前优惠适用于：",
    voucherCampaign: "优惠活动",
    voucherPhone: "手机号码",
    voucherPhonePlaceholder: "输入手机号领取优惠",
    voucherSubmit: "立即领取优惠",
    voucherProcessing: "处理中...",
    voucherCode: "你的优惠码",
    voucherExpires: "有效期：",
    voucherMinOrder: "适用于订单金额满",
    voucherValidity: "领取后有效",
    voucherDays: "天。",
    viewAllNews: "查看全部资讯",
    footerLinks: "快速链接",
    footerContact: "联系信息",
    footerQuickOffer: "快速优惠",
    footerVoucherPlaceholder: "输入手机号领取优惠",
    footerVoucherButton: "领取优惠券",
    footerCopyright: (branchName) => `© 2024 ${branchName}。保留所有权利。`,
    footerCredit: "由 Web Designer 设计",
    stickyBook: "立即订位",
    bookWithOffer: "用此优惠订位",
    viewMoreCombos: "查看更多套餐",
    openChat: (branchName) => `打开与 ${branchName} 的聊天`,
    closeChat: "关闭聊天",
    chatSummary: (branchName) => `${branchName} 向你问好`,
    chatPlaceholder: "可以问菜单、价格、路线...",
    chatSubmit: "发送",
    chatReply: (branchName) =>
      `${branchName} 已准备好为你提供菜单建议、订位帮助和联系指引。`,
    chatSuggestions: (shortName) => [
      `${shortName || "今日"}菜单`,
      "4人套餐价格",
      `在${shortName || "本分店"}订位`,
      `${shortName || "本分店"}路线`
    ],
    chatFallback: "我可以帮你快速了解菜单、价格、订位、路线，或根据人数推荐合适套餐。"
  }
};

const LOCALIZED_DEFAULT_CONFIG = {
  en: {
    heroEyebrow: "Restaurant",
    heroDescription:
      "Refined dining atmosphere - a signature mark with character\nA memorable experience in every shared gathering",
    aboutTitle: "A polished space for meaningful gatherings",
    aboutParagraphOne:
      "San Hô Đỏ delivers a complete dining experience with a striking facade, elegant reception area and carefully composed spaces for family meals, guest hosting and group occasions.",
    aboutParagraphTwo:
      "From spacious dining tables to cozy private rooms, every corner is arranged to feel comfortable, refined and memorable for guests.",
    aboutBadgeTitle: "Facade",
    aboutBadgeSubtitle: "bold and elegant",
    featureSeafoodTitle: "Fresh seafood",
    featureSeafoodDescription: "Fresh seafood is selected daily for each branch.",
    featureChefTitle: "Professional chefs",
    featureChefDescription: "An experienced kitchen team with refined execution.",
    featureSpaceTitle: "Beautiful spaces",
    featureSpaceDescription: "Elegant dining zones suitable for guests, families and private occasions.",
    featureServiceTitle: "Attentive service",
    featureServiceDescription: "A warm, thoughtful and professional service team.",
    spaceKicker: "Space",
    spaceTitle: "Flexible dining zones for different dining moments",
    spaceActionLabel: "View more images",
    newsKicker: "News & Offers",
    newsTitle: "A closer look at the restaurant's real atmosphere"
  },
  zh: {
    heroEyebrow: "餐厅",
    heroDescription:
      "精致高雅的用餐氛围 - 独特而鲜明的印记\n让每一次相聚都留下值得回味的体验",
    aboutTitle: "为重要相聚而打造的讲究空间",
    aboutParagraphOne:
      "San Hô Đỏ 提供完整的用餐体验，拥有醒目的门面、优雅的接待区，以及适合家庭聚餐、接待宾客和小型聚会的精心布局空间。",
    aboutParagraphTwo:
      "从宽敞的宴会餐桌到温馨的包厢，每一个角落都经过细致安排，力求舒适、体面并让客人留下深刻印象。",
    aboutBadgeTitle: "门面",
    aboutBadgeSubtitle: "醒目而有质感",
    featureSeafoodTitle: "新鲜海鲜",
    featureSeafoodDescription: "每个分店每日精选新鲜海鲜食材。",
    featureChefTitle: "专业主厨",
    featureChefDescription: "经验丰富的厨房团队，出品更细致稳定。",
    featureSpaceTitle: "优雅空间",
    featureSpaceDescription: "多样而讲究的用餐区域，适合家庭、接待与私密聚会。",
    featureServiceTitle: "贴心服务",
    featureServiceDescription: "热情、周到且专业的服务团队。",
    spaceKicker: "空间",
    spaceTitle: "多样化用餐区域，适配不同场景",
    spaceActionLabel: "查看更多图片",
    newsKicker: "资讯与优惠",
    newsTitle: "从真实空间细节感受餐厅氛围"
  }
};

const fallbackFeaturedDishes = [
  {
    name: "Cua huỳnh đế",
    price: "1.290.000đ",
    description: "Thịt chắc, ngọt đậm vị biển, phù hợp cho bàn tiệc cần món signature.",
    image: "/assets/dish-king-crab.png",
    offer: "Thêm sò điệp nướng phô mai, giảm ngay 10% món khai vị.",
    category: "Hải sản cao cấp",
    availabilityStatus: "available",
    seasonNote: "Signature được gọi nhiều cho bàn tiếp khách."
  },
  {
    name: "Tôm hùm nướng",
    price: "990.000đ",
    description: "Nướng bơ tỏi thơm đậm, thích hợp cho cặp đôi hoặc bàn tiếp khách.",
    image: "/assets/dish-lobster.png",
    offer: "Combo tôm hùm + sashimi tiết kiệm hơn 180.000đ.",
    category: "Hải sản cao cấp",
    availabilityStatus: "low_stock",
    seasonNote: "Số lượng đẹp mỗi ngày có giới hạn."
  },
  {
    name: "Sashimi tổng hợp",
    price: "680.000đ",
    description: "Tươi, mát và trình bày đẹp mắt cho bàn ăn sang trọng.",
    image: "/assets/dish-sashimi.png",
    offer: "Thêm set rượu vang nhẹ giảm 10% cho bàn 2 người.",
    category: "Món lạnh",
    availabilityStatus: "seasonal",
    seasonNote: "Thay đổi theo mẻ cá tươi trong ngày."
  },
  {
    name: "Ốc hương hấp sả",
    price: "320.000đ",
    description: "Món khai vị dễ gọi thêm, hợp cho nhóm gia đình và bạn bè.",
    image: "/assets/dish-snails.png",
    offer: "Nâng cấp thành combo 4 người sẽ tối ưu hơn 12% chi phí.",
    category: "Khai vị",
    availabilityStatus: "available",
    seasonNote: "Món mở vị dễ upsell cho bàn 4 khách."
  }
];

const fallbackBranches = DEFAULT_BRANCHES;

const combos = [
  {
    title: "Combo 2 người",
    price: "1.590.000đ",
    originalPrice: "1.740.000đ",
    description: "1 tôm hùm nướng, 1 sashimi tổng hợp, 1 món rau và 2 nước.",
    badge: "Tiết kiệm 8%",
    serves: "Phù hợp 2 khách"
  },
  {
    title: "Combo 4 người",
    price: "2.990.000đ",
    originalPrice: "3.360.000đ",
    description: "Cua huỳnh đế, ốc hương hấp sả, sashimi, cơm chiên hải sản, nước.",
    badge: "Bán chạy",
    serves: "Phù hợp 4 khách"
  },
  {
    title: "Combo tiệc",
    price: "6.890.000đ",
    description: "Set dành cho 8-10 khách, tối ưu cho sinh nhật, tiếp khách, họp nhóm.",
    originalPrice: "7.650.000đ",
    badge: "Ưu tiên upsell",
    serves: "Phù hợp 8-10 khách"
  }
];

const QUICK_ANSWERS_BY_LOCALE = {
  vi: [
    {
      keywords: ["menu", "thực đơn", "món"],
      answer:
        "Nhà hàng đang nổi bật với cua huỳnh đế, tôm hùm nướng, sashimi tổng hợp và các combo 2 người, 4 người, tiệc. Bạn muốn mình gợi ý theo số người luôn không?"
    },
    {
      keywords: ["giá", "bao nhiêu", "price"],
      answer:
        "Các món nổi bật hiện hiển thị ngay trong phần Thực đơn. Combo 2 người từ 1.590.000đ, combo 4 người từ 2.990.000đ và combo tiệc từ 6.890.000đ."
    },
    {
      keywords: ["đặt bàn", "book", "reservation"],
      answer:
        "Bạn chỉ cần để lại tên, số điện thoại, số khách và thời gian. Đội ngũ sẽ xác nhận nhanh qua Zalo hoặc điện thoại của chi nhánh."
    },
    {
      keywords: ["đường đi", "địa chỉ", "map"],
      answer:
        "Nhà hàng ở Đường ven biển, Ấp Hồ Tràm, Xã Phước Thuận, H. Xuyên Mộc, Bà Rịa - Vũng Tàu. Nếu bạn muốn, mình có thể ưu tiên đặt bàn trước rồi gửi hướng dẫn ngay sau."
    },
    {
      keywords: ["combo", "set", "tiệc", "upsell"],
      answer:
        "Nếu đi 2 người, mình khuyên Combo 2 người. Nếu đi gia đình 4 người, Combo 4 người tiết kiệm hơn gọi lẻ. Với tiệc hoặc tiếp khách, Combo tiệc là lựa chọn tối ưu."
    }
  ],
  en: [
    {
      keywords: ["menu", "dish", "food"],
      answer:
        "The restaurant is currently highlighting king crab, grilled lobster, assorted sashimi and combos for 2, 4 and party tables. I can suggest the best fit by group size."
    },
    {
      keywords: ["price", "cost", "how much"],
      answer:
        "Featured dishes are listed in the Menu section. The 2-person combo starts from 1,590,000 VND, the 4-person combo from 2,990,000 VND and the party combo from 6,890,000 VND."
    },
    {
      keywords: ["book", "reservation", "reserve"],
      answer:
        "Just leave your name, phone number, guest count and preferred time. The team will confirm quickly via Zalo or the branch hotline."
    },
    {
      keywords: ["direction", "address", "map"],
      answer:
        "The restaurant is on the coastal road in Ho Tram, Xuyen Moc, Ba Ria - Vung Tau. If you'd like, I can prioritize your reservation first and send directions right after."
    },
    {
      keywords: ["combo", "set", "party"],
      answer:
        "For 2 guests, I recommend the 2-person combo. For a family of 4, the 4-person combo gives better value than ordering items separately. For events or business dining, the party combo is the best fit."
    }
  ],
  zh: [
    {
      keywords: ["菜单", "menu", "菜"],
      answer:
        "餐厅目前主推帝王蟹、烤龙虾、综合刺身，以及适合 2 人、4 人和聚会的套餐。我也可以按人数给你推荐。"
    },
    {
      keywords: ["价格", "多少钱", "price"],
      answer:
        "热门菜品都展示在菜单区域。2 人套餐从 1,590,000 越南盾起，4 人套餐从 2,990,000 越南盾起，宴会套餐从 6,890,000 越南盾起。"
    },
    {
      keywords: ["订位", "预订", "book", "reservation"],
      answer:
        "只要留下姓名、电话、人数和到店时间，团队就会通过 Zalo 或分店电话尽快与你确认。"
    },
    {
      keywords: ["路线", "地址", "map"],
      answer:
        "餐厅位于 Hồ Tràm 沿海路，Xuyên Mộc，Bà Rịa - Vũng Tàu。如果你愿意，我可以先帮你优先订位，再发送路线。"
    },
    {
      keywords: ["套餐", "combo", "set"],
      answer:
        "2 位客人建议选择 2 人套餐；4 人家庭更适合 4 人套餐；如果是聚会或商务接待，宴会套餐会更合适。"
    }
  ]
};

function normalizeLocale(value) {
  return LANDING_LOCALES.includes(value) ? value : "vi";
}

function getChatReply(input, locale = "vi") {
  const normalized = input.toLowerCase();
  const quickAnswers = QUICK_ANSWERS_BY_LOCALE[normalizeLocale(locale)] || QUICK_ANSWERS_BY_LOCALE.vi;
  const matched = quickAnswers.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword))
  );

  if (matched) {
    return matched.answer;
  }

  return LANDING_COPY[normalizeLocale(locale)].chatFallback;
}

function buildChatReply(input, branchName, hotlineValue, hotlineText, locale = "vi") {
  const baseReply = getChatReply(input, locale);

  return baseReply
    .replaceAll("Nhà hàng", branchName)
    .replaceAll("chi nhánh", branchName)
    .replaceAll("Zalo hoặc điện thoại của chi nhánh", `Zalo hoặc số ${hotlineText} của ${branchName}`)
    .replaceAll("đường đi tới nhà hàng", `đường đi tới ${branchName}`)
    .replaceAll("gửi hướng dẫn ngay sau", `gửi hướng dẫn qua Zalo ${hotlineValue} ngay sau`);
}

function parseMoneyToNumber(value) {
  return Number(String(value || "0").replace(/[^\d]/g, "")) || 0;
}

function formatMoney(value) {
  return `${new Intl.NumberFormat("vi-VN").format(value || 0)}đ`;
}

function getAvailabilityLabel(status) {
  switch (status) {
    case "low_stock":
      return "Số lượng giới hạn";
    case "seasonal":
      return "Theo mùa";
    case "sold_out":
      return "Tạm hết";
    default:
      return "Sẵn phục vụ";
  }
}

function getLocalizedText(locale, fallbackByLocale) {
  return fallbackByLocale[normalizeLocale(locale)] || fallbackByLocale.vi;
}

function resolveLocalizedConfigText(configValue, defaultValue, locale, key) {
  if (locale === "vi") {
    return configValue || defaultValue;
  }

  const localizedDefaults = LOCALIZED_DEFAULT_CONFIG[normalizeLocale(locale)] || {};
  if (!configValue || configValue === defaultValue) {
    return localizedDefaults[key] || defaultValue;
  }

  return configValue;
}

function resolveInitialBranchId(branches, branchCode) {
  const normalizedBranches = branches?.length ? branches : DEFAULT_BRANCHES;
  const matchedBranch =
    getBranchByCode(normalizedBranches, branchCode) ||
    normalizedBranches.find((item) => item.id === MAIN_BRANCH_ID) ||
    normalizedBranches[0] ||
    null;

  return matchedBranch?.id || MAIN_BRANCH_ID;
}

export default function LandingPage({
  initialBranches = DEFAULT_BRANCHES,
  initialBranchCode = MAIN_BRANCH_CODE
}) {
  const router = useRouter();
  const [locale, setLocale] = useState("vi");
  const [featuredDishes, setFeaturedDishes] = useState(fallbackFeaturedDishes);
  const [branches, setBranches] = useState(initialBranches?.length ? initialBranches : fallbackBranches);
  const [selectedBranchId, setSelectedBranchId] = useState(() =>
    resolveInitialBranchId(initialBranches, initialBranchCode)
  );
  const [voucherCampaigns, setVoucherCampaigns] = useState([buildFallbackVoucherCampaign(MAIN_BRANCH_ID)]);
  const [selectedVoucherCampaignId, setSelectedVoucherCampaignId] = useState("");
  const [reservationForm, setReservationForm] = useState({
    name: "",
    phone: "",
    guests: "2",
    date: reservationMinDate,
    timeSlot: RESERVATION_TIME_SLOTS[14] || "17:00",
    referralCode: ""
  });
  const [voucherPhone, setVoucherPhone] = useState("");
  const [voucherResult, setVoucherResult] = useState(null);
  const [reservationStatus, setReservationStatus] = useState("");
  const [voucherStatus, setVoucherStatus] = useState("");
  const [reservationError, setReservationError] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    customerPhone: "",
    referralCode: "",
    notes: "",
    items: []
  });
  const [activeMenuCategory, setActiveMenuCategory] = useState("Tất cả");
  const [reservationLoading, setReservationLoading] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [upsellModal, setUpsellModal] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState("");

  const menuCategories = useMemo(
    () => ["Tất cả", ...new Set(featuredDishes.map((item) => item.category || "Khác"))],
    [featuredDishes]
  );

  const filteredDishes = useMemo(() => {
    if (activeMenuCategory === "Tất cả") {
      return featuredDishes;
    }

    return featuredDishes.filter((item) => item.category === activeMenuCategory);
  }, [activeMenuCategory, featuredDishes]);

  const orderSubtotal = useMemo(
    () =>
      orderForm.items.reduce(
        (sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
        0
      ),
    [orderForm.items]
  );

  const reservationPreview = useMemo(
    () => getReservationDateLabel(reservationForm.date, reservationForm.timeSlot),
    [reservationForm.date, reservationForm.timeSlot]
  );
  const selectedBranch = useMemo(
    () => branches.find((item) => item.id === selectedBranchId) || branches[0] || null,
    [branches, selectedBranchId]
  );
  const landingConfig = useMemo(
    () => normalizeLandingPageConfig(selectedBranch?.landingConfig || {}),
    [selectedBranch]
  );
  const ui = useMemo(() => LANDING_COPY[normalizeLocale(locale)], [locale]);
  const displayBranchName = selectedBranch?.name || "San Hô Đỏ Hồ Tràm";
  const displayBranchShortName = selectedBranch?.shortName || "Hồ Tràm";
  const defaultSecondaryLine =
    displayBranchShortName && !displayBranchName.toLowerCase().includes(displayBranchShortName.toLowerCase())
      ? displayBranchShortName
      : "";
  const derivedBranchLabel = displayBranchName
    .replace(/^San Hô Đỏ\s*/i, "")
    .trim();
  const brandPrimaryLine = landingConfig.brandPrimary || DEFAULT_BRAND_NAME;
  const brandSecondaryLine =
    landingConfig.brandSecondary || derivedBranchLabel || defaultSecondaryLine || displayBranchShortName;
  const heroEyebrow = resolveLocalizedConfigText(
    landingConfig.heroEyebrow,
    DEFAULT_LANDING_PAGE_CONFIG.heroEyebrow,
    locale,
    "heroEyebrow"
  );
  const heroTitle = landingConfig.heroTitle || DEFAULT_BRAND_NAME;
  const heroSubtitle = landingConfig.heroSubtitle || brandSecondaryLine;
  const heroDescriptionLines = String(
    resolveLocalizedConfigText(
      landingConfig.heroDescription,
      DEFAULT_LANDING_PAGE_CONFIG.heroDescription,
      locale,
      "heroDescription"
    )
  )
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const aboutTitle = resolveLocalizedConfigText(
    landingConfig.aboutTitle,
    DEFAULT_LANDING_PAGE_CONFIG.aboutTitle,
    locale,
    "aboutTitle"
  );
  const aboutParagraphOne = resolveLocalizedConfigText(
    landingConfig.aboutParagraphOne,
    DEFAULT_LANDING_PAGE_CONFIG.aboutParagraphOne,
    locale,
    "aboutParagraphOne"
  );
  const aboutParagraphTwo = resolveLocalizedConfigText(
    landingConfig.aboutParagraphTwo,
    DEFAULT_LANDING_PAGE_CONFIG.aboutParagraphTwo,
    locale,
    "aboutParagraphTwo"
  );
  const aboutBadgeTitle = resolveLocalizedConfigText(
    landingConfig.aboutBadgeTitle,
    DEFAULT_LANDING_PAGE_CONFIG.aboutBadgeTitle,
    locale,
    "aboutBadgeTitle"
  );
  const aboutBadgeSubtitle = resolveLocalizedConfigText(
    landingConfig.aboutBadgeSubtitle,
    DEFAULT_LANDING_PAGE_CONFIG.aboutBadgeSubtitle,
    locale,
    "aboutBadgeSubtitle"
  );
  const featureSeafoodTitle = resolveLocalizedConfigText(
    landingConfig.featureSeafoodTitle,
    DEFAULT_LANDING_PAGE_CONFIG.featureSeafoodTitle,
    locale,
    "featureSeafoodTitle"
  );
  const featureSeafoodDescription = resolveLocalizedConfigText(
    landingConfig.featureSeafoodDescription,
    DEFAULT_LANDING_PAGE_CONFIG.featureSeafoodDescription,
    locale,
    "featureSeafoodDescription"
  );
  const featureChefTitle = resolveLocalizedConfigText(
    landingConfig.featureChefTitle,
    DEFAULT_LANDING_PAGE_CONFIG.featureChefTitle,
    locale,
    "featureChefTitle"
  );
  const featureChefDescription = resolveLocalizedConfigText(
    landingConfig.featureChefDescription,
    DEFAULT_LANDING_PAGE_CONFIG.featureChefDescription,
    locale,
    "featureChefDescription"
  );
  const featureSpaceTitle = resolveLocalizedConfigText(
    landingConfig.featureSpaceTitle,
    DEFAULT_LANDING_PAGE_CONFIG.featureSpaceTitle,
    locale,
    "featureSpaceTitle"
  );
  const featureSpaceDescription = resolveLocalizedConfigText(
    landingConfig.featureSpaceDescription,
    DEFAULT_LANDING_PAGE_CONFIG.featureSpaceDescription,
    locale,
    "featureSpaceDescription"
  );
  const featureServiceTitle = resolveLocalizedConfigText(
    landingConfig.featureServiceTitle,
    DEFAULT_LANDING_PAGE_CONFIG.featureServiceTitle,
    locale,
    "featureServiceTitle"
  );
  const featureServiceDescription = resolveLocalizedConfigText(
    landingConfig.featureServiceDescription,
    DEFAULT_LANDING_PAGE_CONFIG.featureServiceDescription,
    locale,
    "featureServiceDescription"
  );
  const spaceKicker = resolveLocalizedConfigText(
    landingConfig.spaceKicker,
    DEFAULT_LANDING_PAGE_CONFIG.spaceKicker,
    locale,
    "spaceKicker"
  );
  const spaceTitle = resolveLocalizedConfigText(
    landingConfig.spaceTitle,
    DEFAULT_LANDING_PAGE_CONFIG.spaceTitle,
    locale,
    "spaceTitle"
  );
  const spaceActionLabel = resolveLocalizedConfigText(
    landingConfig.spaceActionLabel,
    DEFAULT_LANDING_PAGE_CONFIG.spaceActionLabel,
    locale,
    "spaceActionLabel"
  );
  const newsKicker = resolveLocalizedConfigText(
    landingConfig.newsKicker,
    DEFAULT_LANDING_PAGE_CONFIG.newsKicker,
    locale,
    "newsKicker"
  );
  const newsTitle = resolveLocalizedConfigText(
    landingConfig.newsTitle,
    DEFAULT_LANDING_PAGE_CONFIG.newsTitle,
    locale,
    "newsTitle"
  );
  const primaryCtaLabel =
    locale !== "vi" &&
    (!landingConfig.primaryCtaLabel ||
      landingConfig.primaryCtaLabel === DEFAULT_LANDING_PAGE_CONFIG.primaryCtaLabel)
      ? getLocalizedText(locale, {
          vi: DEFAULT_LANDING_PAGE_CONFIG.primaryCtaLabel,
          en: "Book now",
          zh: "立即订位"
        })
      : landingConfig.primaryCtaLabel || DEFAULT_LANDING_PAGE_CONFIG.primaryCtaLabel;
  const heroImageUrl = landingConfig.heroImageUrl || "/assets/drive-hero-exterior.webp";
  const aboutImageUrl = landingConfig.aboutImageUrl || "/assets/drive-about-facade.webp";
  const spaceImageOneUrl = landingConfig.spaceImageOneUrl || "/assets/drive-space-dining-1.webp";
  const spaceImageTwoUrl = landingConfig.spaceImageTwoUrl || "/assets/drive-space-dining-2.webp";
  const spaceImageThreeUrl = landingConfig.spaceImageThreeUrl || "/assets/drive-space-lobby.webp";
  const spaceImageFourUrl = landingConfig.spaceImageFourUrl || "/assets/drive-space-private.webp";
  const newsImageOneUrl = landingConfig.newsImageOneUrl || "/assets/drive-news-winewall.webp";
  const newsImageTwoUrl = landingConfig.newsImageTwoUrl || "/assets/drive-news-table-close.webp";
  const newsImageThreeUrl = landingConfig.newsImageThreeUrl || "/assets/drive-news-place-setting.webp";
  const resolvedCombos = [
    {
      title: landingConfig.comboOneTitle || DEFAULT_LANDING_PAGE_CONFIG.comboOneTitle,
      price: landingConfig.comboOnePrice || DEFAULT_LANDING_PAGE_CONFIG.comboOnePrice,
      originalPrice:
        landingConfig.comboOneOriginalPrice || DEFAULT_LANDING_PAGE_CONFIG.comboOneOriginalPrice,
      description:
        landingConfig.comboOneDescription || DEFAULT_LANDING_PAGE_CONFIG.comboOneDescription,
      badge: landingConfig.comboOneBadge || DEFAULT_LANDING_PAGE_CONFIG.comboOneBadge,
      serves: landingConfig.comboOneServes || DEFAULT_LANDING_PAGE_CONFIG.comboOneServes
    },
    {
      title: landingConfig.comboTwoTitle || DEFAULT_LANDING_PAGE_CONFIG.comboTwoTitle,
      price: landingConfig.comboTwoPrice || DEFAULT_LANDING_PAGE_CONFIG.comboTwoPrice,
      originalPrice:
        landingConfig.comboTwoOriginalPrice || DEFAULT_LANDING_PAGE_CONFIG.comboTwoOriginalPrice,
      description:
        landingConfig.comboTwoDescription || DEFAULT_LANDING_PAGE_CONFIG.comboTwoDescription,
      badge: landingConfig.comboTwoBadge || DEFAULT_LANDING_PAGE_CONFIG.comboTwoBadge,
      serves: landingConfig.comboTwoServes || DEFAULT_LANDING_PAGE_CONFIG.comboTwoServes
    },
    {
      title: landingConfig.comboThreeTitle || DEFAULT_LANDING_PAGE_CONFIG.comboThreeTitle,
      price: landingConfig.comboThreePrice || DEFAULT_LANDING_PAGE_CONFIG.comboThreePrice,
      originalPrice:
        landingConfig.comboThreeOriginalPrice || DEFAULT_LANDING_PAGE_CONFIG.comboThreeOriginalPrice,
      description:
        landingConfig.comboThreeDescription || DEFAULT_LANDING_PAGE_CONFIG.comboThreeDescription,
      badge: landingConfig.comboThreeBadge || DEFAULT_LANDING_PAGE_CONFIG.comboThreeBadge,
      serves: landingConfig.comboThreeServes || DEFAULT_LANDING_PAGE_CONFIG.comboThreeServes
    }
  ];
  const activeHotline = selectedBranch?.phone || hotline;
  const activeHotlineDisplay = selectedBranch?.phone || hotlineDisplay;
  const activeZaloLink = `https://zalo.me/${String(activeHotline || hotline).replace(/[^\d]/g, "")}`;
  const chatTitle = DEFAULT_BRAND_NAME;
  const chatSummary = ui.chatSummary(displayBranchName);
  const chatSuggestions = useMemo(
    () => ui.chatSuggestions(displayBranchShortName),
    [displayBranchShortName, ui]
  );
  const activeVoucherCampaign = useMemo(() => {
    const branchFallback = buildFallbackVoucherCampaign(selectedBranchId);
    return (
      voucherCampaigns.find((item) => item.id === selectedVoucherCampaignId) ||
      voucherCampaigns[0] ||
      branchFallback
    );
  }, [selectedBranchId, selectedVoucherCampaignId, voucherCampaigns]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const storedLocale = window.localStorage.getItem("landing-locale");
    const nextLocale = normalizeLocale(params.get("lang") || storedLocale || "vi");
    setLocale(nextLocale);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.lang = locale === "zh" ? "zh-CN" : locale;

    const localizedTitle = getLocalizedText(locale, {
      vi: `${displayBranchName} | Hải sản cao cấp, đặt bàn nhanh, combo tiết kiệm`,
      en: `${displayBranchName} | Premium seafood, quick reservation, value combos`,
      zh: `${displayBranchName} | 高级海鲜，快速订位，精选套餐`
    });
    const titleBase = locale === "vi" ? landingConfig.seoTitle || localizedTitle : localizedTitle;
    document.title = titleBase;
  }, [displayBranchName, landingConfig.seoTitle, locale]);

  useEffect(() => {
    setChatReply(ui.chatReply(displayBranchName));
  }, [displayBranchName, ui]);

  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: displayBranchName,
      image: [heroImageUrl],
      telephone: activeHotlineDisplay,
      servesCuisine: ["Hải sản", "Việt Nam", "Fine dining"],
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: selectedBranch?.address || "Đường ven biển, Ấp Hồ Tràm",
        addressLocality: "Xuyên Mộc",
        addressRegion: "Bà Rịa - Vũng Tàu",
        addressCountry: "VN"
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ],
          opens: "10:00",
          closes: "22:00"
        }
      ],
      sameAs: [activeZaloLink]
    }),
    [activeHotlineDisplay, activeZaloLink, displayBranchName, heroImageUrl, selectedBranch]
  );

  useEffect(() => {
    let ignore = false;

    fetch("/api/branches")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (ignore || !payload?.data?.length) {
          return;
        }

        setBranches(payload.data);
        setSelectedBranchId(resolveInitialBranchId(payload.data, initialBranchCode));
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [initialBranchCode]);

  useEffect(() => {
    let ignore = false;

    fetch(
      `/api/voucher-campaigns${selectedBranchId ? `?branchId=${encodeURIComponent(selectedBranchId)}` : ""}`
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (ignore) {
          return;
        }

        const items = payload?.data?.length
          ? payload.data
          : [buildFallbackVoucherCampaign(selectedBranchId)];
        setVoucherCampaigns(items);
        setSelectedVoucherCampaignId((current) =>
          items.some((item) => item.id === current) ? current : items[0]?.id || ""
        );
      })
      .catch(() => {
        if (!ignore) {
          const fallback = [buildFallbackVoucherCampaign(selectedBranchId)];
          setVoucherCampaigns(fallback);
          setSelectedVoucherCampaignId(fallback[0]?.id || "");
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedBranchId]);

  useEffect(() => {
    let ignore = false;

    fetch(`/api/menu${selectedBranchId ? `?branchId=${encodeURIComponent(selectedBranchId)}` : ""}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (ignore || !payload?.data?.length) {
          return;
        }

        setFeaturedDishes(
          payload.data.map((item) => ({
            id: item.id,
            name: item.name,
            price: `${new Intl.NumberFormat("vi-VN").format(item.price || 0)}đ`,
            description: item.description || "Món nổi bật đang được phục vụ tại nhà hàng.",
            image: item.imageUrl || "/assets/dish-king-crab.png",
            offer: `Chọn ${item.name} và đội ngũ sẽ hỗ trợ ghép combo phù hợp hơn cho bàn của bạn.`,
            category: item.category || "Khác",
            availabilityStatus: item.availabilityStatus || "available",
            seasonNote: item.seasonNote || ""
          }))
        );
      })
      .catch(() => {});

    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".site-nav");
    const navLinks = [...document.querySelectorAll(".site-nav a")];
    const sliderTrack = document.querySelector(".menu-track");
    const cards = [...document.querySelectorAll(".dish-card")];
    const dots = [...document.querySelectorAll(".dot")];
    const controls = [...document.querySelectorAll(".slider-button")];
    const revealElements = document.querySelectorAll(".reveal");
    const sections = [...document.querySelectorAll("main section[id], header[id], footer[id]")];

    let currentIndex = 0;

    const onScroll = () => {
      header?.classList.toggle("is-scrolled", window.scrollY > 18);
    };

    const updateActiveLink = () => {
      let current = sections[0];

      sections.forEach((section) => {
        if (window.scrollY + 140 >= section.offsetTop) {
          current = section;
        }
      });

      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${current?.id}`;
        link.classList.toggle("is-active", isActive);
      });
    };

    const renderSlider = () => {
      if (!sliderTrack || !cards.length) {
        return;
      }

      const singleCardWidth = cards[0].getBoundingClientRect().width + 18;
      const perView = window.innerWidth <= 720 ? 1 : 2;
      const maxIndex = Math.max(0, cards.length - perView);
      currentIndex = Math.min(currentIndex, maxIndex);
      sliderTrack.style.transform = `translateX(-${currentIndex * singleCardWidth}px)`;

      cards.forEach((card, index) => {
        card.classList.toggle("is-current", index === currentIndex);
      });

      dots.forEach((dot, index) => {
        dot.hidden = index > maxIndex;
        dot.classList.toggle("is-active", index === currentIndex);
      });
    };

    const handleToggleClick = () => {
      if (!toggle || !nav) {
        return;
      }

      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("is-open", !expanded);
    };

    const handleNavLinkClick = () => {
      if (!toggle || !nav) {
        return;
      }

      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    };

    const handleControlClick = (direction) => {
      const perView = window.innerWidth <= 720 ? 1 : 2;
      const maxIndex = Math.max(0, cards.length - perView);
      currentIndex += direction === "next" ? 1 : -1;

      if (currentIndex > maxIndex) {
        currentIndex = 0;
      }

      if (currentIndex < 0) {
        currentIndex = maxIndex;
      }

      renderSlider();
    };

    const controlHandlers = controls.map((control) => {
      const handler = () => handleControlClick(control.dataset.direction);
      control.addEventListener("click", handler);
      return { control, handler };
    });

    const dotHandlers = dots.map((dot) => {
      const handler = () => {
        currentIndex = Number(dot.dataset.index);
        renderSlider();
      };
      dot.addEventListener("click", handler);
      return { dot, handler };
    });

    const navHandlers = navLinks.map((link) => {
      link.addEventListener("click", handleNavLinkClick);
      return link;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    revealElements.forEach((element) => observer.observe(element));

    if (toggle && nav) {
      toggle.addEventListener("click", handleToggleClick);
    }

    window.addEventListener("scroll", onScroll);
    window.addEventListener("scroll", updateActiveLink);
    window.addEventListener("resize", renderSlider);

    onScroll();
    updateActiveLink();
    renderSlider();

    return () => {
      ignore = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", updateActiveLink);
      window.removeEventListener("resize", renderSlider);

      if (toggle && nav) {
        toggle.removeEventListener("click", handleToggleClick);
      }

      navHandlers.forEach((link) => {
        link.removeEventListener("click", handleNavLinkClick);
      });

      controlHandlers.forEach(({ control, handler }) => {
        control.removeEventListener("click", handler);
      });

      dotHandlers.forEach(({ dot, handler }) => {
        dot.removeEventListener("click", handler);
      });

      observer.disconnect();
    };
  }, [featuredDishes.length, selectedBranchId]);

  const focusReservation = (offerName = "") => {
    const target = document.getElementById("reservation");
    if (offerName) {
      setSelectedOffer(offerName);
    }
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const focusOrderSection = () => {
    document.getElementById("order-online")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updateLocaleUrl = (nextLocale) => {
    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);

    if (nextLocale === "vi") {
      url.searchParams.delete("lang");
    } else {
      url.searchParams.set("lang", nextLocale);
    }

    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const switchLocale = (nextLocale) => {
    const normalizedLocale = normalizeLocale(nextLocale);
    setLocale(normalizedLocale);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("landing-locale", normalizedLocale);
    }

    updateLocaleUrl(normalizedLocale);
  };

  const cycleLocale = () => {
    const currentIndex = LANDING_LOCALES.indexOf(locale);
    const nextLocale = LANDING_LOCALES[(currentIndex + 1) % LANDING_LOCALES.length];
    switchLocale(nextLocale);
  };

  const handleBranchSelect = (branchId) => {
    const nextBranch = branches.find((item) => item.id === branchId);
    if (!nextBranch) {
      return;
    }

    setSelectedBranchId(nextBranch.id);
    setSelectedVoucherCampaignId("");
    const nextPath = getBranchLandingPath(nextBranch);
    router.push(locale === "vi" ? nextPath : `${nextPath}?lang=${locale}`);
  };

  const addDishToOrder = (dish) => {
    setOrderForm((prev) => {
      const currentItem = prev.items.find(
        (item) => item.menuItemId === dish.id || item.itemName === dish.name
      );

      if (currentItem) {
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.menuItemId === dish.id || item.itemName === dish.name
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }

      return {
        ...prev,
        items: [
          ...prev.items,
          {
            menuItemId: dish.id || "",
            itemName: dish.name,
            unitPrice: parseMoneyToNumber(dish.price),
            quantity: 1
          }
        ]
      };
    });
  };

  const handleReservationSubmit = async (event) => {
    event.preventDefault();
    setReservationLoading(true);
    setReservationStatus("");
    setReservationError("");

    if (!isValidVietnamPhone(reservationForm.phone)) {
      setReservationLoading(false);
      setReservationError("Số điện thoại cần đúng định dạng di động Việt Nam.");
      return;
    }

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reservationForm,
          branchId: selectedBranchId,
          phone: formatVietnamPhone(reservationForm.phone),
          selectedOffer
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "submit_failed");
      }

      setReservationStatus(
        payload.message ||
          `Đặt bàn đã được ghi nhận cho ${reservationPreview.toLowerCase()}. Đội ngũ sẽ liên hệ xác nhận qua hotline hoặc Zalo.`
      );
      setReservationForm({
        name: "",
        phone: "",
        guests: "2",
        date: reservationMinDate,
        timeSlot: RESERVATION_TIME_SLOTS[14] || "17:00",
        referralCode: ""
      });
      setSelectedOffer("");
    } catch (error) {
      setReservationError(
        error.message || "Chưa gửi được yêu cầu. Vui lòng thử lại hoặc gọi ngay hotline."
      );
    } finally {
      setReservationLoading(false);
    }
  };

  const handleVoucherSubmit = async (event) => {
    event.preventDefault();
    setVoucherLoading(true);
    setVoucherStatus("");
    setVoucherError("");

    if (!isValidVietnamPhone(voucherPhone)) {
      setVoucherLoading(false);
      setVoucherError("Số điện thoại nhận ưu đãi cần đúng định dạng di động Việt Nam.");
      return;
    }

    try {
      const response = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: voucherPhone,
          branchId: selectedBranchId,
          campaignId: activeVoucherCampaign?.id || ""
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "voucher_failed");
      }

      setVoucherResult(
        payload.data || generateVoucherPayload(voucherPhone, activeVoucherCampaign, selectedBranchId)
      );
      setVoucherStatus(payload.message || "Đã giữ ưu đãi thành công cho số điện thoại của bạn.");
      setVoucherPhone("");
    } catch (error) {
      setVoucherError(error.message || "Chưa nhận được ưu đãi. Vui lòng thử lại sau.");
    } finally {
      setVoucherLoading(false);
    }
  };

  const toggleOrderItem = (dish) => {
    setOrderForm((prev) => {
      const exists = prev.items.find((item) => item.menuItemId === dish.id || item.itemName === dish.name);
      if (exists) {
        return {
          ...prev,
          items: prev.items.filter((item) => item.menuItemId !== dish.id && item.itemName !== dish.name)
        };
      }

      return {
        ...prev,
        items: [
          ...prev.items,
          {
            menuItemId: dish.id || "",
            itemName: dish.name,
            unitPrice: parseMoneyToNumber(dish.price),
            quantity: 1
          }
        ]
      };
    });
  };

  const updateOrderQuantity = (dishName, quantity) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.itemName === dishName ? { ...item, quantity: Math.max(1, Number(quantity) || 1) } : item
      )
    }));
  };

  const handleOrderSubmit = async (event) => {
    event.preventDefault();
    setOrderLoading(true);
    setOrderStatus("");
    setOrderError("");

    if (!isValidVietnamPhone(orderForm.customerPhone)) {
      setOrderLoading(false);
      setOrderError("Số điện thoại đặt món cần đúng định dạng di động Việt Nam.");
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orderForm,
          branchId: selectedBranchId,
          customerPhone: formatVietnamPhone(orderForm.customerPhone)
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "order_failed");
      }

      setOrderStatus(
        payload.message || "Yêu cầu đặt món đã được ghi nhận. Admin có thể xử lý trực tiếp trong tab Orders."
      );
      setOrderForm({
        customerName: "",
        customerPhone: "",
        referralCode: "",
        notes: "",
        items: []
      });
    } catch (error) {
      setOrderError(
        error.message ||
          "Chưa gửi được yêu cầu đặt món. Vui lòng thử lại hoặc gọi hotline để xác nhận nhanh."
      );
    } finally {
      setOrderLoading(false);
    }
  };

  const sendChat = (message) => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    setChatReply(
      buildChatReply(trimmed, displayBranchName, activeHotline, activeHotlineDisplay, locale)
    );
    setChatInput("");
  };

  const openUpsell = (title, offer) => {
    setUpsellModal({ title, offer });
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <header className="site-header" id="top">
        <div className="container header-inner">
          <a className="brand brand-lockup" href="#top" aria-label={displayBranchName}>
            <img src="/assets/logo-full.png" alt={displayBranchName} />
          </a>

          <div className="mobile-header-actions">
            <button
              className="header-language-chip"
              type="button"
              aria-label={ui.currentLanguageAria}
              title={ui.localeName}
              onClick={cycleLocale}
            >
              <span>{ui.localeLabel}</span>
            </button>

            <button
              className="menu-toggle"
              type="button"
              aria-expanded="false"
              aria-controls="nav-list"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>

          <nav className="site-nav" aria-label={ui.nav.home}>
            <ul id="nav-list">
              <li>
                <a href="#top" className="is-active">
                  {ui.nav.home}
                </a>
              </li>
              <li>
                <a href="#about">{ui.nav.about}</a>
              </li>
              <li>
                <a href="#menu">{ui.nav.menu}</a>
              </li>
              <li>
                <a href="#reservation">{ui.nav.reservation}</a>
              </li>
              <li>
                <a href="#space">{ui.nav.space}</a>
              </li>
              <li>
                <a href="#news">{ui.nav.news}</a>
              </li>
              <li>
                <a href="#contact">{ui.nav.contact}</a>
              </li>
            </ul>
            <div className="nav-mobile-panels">
              <div className="nav-mobile-card">
                <span className="nav-mobile-kicker">{ui.currentBranch}</span>
                <strong>{displayBranchName}</strong>
                <span>{selectedBranch?.address || "Đường ven biển, Hồ Tràm, Xuyên Mộc"}</span>
                {(branches || []).length > 1 ? (
                  <select
                    className="nav-mobile-select"
                    value={selectedBranchId}
                    onChange={(event) => handleBranchSelect(event.target.value)}
                  >
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
              <div className="nav-mobile-card">
                <span className="nav-mobile-kicker">{ui.language}</span>
                <div className="nav-language-list">
                  <button
                    type="button"
                    className={`nav-language-chip${locale === "vi" ? " is-active" : ""}`}
                    onClick={() => switchLocale("vi")}
                  >
                    VI
                  </button>
                  <button
                    type="button"
                    className={`nav-language-chip${locale === "en" ? " is-active" : ""}`}
                    onClick={() => switchLocale("en")}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    className={`nav-language-chip${locale === "zh" ? " is-active" : ""}`}
                    onClick={() => switchLocale("zh")}
                  >
                    中文
                  </button>
                </div>
                <span>{ui.languageApplied}</span>
              </div>
            </div>
          </nav>

          <a className="button button-primary header-cta" href="#reservation">
            {ui.nav.reservation}
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div
            className="hero-scene"
            aria-hidden="true"
            style={{ backgroundImage: `url("${heroImageUrl}")` }}
          ></div>
          <div className="hero-overlay"></div>
          <img className="hero-coral hero-coral-left" src="/assets/coral-pattern.png" alt="" />
          <div className="container hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">{heroEyebrow}</p>
              <h1>
                {heroTitle}
                {heroSubtitle ? (
                  <>
                    <br />
                    {heroSubtitle}
                  </>
                ) : null}
              </h1>
              <p className="hero-text">
                {heroDescriptionLines.map((line, index) => (
                  <span key={`${line}-${index}`}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </p>
              <div className="hero-actions">
                <button className="button button-primary" type="button" onClick={() => focusReservation()}>
                  {primaryCtaLabel}
                </button>
              </div>
              <div className="hero-scroll">
                <span>{ui.heroScroll}</span>
                <span className="hero-scroll-line" aria-hidden="true"></span>
              </div>
            </div>
          </div>
          <img className="hero-wave" src="/assets/wave-divider.svg" alt="" />
        </section>

        <section className="about section" id="about">
          <div className="container about-grid">
            <div className="about-copy reveal">
              <p className="section-kicker">{ui.aboutKicker}</p>
              <h2>{aboutTitle}</h2>
              <p>{aboutParagraphOne}</p>
              <p>{aboutParagraphTwo}</p>
              <a className="button button-primary" href="#space">
                {ui.aboutMore}
              </a>
            </div>

            <div className="about-card about-card-drive reveal">
              <img src={aboutImageUrl} alt={`Mặt tiền ${displayBranchName}`} loading="lazy" decoding="async" />
              <div className="about-card-badge">
                <strong>{aboutBadgeTitle}</strong>
                <span>{aboutBadgeSubtitle}</span>
              </div>
            </div>
          </div>

          <div className="container feature-strip reveal">
            <article className="feature-item">
              <span className="feature-icon">✺</span>
              <div>
                <h3>{featureSeafoodTitle}</h3>
                <p>{featureSeafoodDescription}</p>
              </div>
            </article>
            <article className="feature-item">
              <span className="feature-icon">⌘</span>
              <div>
                <h3>{featureChefTitle}</h3>
                <p>{featureChefDescription}</p>
              </div>
            </article>
            <article className="feature-item">
              <span className="feature-icon">◌</span>
              <div>
                <h3>{featureSpaceTitle}</h3>
                <p>{featureSpaceDescription}</p>
              </div>
            </article>
            <article className="feature-item">
              <span className="feature-icon">♡</span>
              <div>
                <h3>{featureServiceTitle}</h3>
                <p>{featureServiceDescription}</p>
              </div>
            </article>
          </div>
        </section>

        <section className="reservation section" id="reservation">
          <div className="container reservation-grid">
            <div className="reservation-copy reveal">
              <p className="section-kicker">{ui.reservationKicker}</p>
              <h2>{ui.reservationTitle}</h2>
              <p>{ui.reservationDescription}</p>
              <div className="contact-quick-cards">
                <a className="contact-quick-card" href={`tel:${activeHotline}`}>
                  <strong>{ui.callNow}</strong>
                  <span>{activeHotlineDisplay}</span>
                </a>
                <a className="contact-quick-card" href={activeZaloLink} target="_blank" rel="noreferrer">
                  <strong>{ui.zaloLabel}</strong>
                  <span>{ui.zaloQuick}</span>
                </a>
              </div>
              {(branches || []).length > 1 ? (
                <label className="branch-selector">
                  <span>{ui.selectBranch}</span>
                  <select
                    value={selectedBranchId}
                    onChange={(event) => handleBranchSelect(event.target.value)}
                  >
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="branch-inline-note">
                  <strong>{ui.receivingLeadsAt}</strong> {selectedBranch?.name || "San Hô Đỏ Hồ Tràm"}
                </div>
              )}
            </div>

            <form className="reservation-form reveal" onSubmit={handleReservationSubmit}>
              {selectedOffer ? (
                <div className="selected-offer-banner">
                  <strong>{ui.interestedIn}</strong> {selectedOffer}
                </div>
              ) : null}
              <label>
                <span>{ui.form.name}</span>
                <input
                  type="text"
                  value={reservationForm.name}
                  onChange={(event) =>
                    setReservationForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                <span>{ui.form.phone}</span>
                <input
                  type="tel"
                  value={reservationForm.phone}
                  onChange={(event) =>
                    setReservationForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder={ui.form.phonePlaceholder}
                  required
                />
              </label>
              <div className="reservation-form-row">
                <label>
                  <span>{ui.form.guests}</span>
                  <select
                    value={reservationForm.guests}
                    onChange={(event) =>
                      setReservationForm((prev) => ({ ...prev, guests: event.target.value }))
                    }
                  >
                    <option value="2">2 khách</option>
                    <option value="4">4 khách</option>
                    <option value="6">6 khách</option>
                    <option value="8">8 khách</option>
                    <option value="10+">10+ khách</option>
                  </select>
                </label>
                <label>
                  <span>{ui.form.arrivalDate}</span>
                  <input
                    type="date"
                    min={reservationMinDate}
                    value={reservationForm.date}
                    onChange={(event) =>
                      setReservationForm((prev) => ({ ...prev, date: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>
              <label>
                <span>{ui.form.timeSlot}</span>
                <select
                  value={reservationForm.timeSlot}
                  onChange={(event) =>
                    setReservationForm((prev) => ({ ...prev, timeSlot: event.target.value }))
                  }
                >
                  {RESERVATION_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{ui.form.referralCode}</span>
                <input
                  type="text"
                  value={reservationForm.referralCode || ""}
                  onChange={(event) =>
                    setReservationForm((prev) => ({ ...prev, referralCode: event.target.value }))
                  }
                  placeholder={ui.form.referralPlaceholder}
                />
              </label>
              <div className="form-note">
                <strong>{ui.reservationNotePrefix}</strong> {ui.reservationNoteHours}
                {reservationPreview ? (
                  <span> {ui.selectedSchedule} {reservationPreview}.</span>
                ) : null}
                {selectedBranch ? <span> {ui.handlingBranch} {selectedBranch.name}.</span> : null}
              </div>
              <label>
                <span>{ui.form.notes}</span>
                <textarea
                  rows={3}
                  value={reservationForm.notes || ""}
                  onChange={(event) =>
                    setReservationForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder={ui.form.notesPlaceholder}
                />
              </label>
              <button className="button button-primary" type="submit" disabled={reservationLoading}>
                {reservationLoading ? ui.submitting : ui.submitReservation}
              </button>
              {reservationError ? <p className="form-status is-error">{reservationError}</p> : null}
              {reservationStatus ? <div className="form-success-card">{reservationStatus}</div> : null}
            </form>
          </div>
        </section>

        <section className="menu section" id="menu">
          <div className="menu-backdrop" aria-hidden="true"></div>
          <div className="container menu-layout">
            <div className="menu-copy reveal">
              <p className="section-kicker">{ui.menuKicker}</p>
              <h2>{ui.menuTitle}</h2>
              <p>{ui.menuDescription}</p>
              <div className="menu-category-pills">
                {menuCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`menu-category-pill${
                      activeMenuCategory === category ? " is-active" : ""
                    }`}
                    onClick={() => {
                      setActiveMenuCategory(category);
                      focusOrderSection();
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="menu-controls">
                <button
                  className="slider-button"
                  type="button"
                  data-direction="prev"
                  aria-label={ui.prevDish}
                >
                  &#8592;
                </button>
                <button
                  className="slider-button"
                  type="button"
                  data-direction="next"
                  aria-label={ui.nextDish}
                >
                  &#8594;
                </button>
              </div>
            </div>

            <div className="menu-slider reveal">
              <div className="menu-track">
                {featuredDishes.map((dish, index) => (
                  <article className={`dish-card${index === 0 ? " is-current" : ""}`} key={dish.name}>
                    <img src={dish.image} alt={dish.name} loading="lazy" decoding="async" />
                    <div className="dish-card-body">
                      <div className="dish-card-flags">
                        <span className={`dish-flag is-${dish.availabilityStatus || "available"}`}>
                          {getAvailabilityLabel(dish.availabilityStatus)}
                        </span>
                        <span className="dish-category">{dish.category}</span>
                      </div>
                      <div className="dish-meta">
                        <h3>{dish.name}</h3>
                        <span className="dish-price">{dish.price}</span>
                      </div>
                      <p>{dish.description}</p>
                      {dish.seasonNote ? <small className="dish-note">{dish.seasonNote}</small> : null}
                      <div className="dish-actions">
                        <button
                          className="button button-primary"
                          type="button"
                          onClick={() => {
                            addDishToOrder(dish);
                            openUpsell(dish.name, dish.offer);
                            focusOrderSection();
                          }}
                        >
                          {ui.chooseDish}
                        </button>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => focusReservation(dish.name)}
                        >
                          {ui.bookNow}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="slider-dots" aria-label={ui.dishChooser}>
                {featuredDishes.map((dish, index) => (
                  <button
                    key={dish.name}
                    className={`dot${index === 0 ? " is-active" : ""}`}
                    type="button"
                    data-index={index}
                    aria-label={ui.dishNumber(index)}
                  ></button>
                ))}
              </div>
            </div>
          </div>

          <div className="container combo-section reveal">
            <div className="section-heading align-left">
              <p className="section-kicker">
                {landingConfig.comboSectionKicker || DEFAULT_LANDING_PAGE_CONFIG.comboSectionKicker}
              </p>
              <h2>{landingConfig.comboSectionTitle || DEFAULT_LANDING_PAGE_CONFIG.comboSectionTitle}</h2>
            </div>
            <div className="combo-grid">
              {resolvedCombos.map((combo) => (
                <article className="combo-card" key={combo.title}>
                  <span className="combo-badge">{combo.badge}</span>
                  <h3>{combo.title}</h3>
                  <span className="combo-serves">{combo.serves}</span>
                  <strong className="combo-price">{combo.price}</strong>
                  <span className="combo-original-price">{combo.originalPrice}</span>
                  <p>{combo.description}</p>
                  <div className="dish-actions">
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() =>
                        openUpsell(combo.title, "Đặt combo này và thêm món khai vị sẽ giảm ngay 10%.")
                      }
                    >
                      {ui.chooseCombo}
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => focusReservation(combo.title)}
                    >
                      {ui.bookCombo}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="space section" id="space">
          <img className="space-coral" src="/assets/coral-pattern.png" alt="" />
          <div className="container">
            <div className="section-heading reveal">
              <p className="section-kicker">{spaceKicker}</p>
              <h2>{spaceTitle}</h2>
            </div>
            <div className="space-grid">
              <article className="space-card reveal">
                <img
                  src={spaceImageOneUrl}
                  alt="Khu vực bàn tiệc lớn với tủ rượu phía sau"
                  loading="lazy"
                  decoding="async"
                />
              </article>
              <article className="space-card reveal">
                <img
                  src={spaceImageTwoUrl}
                  alt="Khu vực bàn tròn sang trọng trong nhà hàng"
                  loading="lazy"
                  decoding="async"
                />
              </article>
              <article className="space-card reveal">
                <img src={spaceImageThreeUrl} alt="Sảnh đón khách và khu trưng bày" loading="lazy" decoding="async" />
              </article>
              <article className="space-card reveal">
                <img src={spaceImageFourUrl} alt="Phòng riêng ấm cúng cho nhóm nhỏ" loading="lazy" decoding="async" />
              </article>
            </div>
            <div className="section-action reveal">
              <a className="button button-secondary" href="#contact">
                {spaceActionLabel}
              </a>
            </div>
          </div>
        </section>

        <section className="order-online section" id="order-online">
          <div className="container order-online-grid">
            <div className="order-online-copy reveal">
              <p className="section-kicker">{ui.orderKicker}</p>
              <h2>{ui.orderTitle}</h2>
              <p>{ui.orderDescription}</p>
              <div className="menu-category-pills is-light">
                {menuCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`menu-category-pill${
                      activeMenuCategory === category ? " is-active" : ""
                    }`}
                    onClick={() => setActiveMenuCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <form className="order-online-form reveal" onSubmit={handleOrderSubmit}>
              <div className="order-selection-grid">
                {filteredDishes.map((dish) => {
                  const selected = orderForm.items.some(
                    (item) => item.menuItemId === dish.id || item.itemName === dish.name
                  );

                  return (
                    <label
                      key={dish.name}
                      className={`order-pick-card${selected ? " is-selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleOrderItem(dish)}
                      />
                      <div>
                        <strong>{dish.name}</strong>
                        <span>{dish.price}</span>
                        {dish.seasonNote ? <small>{dish.seasonNote}</small> : null}
                      </div>
                    </label>
                  );
                })}
              </div>
              {!filteredDishes.length ? (
                <div className="form-note">{ui.noDishes}</div>
              ) : null}

              {orderForm.items.length ? (
                <div className="order-selected-list">
                  {orderForm.items.map((item) => (
                    <div className="order-selected-row" key={item.itemName}>
                      <div>
                        <span>{item.itemName}</span>
                        <small>{formatMoney((item.unitPrice || 0) * (item.quantity || 0))}</small>
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) => updateOrderQuantity(item.itemName, event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="order-summary-card">
                <div>
                  <strong>{ui.subtotal}</strong>
                  <span>{orderForm.items.length} {ui.selectedItems}</span>
                </div>
                <strong>{formatMoney(orderSubtotal)}</strong>
              </div>

              <label>
                <span>{ui.customerName}</span>
                <input
                  type="text"
                  value={orderForm.customerName}
                  onChange={(event) =>
                    setOrderForm((prev) => ({ ...prev, customerName: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                <span>{ui.form.phone}</span>
                <input
                  type="tel"
                  value={orderForm.customerPhone}
                  onChange={(event) =>
                    setOrderForm((prev) => ({ ...prev, customerPhone: event.target.value }))
                  }
                  placeholder={ui.form.phonePlaceholder}
                  required
                />
              </label>
              <label>
                <span>{ui.form.referralCode}</span>
                <input
                  type="text"
                  value={orderForm.referralCode || ""}
                  onChange={(event) =>
                    setOrderForm((prev) => ({ ...prev, referralCode: event.target.value }))
                  }
                  placeholder={ui.form.referralPlaceholder}
                />
              </label>
              <label>
                <span>{ui.additionalNotes}</span>
                <textarea
                  rows={4}
                  value={orderForm.notes}
                  onChange={(event) =>
                    setOrderForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder={ui.orderNotesPlaceholder}
                />
              </label>
              <button
                className="button button-primary"
                type="submit"
                disabled={orderLoading || !orderForm.items.length}
              >
                {orderLoading ? ui.submitting : ui.submitOrder}
              </button>
              {orderError ? <p className="form-status is-error">{orderError}</p> : null}
              {orderStatus ? <div className="form-success-card">{orderStatus}</div> : null}
            </form>
          </div>
        </section>

        <section className="voucher section" id="voucher">
          <div className="container voucher-grid">
            <div className="voucher-copy reveal">
              <p className="section-kicker">{ui.voucherKicker}</p>
              <h2>{ui.voucherTitle}</h2>
              <p>{ui.voucherDescription}</p>
              {selectedBranch ? (
                <div className="branch-inline-note">
                  <strong>{ui.voucherBranch}</strong> {selectedBranch.name}
                </div>
              ) : null}
              {voucherCampaigns.length > 1 ? (
                <div className="voucher-campaign-list">
                  {voucherCampaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      type="button"
                      className={`voucher-campaign-chip ${
                        campaign.id === activeVoucherCampaign?.id ? "is-active" : ""
                      }`}
                      onClick={() => setSelectedVoucherCampaignId(campaign.id)}
                    >
                      <strong>{campaign.title}</strong>
                      <span>{formatVoucherBenefit(campaign)}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="voucher-offer-card">
                <strong>{activeVoucherCampaign?.title || VOUCHER_PRESET.title}</strong>
                <p>{activeVoucherCampaign?.description || VOUCHER_PRESET.description}</p>
                <span>
                  {formatVoucherBenefit(activeVoucherCampaign)} • {ui.voucherValidity}{" "}
                  {activeVoucherCampaign?.validDays || VOUCHER_PRESET.validDays} {ui.voucherDays}
                </span>
              </div>
            </div>
            <form className="voucher-form reveal" onSubmit={handleVoucherSubmit}>
              {voucherCampaigns.length > 1 ? (
                <label>
                  <span>{ui.voucherCampaign}</span>
                  <select
                    value={selectedVoucherCampaignId}
                    onChange={(event) => setSelectedVoucherCampaignId(event.target.value)}
                  >
                    {voucherCampaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.title} - {formatVoucherBenefit(campaign)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label>
                <span>{ui.voucherPhone}</span>
                <input
                  type="tel"
                  value={voucherPhone}
                  onChange={(event) => setVoucherPhone(event.target.value)}
                  placeholder={ui.voucherPhonePlaceholder}
                  required
                />
              </label>
              <button className="button button-primary" type="submit" disabled={voucherLoading}>
                {voucherLoading ? ui.voucherProcessing : ui.voucherSubmit}
              </button>
              {voucherError ? <p className="form-status is-error">{voucherError}</p> : null}
              {voucherStatus ? <p className="form-status">{voucherStatus}</p> : null}
              {voucherResult ? (
                <div className="voucher-result-card">
                  <span>{ui.voucherCode}</span>
                  <strong>{voucherResult.voucherCode}</strong>
                  <p>
                    {voucherResult.voucherTitle} -{" "}
                    {voucherResult.voucherDiscountType === "percent"
                      ? `giảm ${voucherResult.voucherDiscountValue}%`
                      : `giảm ${formatMoney(voucherResult.voucherDiscountValue)}`}
                  </p>
                  <small>
                    {ui.voucherExpires}{" "}
                    {new Intl.DateTimeFormat("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    }).format(new Date(voucherResult.expiresAt))}
                  </small>
                  {activeVoucherCampaign?.minOrderValue ? (
                    <small>
                      {ui.voucherMinOrder} {formatMoney(activeVoucherCampaign.minOrderValue)}.
                    </small>
                  ) : null}
                </div>
              ) : null}
            </form>
          </div>
        </section>

        <section className="news section" id="news">
          <div className="container">
            <div className="section-heading align-left reveal">
              <p className="section-kicker">{newsKicker}</p>
              <h2>{newsTitle}</h2>
            </div>

            <div className="news-grid">
              <article className="news-card news-card-drive reveal">
                <img
                  src={newsImageOneUrl}
                  alt="Tủ rượu và khu vực bàn tiệc sang trọng"
                  loading="lazy"
                  decoding="async"
                />
                <div className="news-body">
                  <span className="news-tag">
                    {landingConfig.newsOneTag || DEFAULT_LANDING_PAGE_CONFIG.newsOneTag}
                  </span>
                  <h3>{landingConfig.newsOneTitle || DEFAULT_LANDING_PAGE_CONFIG.newsOneTitle}</h3>
                  <p>
                    {landingConfig.newsOneDescription ||
                      DEFAULT_LANDING_PAGE_CONFIG.newsOneDescription}
                  </p>
                  <span className="news-date">
                    {landingConfig.newsOneDateLabel || DEFAULT_LANDING_PAGE_CONFIG.newsOneDateLabel}
                  </span>
                </div>
              </article>
              <article className="news-card news-card-drive reveal">
                <img
                  src={newsImageTwoUrl}
                  alt="Cận cảnh bàn ăn được chuẩn bị sẵn"
                  loading="lazy"
                  decoding="async"
                />
                <div className="news-body">
                  <span className="news-tag news-tag-alt">
                    {landingConfig.newsTwoTag || DEFAULT_LANDING_PAGE_CONFIG.newsTwoTag}
                  </span>
                  <h3>{landingConfig.newsTwoTitle || DEFAULT_LANDING_PAGE_CONFIG.newsTwoTitle}</h3>
                  <p>
                    {landingConfig.newsTwoDescription ||
                      DEFAULT_LANDING_PAGE_CONFIG.newsTwoDescription}
                  </p>
                  <span className="news-date">
                    {landingConfig.newsTwoDateLabel || DEFAULT_LANDING_PAGE_CONFIG.newsTwoDateLabel}
                  </span>
                </div>
              </article>
              <article className="news-card news-card-drive reveal">
                <img
                  src={newsImageThreeUrl}
                  alt="Không gian bàn riêng với cách bày trí tinh tế"
                  loading="lazy"
                  decoding="async"
                />
                <div className="news-body">
                  <span className="news-tag">
                    {landingConfig.newsThreeTag || DEFAULT_LANDING_PAGE_CONFIG.newsThreeTag}
                  </span>
                  <h3>{landingConfig.newsThreeTitle || DEFAULT_LANDING_PAGE_CONFIG.newsThreeTitle}</h3>
                  <p>
                    {landingConfig.newsThreeDescription ||
                      DEFAULT_LANDING_PAGE_CONFIG.newsThreeDescription}
                  </p>
                  <span className="news-date">
                    {landingConfig.newsThreeDateLabel ||
                      DEFAULT_LANDING_PAGE_CONFIG.newsThreeDateLabel}
                  </span>
                </div>
              </article>
            </div>
            <div className="section-action reveal">
              <a className="button button-secondary" href="#news">
                {ui.viewAllNews}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <img className="footer-coral" src="/assets/coral-pattern.png" alt="" />
        <div className="container footer-grid">
          <div>
            <a className="brand brand-lockup footer-brand" href="#top">
              <img src="/assets/logo-full.png" alt={displayBranchName} />
            </a>
            <p className="footer-text">
              {landingConfig.footerDescription || DEFAULT_LANDING_PAGE_CONFIG.footerDescription}
            </p>
          </div>

          <div>
            <h3>{ui.footerLinks}</h3>
            <ul className="footer-links">
              <li>
                <a href="#top">{ui.nav.home}</a>
              </li>
              <li>
                <a href="#about">{ui.nav.about}</a>
              </li>
              <li>
                <a href="#menu">{ui.nav.menu}</a>
              </li>
              <li>
                <a href="#reservation">{ui.nav.reservation}</a>
              </li>
              <li>
                <a href="#space">{ui.nav.space}</a>
              </li>
              <li>
                <a href="#news">{ui.nav.news}</a>
              </li>
            </ul>
          </div>

          <div>
            <h3>{ui.footerContact}</h3>
            <ul className="footer-meta">
              <li>{selectedBranch?.address || "Đường ven biển, Ấp Hồ Tràm, Xã Phước Thuận, H. Xuyên Mộc, Bà Rịa - Vũng Tàu"}</li>
              <li>{activeHotlineDisplay}</li>
              <li>{secondaryHotlineDisplay}</li>
              <li>info@sanhodohotram.vn</li>
              <li>10:00 - 22:00 (Thứ 2 - Chủ nhật)</li>
            </ul>
          </div>

          <div>
            <h3>{ui.footerQuickOffer}</h3>
            <form className="subscribe-form" onSubmit={handleVoucherSubmit}>
              <input
                type="tel"
                placeholder={ui.footerVoucherPlaceholder}
                aria-label={ui.voucherPhone}
                value={voucherPhone}
                onChange={(event) => setVoucherPhone(event.target.value)}
              />
              <button className="button button-primary" type="submit" disabled={voucherLoading}>
                {voucherLoading ? ui.submitting : ui.footerVoucherButton}
              </button>
            </form>
          </div>
        </div>
        <div className="footer-bar">
          <div className="container footer-bar-inner">
            <span>{ui.footerCopyright(displayBranchName)}</span>
            <span>{ui.footerCredit}</span>
          </div>
        </div>
      </footer>

      <div className="sticky-cta-bar">
        <button className="sticky-cta-item sticky-cta-book" type="button" onClick={() => focusReservation()}>
          {ui.stickyBook}
        </button>
      </div>

      <div className="floating-contact-actions">
        <a
          className="contact-float contact-float-call"
          href={`tel:${activeHotline}`}
          aria-label={`Gọi ${displayBranchName}`}
        >
          <Phone className="size-5" />
        </a>
        <button
          className="contact-float chat-toggle"
          type="button"
          onClick={() => setChatOpen((prev) => !prev)}
          aria-label={chatOpen ? ui.closeChat : ui.openChat(displayBranchName)}
        >
          {chatOpen ? <X className="size-5" /> : <MessageCircle className="size-5" />}
        </button>
      </div>

      {chatOpen ? (
          <div className="chat-panel">
          <div className="chat-panel-header">
            <div>
              <strong>{chatTitle}</strong>
              <span>{chatSummary}</span>
            </div>
            <button type="button" onClick={() => setChatOpen(false)}>
              ×
            </button>
          </div>
          {chatReply ? <div className="chat-response">{chatReply}</div> : null}
          <div className="chat-suggestions">
            {chatSuggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => sendChat(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
          <form
            className="chat-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              sendChat(chatInput);
            }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder={ui.chatPlaceholder}
            />
            <button type="submit">{ui.chatSubmit}</button>
          </form>
        </div>
      ) : null}

      {upsellModal ? (
        <div className="modal-backdrop" onClick={() => setUpsellModal(null)}>
          <div className="upsell-modal" onClick={(event) => event.stopPropagation()}>
            <span className="modal-kicker">Upsell tự động</span>
            <h3>{upsellModal.title}</h3>
            <p>{upsellModal.offer}</p>
            <div className="upsell-actions">
              <button
                className="button button-primary"
                type="button"
                onClick={() => {
                  setSelectedOffer(upsellModal.title);
                  setUpsellModal(null);
                  focusReservation(upsellModal.title);
                }}
              >
                {ui.bookWithOffer}
              </button>
              <button className="button button-secondary" type="button" onClick={() => setUpsellModal(null)}>
                {ui.viewMoreCombos}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
