const header = document.querySelector(".site-header");
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const subscribeForm = document.querySelector(".subscribe-form");

const onScroll = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 18);
};

window.addEventListener("scroll", onScroll);
onScroll();

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("is-open", !expanded);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    });
  });
}

const sections = [...document.querySelectorAll("main section[id], header[id], footer[id]")];

const updateActiveLink = () => {
  let current = sections[0];

  sections.forEach((section) => {
    if (window.scrollY + 140 >= section.offsetTop) {
      current = section;
    }
  });

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${current.id}`;
    link.classList.toggle("is-active", isActive);
  });
};

window.addEventListener("scroll", updateActiveLink);
updateActiveLink();

const sliderTrack = document.querySelector(".menu-track");
const cards = [...document.querySelectorAll(".dish-card")];
const dots = [...document.querySelectorAll(".dot")];
const controls = [...document.querySelectorAll(".slider-button")];

let currentIndex = 0;

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

controls.forEach((control) => {
  control.addEventListener("click", () => {
    const perView = window.innerWidth <= 720 ? 1 : 2;
    const maxIndex = Math.max(0, cards.length - perView);
    currentIndex += control.dataset.direction === "next" ? 1 : -1;

    if (currentIndex > maxIndex) {
      currentIndex = 0;
    }

    if (currentIndex < 0) {
      currentIndex = maxIndex;
    }

    renderSlider();
  });
});

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    currentIndex = Number(dot.dataset.index);
    renderSlider();
  });
});

window.addEventListener("resize", renderSlider);
renderSlider();

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

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

if (subscribeForm) {
  subscribeForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}
