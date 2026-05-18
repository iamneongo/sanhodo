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
const secondaryHotline = "0522282229";
const secondaryHotlineDisplay = "0522 282 229";
const reservationMinDate = getTodayDateInput();

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

const quickAnswers = [
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
];

function getChatReply(input) {
  const normalized = input.toLowerCase();
  const matched = quickAnswers.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword))
  );

  if (matched) {
    return matched.answer;
  }

  return "Mình có thể hỗ trợ nhanh về menu, giá, đặt bàn, đường đi hoặc gợi ý combo phù hợp số người. Bạn cứ nhắn ngắn gọn là được.";
}

function buildChatReply(input, branchName, hotlineValue, hotlineText) {
  const baseReply = getChatReply(input);

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
  const [chatMessages, setChatMessages] = useState([
    {
      role: "bot",
      text: "Xin chào. Mình có thể hỗ trợ menu, giá, đặt bàn, đường đi và gợi ý combo phù hợp."
    }
  ]);
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
  const displayBranchName = selectedBranch?.name || "San Hô Đỏ Hồ Tràm";
  const displayBranchShortName = selectedBranch?.shortName || "Hồ Tràm";
  const defaultSecondaryLine =
    displayBranchShortName && !displayBranchName.toLowerCase().includes(displayBranchShortName.toLowerCase())
      ? displayBranchShortName
      : "";
  const brandPrimaryLine = landingConfig.brandPrimary || displayBranchName;
  const brandSecondaryLine = landingConfig.brandSecondary || defaultSecondaryLine;
  const heroEyebrow = landingConfig.heroEyebrow || DEFAULT_LANDING_PAGE_CONFIG.heroEyebrow;
  const heroTitle = landingConfig.heroTitle || brandPrimaryLine;
  const heroSubtitle = landingConfig.heroSubtitle || brandSecondaryLine;
  const heroDescriptionLines = String(
    landingConfig.heroDescription || DEFAULT_LANDING_PAGE_CONFIG.heroDescription
  )
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const heroImageUrl = landingConfig.heroImageUrl || "/assets/drive-hero-exterior.jpg";
  const aboutImageUrl = landingConfig.aboutImageUrl || "/assets/drive-about-facade.jpg";
  const spaceImageOneUrl = landingConfig.spaceImageOneUrl || "/assets/drive-space-dining-1.jpg";
  const spaceImageTwoUrl = landingConfig.spaceImageTwoUrl || "/assets/drive-space-dining-2.jpg";
  const spaceImageThreeUrl = landingConfig.spaceImageThreeUrl || "/assets/drive-space-lobby.jpg";
  const spaceImageFourUrl = landingConfig.spaceImageFourUrl || "/assets/drive-space-private.jpg";
  const newsImageOneUrl = landingConfig.newsImageOneUrl || "/assets/drive-news-winewall.jpg";
  const newsImageTwoUrl = landingConfig.newsImageTwoUrl || "/assets/drive-news-table-close.jpg";
  const newsImageThreeUrl = landingConfig.newsImageThreeUrl || "/assets/drive-news-place-setting.jpg";
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
  const chatBranchLabel = displayBranchShortName || displayBranchName || "San Hô Đỏ";
  const chatTitle = `${chatBranchLabel} xin chào`;
  const chatSummary = `${displayBranchName} hỗ trợ menu, giá, đặt bàn nhanh và hướng dẫn Zalo.`;
  const chatSuggestions = useMemo(
    () => [
      `Menu ${displayBranchShortName || "hôm nay"}`,
      "Giá combo 4 người",
      `Zalo ${activeHotlineDisplay}`,
      `Đường đi tới ${displayBranchShortName || "nhà hàng"}`
    ],
    [activeHotlineDisplay, displayBranchShortName]
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
    setChatMessages([
      {
        role: "bot",
        text: `Xin chào từ ${displayBranchName}. Mình có thể hỗ trợ menu, giá, đặt bàn, đường đi và gợi ý combo phù hợp.`
      }
    ]);
  }, [displayBranchName]);

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

  const handleBranchSelect = (branchId) => {
    const nextBranch = branches.find((item) => item.id === branchId);
    if (!nextBranch) {
      return;
    }

    setSelectedBranchId(nextBranch.id);
    setSelectedVoucherCampaignId("");
    router.push(getBranchLandingPath(nextBranch));
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

    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      {
        role: "bot",
        text: buildChatReply(trimmed, displayBranchName, activeHotline, activeHotlineDisplay)
      }
    ]);
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
          <a className="brand" href="#top" aria-label={displayBranchName}>
            <span className="brand-mark" aria-hidden="true">
              <img src="/assets/logo-coral.png" alt="" />
            </span>
            <span className="brand-copy">
              <strong>{brandPrimaryLine}</strong>
              <span>{brandSecondaryLine || displayBranchShortName}</span>
            </span>
          </a>

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

          <nav className="site-nav" aria-label="Điều hướng chính">
            <ul id="nav-list">
              <li>
                <a href="#top" className="is-active">
                  Trang chủ
                </a>
              </li>
              <li>
                <a href="#about">Giới thiệu</a>
              </li>
              <li>
                <a href="#menu">Thực đơn</a>
              </li>
              <li>
                <a href="#reservation">Đặt bàn</a>
              </li>
              <li>
                <a href="#space">Không gian</a>
              </li>
              <li>
                <a href="#news">Tin tức</a>
              </li>
              <li>
                <a href="#contact">Liên hệ</a>
              </li>
            </ul>
          </nav>

          <a className="button button-primary header-cta" href="#reservation">
            Đặt bàn
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
                  {landingConfig.primaryCtaLabel || DEFAULT_LANDING_PAGE_CONFIG.primaryCtaLabel}
                </button>
                <a className="button button-secondary" href={activeZaloLink} target="_blank" rel="noreferrer">
                  Zalo {activeHotlineDisplay}
                </a>
              </div>
              <div className="hero-micro-trust reveal is-visible">
                <div className="hero-trust-card branch-trust-card">
                  <strong>Chi nhánh phục vụ</strong>
                  <span>{displayBranchName}</span>
                </div>
              </div>
              <div className="hero-scroll">
                <span>Scroll</span>
                <span className="hero-scroll-line" aria-hidden="true"></span>
              </div>
            </div>
          </div>
          <img className="hero-wave" src="/assets/wave-divider.svg" alt="" />
        </section>

        <section className="about section" id="about">
          <div className="container about-grid">
            <div className="about-copy reveal">
              <p className="section-kicker">Về chúng tôi</p>
              <h2>{landingConfig.aboutTitle || DEFAULT_LANDING_PAGE_CONFIG.aboutTitle}</h2>
              <p>{landingConfig.aboutParagraphOne || DEFAULT_LANDING_PAGE_CONFIG.aboutParagraphOne}</p>
              <p>{landingConfig.aboutParagraphTwo || DEFAULT_LANDING_PAGE_CONFIG.aboutParagraphTwo}</p>
              <a className="button button-primary" href="#space">
                Khám phá thêm
              </a>
            </div>

            <div className="about-card about-card-drive reveal">
              <img src={aboutImageUrl} alt={`Mặt tiền ${displayBranchName}`} />
              <div className="about-card-badge">
                <strong>{landingConfig.aboutBadgeTitle || DEFAULT_LANDING_PAGE_CONFIG.aboutBadgeTitle}</strong>
                <span>{landingConfig.aboutBadgeSubtitle || DEFAULT_LANDING_PAGE_CONFIG.aboutBadgeSubtitle}</span>
              </div>
            </div>
          </div>

          <div className="container feature-strip reveal">
            <article className="feature-item">
              <span className="feature-icon">✺</span>
              <div>
                <h3>{landingConfig.featureSeafoodTitle || DEFAULT_LANDING_PAGE_CONFIG.featureSeafoodTitle}</h3>
                <p>{landingConfig.featureSeafoodDescription || DEFAULT_LANDING_PAGE_CONFIG.featureSeafoodDescription}</p>
              </div>
            </article>
            <article className="feature-item">
              <span className="feature-icon">⌘</span>
              <div>
                <h3>{landingConfig.featureChefTitle || DEFAULT_LANDING_PAGE_CONFIG.featureChefTitle}</h3>
                <p>{landingConfig.featureChefDescription || DEFAULT_LANDING_PAGE_CONFIG.featureChefDescription}</p>
              </div>
            </article>
            <article className="feature-item">
              <span className="feature-icon">◌</span>
              <div>
                <h3>{landingConfig.featureSpaceTitle || DEFAULT_LANDING_PAGE_CONFIG.featureSpaceTitle}</h3>
                <p>{landingConfig.featureSpaceDescription || DEFAULT_LANDING_PAGE_CONFIG.featureSpaceDescription}</p>
              </div>
            </article>
            <article className="feature-item">
              <span className="feature-icon">♡</span>
              <div>
                <h3>{landingConfig.featureServiceTitle || DEFAULT_LANDING_PAGE_CONFIG.featureServiceTitle}</h3>
                <p>{landingConfig.featureServiceDescription || DEFAULT_LANDING_PAGE_CONFIG.featureServiceDescription}</p>
              </div>
            </article>
          </div>
        </section>

        <section className="reservation section" id="reservation">
          <div className="container reservation-grid">
            <div className="reservation-copy reveal">
              <p className="section-kicker">Đặt bàn nhanh</p>
              <h2>Chốt khách nhanh hơn với form đặt bàn và hotline rõ ràng</h2>
              <p>
                Thanh CTA cố định giúp khách gọi, đặt bàn hoặc nhắn Zalo chỉ với 1 chạm. Form này
                đã sẵn API nhận lead để đẩy tiếp sang CRM, Google Sheet và Zalo webhook.
              </p>
              <div className="contact-quick-cards">
                <a className="contact-quick-card" href={`tel:${activeHotline}`}>
                  <strong>Gọi ngay</strong>
                  <span>{activeHotlineDisplay}</span>
                </a>
                <a className="contact-quick-card" href={activeZaloLink} target="_blank" rel="noreferrer">
                  <strong>Zalo</strong>
                  <span>Nhắn tư vấn nhanh</span>
                </a>
              </div>
              {(branches || []).length > 1 ? (
                <label className="branch-selector">
                  <span>Chọn chi nhánh phục vụ</span>
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
                  <strong>Đang nhận lead tại:</strong> {selectedBranch?.name || "San Hô Đỏ Hồ Tràm"}
                </div>
              )}
            </div>

            <form className="reservation-form reveal" onSubmit={handleReservationSubmit}>
              {selectedOffer ? (
                <div className="selected-offer-banner">
                  <strong>Đang quan tâm:</strong> {selectedOffer}
                </div>
              ) : null}
              <label>
                <span>Tên</span>
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
                <span>SĐT</span>
                <input
                  type="tel"
                  value={reservationForm.phone}
                  onChange={(event) =>
                    setReservationForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder="Ví dụ: 0814 645 999"
                  required
                />
              </label>
              <div className="reservation-form-row">
                <label>
                  <span>Số khách</span>
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
                  <span>Ngày đến</span>
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
                <span>Khung giờ</span>
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
                <span>Mã tài xế / giới thiệu (nếu có)</span>
                <input
                  type="text"
                  value={reservationForm.referralCode || ""}
                  onChange={(event) =>
                    setReservationForm((prev) => ({ ...prev, referralCode: event.target.value }))
                  }
                  placeholder="Ví dụ: DRV-HOTRAM-01"
                />
              </label>
              <div className="form-note">
                <strong>Khung giờ nhận đặt bàn:</strong> 10:00 - 21:30 mỗi ngày.
                {reservationPreview ? (
                  <span> Lịch hẹn đang chọn: {reservationPreview}.</span>
                ) : null}
                {selectedBranch ? <span> Chi nhánh tiếp nhận: {selectedBranch.name}.</span> : null}
              </div>
              <label>
                <span>Ghi chú thêm</span>
                <textarea
                  rows={3}
                  value={reservationForm.notes || ""}
                  onChange={(event) =>
                    setReservationForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Ví dụ: cần ghế em bé, bàn yên tĩnh, có sinh nhật..."
                />
              </label>
              <button className="button button-primary" type="submit" disabled={reservationLoading}>
                {reservationLoading ? "Đang gửi..." : "Gửi yêu cầu đặt bàn"}
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
              <p className="section-kicker">Thực đơn</p>
              <h2>Menu thông minh với giá, mô tả và combo gợi ý sẵn</h2>
              <p>
                Mỗi món đều có giá, mô tả ngắn và nút đặt ngay. Khi khách bấm chọn món hoặc combo,
                hệ thống sẽ bật gợi ý upsell để tăng giá trị đơn hàng.
              </p>
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
                  aria-label="Món trước"
                >
                  &#8592;
                </button>
                <button
                  className="slider-button"
                  type="button"
                  data-direction="next"
                  aria-label="Món tiếp"
                >
                  &#8594;
                </button>
              </div>
            </div>

            <div className="menu-slider reveal">
              <div className="menu-track">
                {featuredDishes.map((dish, index) => (
                  <article className={`dish-card${index === 0 ? " is-current" : ""}`} key={dish.name}>
                    <img src={dish.image} alt={dish.name} />
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
                          Chọn món
                        </button>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => focusReservation(dish.name)}
                        >
                          Đặt luôn
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="slider-dots" aria-label="Chọn món">
                {featuredDishes.map((dish, index) => (
                  <button
                    key={dish.name}
                    className={`dot${index === 0 ? " is-active" : ""}`}
                    type="button"
                    data-index={index}
                    aria-label={`Món ${index + 1}`}
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
                      Chọn combo
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => focusReservation(combo.title)}
                    >
                      Đặt bàn theo combo
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
              <p className="section-kicker">
                {landingConfig.spaceKicker || DEFAULT_LANDING_PAGE_CONFIG.spaceKicker}
              </p>
              <h2>{landingConfig.spaceTitle || DEFAULT_LANDING_PAGE_CONFIG.spaceTitle}</h2>
            </div>
            <div className="space-grid">
              <article className="space-card reveal">
                <img
                  src={spaceImageOneUrl}
                  alt="Khu vực bàn tiệc lớn với tủ rượu phía sau"
                />
              </article>
              <article className="space-card reveal">
                <img
                  src={spaceImageTwoUrl}
                  alt="Khu vực bàn tròn sang trọng trong nhà hàng"
                />
              </article>
              <article className="space-card reveal">
                <img src={spaceImageThreeUrl} alt="Sảnh đón khách và khu trưng bày" />
              </article>
              <article className="space-card reveal">
                <img src={spaceImageFourUrl} alt="Phòng riêng ấm cúng cho nhóm nhỏ" />
              </article>
            </div>
            <div className="section-action reveal">
              <a className="button button-secondary" href="#contact">
                {landingConfig.spaceActionLabel || DEFAULT_LANDING_PAGE_CONFIG.spaceActionLabel}
              </a>
            </div>
          </div>
        </section>

        <section className="order-online section" id="order-online">
          <div className="container order-online-grid">
            <div className="order-online-copy reveal">
              <p className="section-kicker">Đặt món nhanh</p>
              <h2>Chọn món trước, admin nhận order trực tiếp trong dashboard</h2>
              <p>
                Khách có thể chọn trước các món nổi bật và gửi yêu cầu đặt món. Dữ liệu sẽ đi vào
                Supabase thật và xuất hiện trong tab `Orders` của admin để đội ngũ xử lý.
              </p>
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
                <div className="form-note">
                  Chưa có món nổi bật trong nhóm này. Bạn có thể chọn nhóm khác hoặc gọi hotline để
                  được tư vấn nhanh.
                </div>
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
                  <strong>Tạm tính</strong>
                  <span>{orderForm.items.length} món đã chọn</span>
                </div>
                <strong>{formatMoney(orderSubtotal)}</strong>
              </div>

              <label>
                <span>Tên khách</span>
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
                <span>SĐT</span>
                <input
                  type="tel"
                  value={orderForm.customerPhone}
                  onChange={(event) =>
                    setOrderForm((prev) => ({ ...prev, customerPhone: event.target.value }))
                  }
                  placeholder="Ví dụ: 0814 645 999"
                  required
                />
              </label>
              <label>
                <span>Mã tài xế / giới thiệu (nếu có)</span>
                <input
                  type="text"
                  value={orderForm.referralCode || ""}
                  onChange={(event) =>
                    setOrderForm((prev) => ({ ...prev, referralCode: event.target.value }))
                  }
                  placeholder="Ví dụ: DRV-HOTRAM-01"
                />
              </label>
              <label>
                <span>Ghi chú thêm</span>
                <textarea
                  rows={4}
                  value={orderForm.notes}
                  onChange={(event) =>
                    setOrderForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Ví dụ: giao trước món khai vị, không cay..."
                />
              </label>
              <button
                className="button button-primary"
                type="submit"
                disabled={orderLoading || !orderForm.items.length}
              >
                {orderLoading ? "Đang gửi..." : "Gửi yêu cầu đặt món"}
              </button>
              {orderError ? <p className="form-status is-error">{orderError}</p> : null}
              {orderStatus ? <div className="form-success-card">{orderStatus}</div> : null}
            </form>
          </div>
        </section>

        <section className="voucher section" id="voucher">
          <div className="container voucher-grid">
            <div className="voucher-copy reveal">
              <p className="section-kicker">Voucher</p>
              <h2>Nhập SĐT để nhận ưu đãi và thu data khách hàng</h2>
              <p>
                Form này phù hợp để kết hợp cùng WiFi Ads GOECO, popup khuyến mãi hoặc chiến dịch
                remarketing về sau.
              </p>
              {selectedBranch ? (
                <div className="branch-inline-note">
                  <strong>Ưu đãi đang áp dụng tại:</strong> {selectedBranch.name}
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
                  {formatVoucherBenefit(activeVoucherCampaign)} • hiệu lực trong{" "}
                  {activeVoucherCampaign?.validDays || VOUCHER_PRESET.validDays} ngày kể từ lúc nhận
                  mã.
                </span>
              </div>
            </div>
            <form className="voucher-form reveal" onSubmit={handleVoucherSubmit}>
              {voucherCampaigns.length > 1 ? (
                <label>
                  <span>Chiến dịch ưu đãi</span>
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
                <span>Số điện thoại</span>
                <input
                  type="tel"
                  value={voucherPhone}
                  onChange={(event) => setVoucherPhone(event.target.value)}
                  placeholder="Nhập SĐT để nhận ưu đãi"
                  required
                />
              </label>
              <button className="button button-primary" type="submit" disabled={voucherLoading}>
                {voucherLoading ? "Đang xử lý..." : "Nhận ưu đãi ngay"}
              </button>
              {voucherError ? <p className="form-status is-error">{voucherError}</p> : null}
              {voucherStatus ? <p className="form-status">{voucherStatus}</p> : null}
              {voucherResult ? (
                <div className="voucher-result-card">
                  <span>Mã ưu đãi của bạn</span>
                  <strong>{voucherResult.voucherCode}</strong>
                  <p>
                    {voucherResult.voucherTitle} -{" "}
                    {voucherResult.voucherDiscountType === "percent"
                      ? `giảm ${voucherResult.voucherDiscountValue}%`
                      : `giảm ${formatMoney(voucherResult.voucherDiscountValue)}`}
                  </p>
                  <small>
                    Hạn dùng:{" "}
                    {new Intl.DateTimeFormat("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    }).format(new Date(voucherResult.expiresAt))}
                  </small>
                  {activeVoucherCampaign?.minOrderValue ? (
                    <small>
                      Áp dụng cho hóa đơn từ {formatMoney(activeVoucherCampaign.minOrderValue)}.
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
              <p className="section-kicker">
                {landingConfig.newsKicker || DEFAULT_LANDING_PAGE_CONFIG.newsKicker}
              </p>
              <h2>{landingConfig.newsTitle || DEFAULT_LANDING_PAGE_CONFIG.newsTitle}</h2>
            </div>

            <div className="news-grid">
              <article className="news-card news-card-drive reveal">
                <img
                  src={newsImageOneUrl}
                  alt="Tủ rượu và khu vực bàn tiệc sang trọng"
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
                Xem tất cả tin tức
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <img className="footer-coral" src="/assets/coral-pattern.png" alt="" />
        <div className="container footer-grid">
          <div>
            <a className="brand footer-brand" href="#top">
              <span className="brand-mark" aria-hidden="true">
                <img src="/assets/logo-coral.png" alt="" />
              </span>
              <span className="brand-copy">
                <strong>{brandPrimaryLine}</strong>
                <span>{brandSecondaryLine || displayBranchShortName}</span>
              </span>
            </a>
            <p className="footer-text">
              {landingConfig.footerDescription || DEFAULT_LANDING_PAGE_CONFIG.footerDescription}
            </p>
          </div>

          <div>
            <h3>Liên kết nhanh</h3>
            <ul className="footer-links">
              <li>
                <a href="#top">Trang chủ</a>
              </li>
              <li>
                <a href="#about">Giới thiệu</a>
              </li>
              <li>
                <a href="#menu">Thực đơn</a>
              </li>
              <li>
                <a href="#reservation">Đặt bàn</a>
              </li>
              <li>
                <a href="#space">Không gian</a>
              </li>
              <li>
                <a href="#news">Tin tức</a>
              </li>
            </ul>
          </div>

          <div>
            <h3>Thông tin liên hệ</h3>
            <ul className="footer-meta">
              <li>{selectedBranch?.address || "Đường ven biển, Ấp Hồ Tràm, Xã Phước Thuận, H. Xuyên Mộc, Bà Rịa - Vũng Tàu"}</li>
              <li>{activeHotlineDisplay}</li>
              <li>{secondaryHotlineDisplay}</li>
              <li>info@sanhodohotram.vn</li>
              <li>10:00 - 22:00 (Thứ 2 - Chủ nhật)</li>
            </ul>
          </div>

          <div>
            <h3>Ưu đãi nhanh</h3>
            <form className="subscribe-form" onSubmit={handleVoucherSubmit}>
              <input
                type="tel"
                placeholder="Nhập SĐT để nhận ưu đãi"
                aria-label="Số điện thoại"
                value={voucherPhone}
                onChange={(event) => setVoucherPhone(event.target.value)}
              />
              <button className="button button-primary" type="submit" disabled={voucherLoading}>
                {voucherLoading ? "Đang gửi..." : "Nhận voucher"}
              </button>
            </form>
          </div>
        </div>
        <div className="footer-bar">
          <div className="container footer-bar-inner">
            <span>&copy; 2024 Nhà hàng {displayBranchName}. All rights reserved.</span>
            <span>Thiết kế bởi Web Designer</span>
          </div>
        </div>
      </footer>

      <div className="sticky-cta-bar">
        <button className="sticky-cta-item sticky-cta-book" type="button" onClick={() => focusReservation()}>
          Đặt bàn ngay
        </button>
        <a className="sticky-cta-item" href={activeZaloLink} target="_blank" rel="noreferrer">
          Zalo
        </a>
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
          aria-label={chatOpen ? "Đóng trò chuyện" : `Mở trò chuyện với ${displayBranchName}`}
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
          <div className="chat-messages">
            {chatMessages.map((message, index) => (
              <div className={`chat-bubble chat-${message.role}`} key={`${message.role}-${index}`}>
                {message.text}
              </div>
            ))}
          </div>
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
              placeholder="Hỏi menu, giá, đường đi..."
            />
            <button type="submit">Gửi</button>
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
                Đặt bàn với ưu đãi này
              </button>
              <button className="button button-secondary" type="button" onClick={() => setUpsellModal(null)}>
                Xem thêm combo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
