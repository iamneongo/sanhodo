"use client";

import { useEffect, useMemo, useState } from "react";

const hotline = "0901234567";
const hotlineDisplay = "0901 234 567";
const zaloLink = `https://zalo.me/${hotline}`;

const featuredDishes = [
  {
    name: "Cua huỳnh đế",
    price: "1.290.000đ",
    description: "Thịt chắc, ngọt đậm vị biển, phù hợp cho bàn tiệc cần món signature.",
    image: "/assets/dish-king-crab.png",
    offer: "Thêm sò điệp nướng phô mai, giảm ngay 10% món khai vị."
  },
  {
    name: "Tôm hùm nướng",
    price: "990.000đ",
    description: "Nướng bơ tỏi thơm đậm, thích hợp cho cặp đôi hoặc bàn tiếp khách.",
    image: "/assets/dish-lobster.png",
    offer: "Combo tôm hùm + sashimi tiết kiệm hơn 180.000đ."
  },
  {
    name: "Sashimi tổng hợp",
    price: "680.000đ",
    description: "Tươi, mát và trình bày đẹp mắt cho bàn ăn sang trọng.",
    image: "/assets/dish-sashimi.png",
    offer: "Thêm set rượu vang nhẹ giảm 10% cho bàn 2 người."
  },
  {
    name: "Ốc hương hấp sả",
    price: "320.000đ",
    description: "Món khai vị dễ gọi thêm, hợp cho nhóm gia đình và bạn bè.",
    image: "/assets/dish-snails.png",
    offer: "Nâng cấp thành combo 4 người sẽ tối ưu hơn 12% chi phí."
  }
];

const combos = [
  {
    title: "Combo 2 người",
    price: "1.590.000đ",
    description: "1 tôm hùm nướng, 1 sashimi tổng hợp, 1 món rau và 2 nước.",
    badge: "Tiết kiệm 8%"
  },
  {
    title: "Combo 4 người",
    price: "2.990.000đ",
    description: "Cua huỳnh đế, ốc hương hấp sả, sashimi, cơm chiên hải sản, nước.",
    badge: "Bán chạy"
  },
  {
    title: "Combo tiệc",
    price: "6.890.000đ",
    description: "Set dành cho 8-10 khách, tối ưu cho sinh nhật, tiếp khách, họp nhóm.",
    badge: "Ưu tiên upsell"
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
      "Bạn có thể bấm Đặt bàn nhanh ở cuối màn hình hoặc điền form đặt bàn. Chỉ cần tên, số điện thoại, số khách và thời gian là xong."
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

export default function Page() {
  const [reservationForm, setReservationForm] = useState({
    name: "",
    phone: "",
    guests: "2",
    datetime: ""
  });
  const [voucherPhone, setVoucherPhone] = useState("");
  const [reservationStatus, setReservationStatus] = useState("");
  const [voucherStatus, setVoucherStatus] = useState("");
  const [reservationLoading, setReservationLoading] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "bot",
      text: "Xin chào, mình là GOECO Chatbot demo. Mình có thể tư vấn menu, giá, đặt bàn, đường đi và gợi ý combo tiết kiệm."
    }
  ]);
  const [upsellModal, setUpsellModal] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState("");

  const chatSuggestions = useMemo(
    () => ["Menu hôm nay", "Giá combo 4 người", "Cách đặt bàn nhanh", "Đường đi tới nhà hàng"],
    []
  );

  useEffect(() => {
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
  }, []);

  const focusReservation = (offerName = "") => {
    const target = document.getElementById("reservation");
    if (offerName) {
      setSelectedOffer(offerName);
    }
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleReservationSubmit = async (event) => {
    event.preventDefault();
    setReservationLoading(true);
    setReservationStatus("");

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reservationForm,
          selectedOffer
        })
      });

      if (!response.ok) {
        throw new Error("submit_failed");
      }

      setReservationStatus(
        "Đặt bàn đã được ghi nhận. Hệ thống đã lưu lead và sẵn sàng đẩy sang CRM / Google Sheet / Zalo webhook khi bạn cấu hình."
      );
      setReservationForm({ name: "", phone: "", guests: "2", datetime: "" });
      setSelectedOffer("");
    } catch {
      setReservationStatus("Chưa gửi được yêu cầu. Vui lòng thử lại hoặc gọi ngay hotline.");
    } finally {
      setReservationLoading(false);
    }
  };

  const handleVoucherSubmit = async (event) => {
    event.preventDefault();
    setVoucherLoading(true);
    setVoucherStatus("");

    try {
      const response = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: voucherPhone })
      });

      if (!response.ok) {
        throw new Error("voucher_failed");
      }

      setVoucherStatus(
        "Đã nhận số điện thoại. Lead voucher đã được lưu để kết hợp WiFi Ads GOECO hoặc webhook chăm sóc khách."
      );
      setVoucherPhone("");
    } catch {
      setVoucherStatus("Chưa nhận được ưu đãi. Vui lòng thử lại sau.");
    } finally {
      setVoucherLoading(false);
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
      { role: "bot", text: getChatReply(trimmed) }
    ]);
    setChatInput("");
  };

  const openUpsell = (title, offer) => {
    setUpsellModal({ title, offer });
  };

  return (
    <>
      <header className="site-header" id="top">
        <div className="container header-inner">
          <a className="brand" href="#top" aria-label="San Ho Do Ho Tram">
            <span className="brand-mark" aria-hidden="true">
              <img src="/assets/logo-coral.png" alt="" />
            </span>
            <span className="brand-copy">
              <strong>San Ho Do</strong>
              <span>Ho Tram</span>
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
          <div className="hero-scene" aria-hidden="true"></div>
          <div className="hero-overlay"></div>
          <img className="hero-coral hero-coral-left" src="/assets/coral-pattern.png" alt="" />
          <div className="container hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">Nhà hàng</p>
              <h1>
                San Hô Đỏ
                <br />
                Hồ Tràm
              </h1>
              <p className="hero-text">
                Không gian ẩm thực sang trọng - Dấu ấn riêng tinh tế
                <br />
                Trải nghiệm đáng nhớ trong từng bữa tiệc sum vầy
              </p>
              <div className="hero-actions">
                <button className="button button-primary" type="button" onClick={() => focusReservation()}>
                  Đặt bàn ngay
                </button>
                <a className="button button-secondary" href={`tel:${hotline}`}>
                  Gọi {hotlineDisplay}
                </a>
              </div>
              <div className="hero-micro-trust reveal is-visible">
                <div className="hero-trust-card">
                  <strong>Đặt bàn nhanh</strong>
                  <span>Form 1 phút, tự động lưu lead và sẵn sàng đẩy CRM / Sheet / Zalo.</span>
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
              <h2>Không gian chỉn chu cho những buổi gặp gỡ đáng nhớ</h2>
              <p>
                San Hô Đỏ mang đến trải nghiệm ẩm thực trọn vẹn với mặt tiền nổi bật, sảnh đón
                tiếp sang trọng và không gian bài trí chỉn chu cho những bữa ăn gia đình, tiếp
                khách hay hội họp.
              </p>
              <p>
                Từ khu vực bàn tiệc rộng rãi đến phòng riêng ấm cúng, từng góc nhỏ đều được chăm
                chút để tạo cảm giác thoải mái, lịch sự và dễ lưu lại ấn tượng tốt với thực khách.
              </p>
              <a className="button button-primary" href="#space">
                Khám phá thêm
              </a>
            </div>

            <div className="about-card about-card-drive reveal">
              <img src="/assets/drive-about-facade.jpg" alt="Mặt tiền nhà hàng San Hô Đỏ" />
              <div className="about-card-badge">
                <strong>Mặt tiền</strong>
                <span>ấn tượng và sang trọng</span>
              </div>
            </div>
          </div>

          <div className="container feature-strip reveal">
            <article className="feature-item">
              <span className="feature-icon">✺</span>
              <div>
                <h3>Hải sản tươi sống</h3>
                <p>Nguồn hải sản tươi sống mỗi ngày từ biển Hồ Tràm.</p>
              </div>
            </article>
            <article className="feature-item">
              <span className="feature-icon">⌘</span>
              <div>
                <h3>Đầu bếp chuyên nghiệp</h3>
                <p>Đội ngũ đầu bếp giàu kinh nghiệm, chế biến tinh tế.</p>
              </div>
            </article>
            <article className="feature-item">
              <span className="feature-icon">◌</span>
              <div>
                <h3>Không gian tuyệt đẹp</h3>
                <p>Không gian sang trọng, nhiều khu vực phù hợp tiếp khách và gia đình.</p>
              </div>
            </article>
            <article className="feature-item">
              <span className="feature-icon">♡</span>
              <div>
                <h3>Phục vụ tận tâm</h3>
                <p>Đội ngũ nhân viên nhiệt tình, chu đáo, chuyên nghiệp.</p>
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
                <a className="contact-quick-card" href={`tel:${hotline}`}>
                  <strong>Gọi ngay</strong>
                  <span>{hotlineDisplay}</span>
                </a>
                <a className="contact-quick-card" href={zaloLink} target="_blank" rel="noreferrer">
                  <strong>Zalo</strong>
                  <span>Nhắn tư vấn nhanh</span>
                </a>
              </div>
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
                  <span>Thời gian</span>
                  <input
                    type="datetime-local"
                    value={reservationForm.datetime}
                    onChange={(event) =>
                      setReservationForm((prev) => ({ ...prev, datetime: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>
              <button className="button button-primary" type="submit" disabled={reservationLoading}>
                {reservationLoading ? "Đang gửi..." : "Gửi yêu cầu đặt bàn"}
              </button>
              {reservationStatus ? <p className="form-status">{reservationStatus}</p> : null}
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
                      <div className="dish-meta">
                        <h3>{dish.name}</h3>
                        <span className="dish-price">{dish.price}</span>
                      </div>
                      <p>{dish.description}</p>
                      <div className="dish-actions">
                        <button
                          className="button button-primary"
                          type="button"
                          onClick={() => openUpsell(dish.name, dish.offer)}
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
                <button className="dot is-active" type="button" data-index="0" aria-label="Món 1"></button>
                <button className="dot" type="button" data-index="1" aria-label="Món 2"></button>
                <button className="dot" type="button" data-index="2" aria-label="Món 3"></button>
                <button className="dot" type="button" data-index="3" aria-label="Món 4"></button>
              </div>
            </div>
          </div>

          <div className="container combo-section reveal">
            <div className="section-heading align-left">
              <p className="section-kicker">Combo gợi ý</p>
              <h2>Tối ưu lựa chọn theo số người</h2>
            </div>
            <div className="combo-grid">
              {combos.map((combo) => (
                <article className="combo-card" key={combo.title}>
                  <span className="combo-badge">{combo.badge}</span>
                  <h3>{combo.title}</h3>
                  <strong className="combo-price">{combo.price}</strong>
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
              <p className="section-kicker">Không gian</p>
              <h2>Đa dạng khu vực, linh hoạt cho mọi nhu cầu dùng bữa</h2>
            </div>
            <div className="space-grid">
              <article className="space-card reveal">
                <img
                  src="/assets/drive-space-dining-1.jpg"
                  alt="Khu vực bàn tiệc lớn với tủ rượu phía sau"
                />
              </article>
              <article className="space-card reveal">
                <img
                  src="/assets/drive-space-dining-2.jpg"
                  alt="Khu vực bàn tròn sang trọng trong nhà hàng"
                />
              </article>
              <article className="space-card reveal">
                <img src="/assets/drive-space-lobby.jpg" alt="Sảnh đón khách và khu trưng bày" />
              </article>
              <article className="space-card reveal">
                <img src="/assets/drive-space-private.jpg" alt="Phòng riêng ấm cúng cho nhóm nhỏ" />
              </article>
            </div>
            <div className="section-action reveal">
              <a className="button button-secondary" href="#contact">
                Xem thêm hình ảnh
              </a>
            </div>
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
            </div>
            <form className="voucher-form reveal" onSubmit={handleVoucherSubmit}>
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
              {voucherStatus ? <p className="form-status">{voucherStatus}</p> : null}
            </form>
          </div>
        </section>

        <section className="news section" id="news">
          <div className="container">
            <div className="section-heading align-left reveal">
              <p className="section-kicker">Tin tức &amp; Ưu đãi</p>
              <h2>Những góc ấn tượng từ không gian thực tế của nhà hàng</h2>
            </div>

            <div className="news-grid">
              <article className="news-card news-card-drive reveal">
                <img
                  src="/assets/drive-news-winewall.jpg"
                  alt="Tủ rượu và khu vực bàn tiệc sang trọng"
                />
                <div className="news-body">
                  <span className="news-tag">Không gian</span>
                  <h3>Tủ rượu lớn tạo điểm nhấn cho khu vực dùng bữa</h3>
                  <p>
                    Khu vực trung tâm được bố trí hệ tủ rượu sang trọng, phù hợp cho những buổi gặp
                    gỡ cần sự chỉn chu.
                  </p>
                  <span className="news-date">Bộ ảnh thực tế</span>
                </div>
              </article>
              <article className="news-card news-card-drive reveal">
                <img
                  src="/assets/drive-news-table-close.jpg"
                  alt="Cận cảnh bàn ăn được chuẩn bị sẵn"
                />
                <div className="news-body">
                  <span className="news-tag news-tag-alt">Chi tiết</span>
                  <h3>Bàn tiệc được chuẩn bị gọn gàng và đồng bộ</h3>
                  <p>
                    Từ ly tách, khăn bàn đến cách đặt món đều được chuẩn bị kỹ để nâng trải nghiệm
                    của thực khách.
                  </p>
                  <span className="news-date">Bộ ảnh thực tế</span>
                </div>
              </article>
              <article className="news-card news-card-drive reveal">
                <img
                  src="/assets/drive-news-place-setting.jpg"
                  alt="Không gian bàn riêng với cách bày trí tinh tế"
                />
                <div className="news-body">
                  <span className="news-tag">Riêng tư</span>
                  <h3>Không gian riêng phù hợp cho nhóm nhỏ và tiếp khách</h3>
                  <p>
                    Một lựa chọn phù hợp cho bữa tối thân mật, gặp gỡ đối tác hoặc những buổi sum
                    họp cần sự riêng tư.
                  </p>
                  <span className="news-date">Bộ ảnh thực tế</span>
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
                <strong>San Ho Do</strong>
                <span>Ho Tram</span>
              </span>
            </a>
            <p className="footer-text">
              Bộ ảnh thực tế cho thấy một không gian chỉn chu, sang trọng và phù hợp cho nhiều nhu
              cầu dùng bữa, từ họp mặt gia đình đến tiếp khách và tổ chức tiệc nhỏ.
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
              <li>Đường ven biển, Ấp Hồ Tràm, Xã Phước Thuận, H. Xuyên Mộc, Bà Rịa - Vũng Tàu</li>
              <li>{hotlineDisplay}</li>
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
            <span>&copy; 2024 Nhà hàng San Hô Đỏ Hồ Tràm. All rights reserved.</span>
            <span>Thiết kế bởi Web Designer</span>
          </div>
        </div>
      </footer>

      <div className="sticky-cta-bar">
        <button className="sticky-cta-item sticky-cta-book" type="button" onClick={() => focusReservation()}>
          Đặt bàn ngay
        </button>
        <a className="sticky-cta-item" href={`tel:${hotline}`}>
          Gọi ngay
        </a>
        <a className="sticky-cta-item" href={zaloLink} target="_blank" rel="noreferrer">
          Zalo
        </a>
      </div>

      <button className="chat-toggle" type="button" onClick={() => setChatOpen((prev) => !prev)}>
        {chatOpen ? "Đóng chat" : "GOECO Chatbot"}
      </button>

      {chatOpen ? (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <div>
              <strong>GOECO Chatbot</strong>
              <span>Tư vấn menu, giá, đặt bàn, đường đi, combo</span>
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
