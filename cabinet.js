// === Nova Studio — Личный кабинет (надёжная версия) ===
window.NovaCabinet = (function () {
  var SESSION_KEY = "nova_session";
  var THEME_KEY   = "nova-theme";

  function getSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      return s && s.name ? s : null;
    } catch (e) { return null; }
  }

  function closeMenu() {
    var menu = document.getElementById("profileMenu");
    if (!menu) return;
    menu.classList.remove("is-open");
    var trigger = menu.querySelector(".profile-trigger");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }

  // ===== Открыть / закрыть меню профиля =====
  function toggleMenu(event) {
    if (event && event.stopPropagation) event.stopPropagation();
    var menu = document.getElementById("profileMenu");
    if (!menu) return;
    var trigger = menu.querySelector(".profile-trigger");
    var isOpen = menu.classList.toggle("is-open");
    if (trigger) trigger.setAttribute("aria-expanded", String(isOpen));
  }

  // ===== Переключить тему =====
  function toggleTheme(event) {
    if (event && event.stopPropagation) event.stopPropagation();
    var html = document.documentElement;
    var current = html.getAttribute("data-theme") || "dark";
    var next = (current === "dark") ? "light" : "dark";
    html.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, next); } catch(e) {}
  }

  // ===== Настройки аккаунта =====
  function goSettings(event) {
    if (event && event.stopPropagation) event.stopPropagation();
    closeMenu();
    var target = document.getElementById("account");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      alert("Настройки аккаунта скоро появятся.");
    }
  }

  // ===== На главную =====
  function goHome(event) {
    if (event && event.stopPropagation) event.stopPropagation();
    closeMenu();
    window.location.href = "index.html";
  }

  // ===== Выйти =====
  function logout(event) {
    if (event && event.stopPropagation) event.stopPropagation();
    closeMenu();
    try { sessionStorage.removeItem(SESSION_KEY); } catch(e) {}
    window.location.href = "login.html";
  }

  // ===== Клик мимо = закрыть меню =====
  document.addEventListener("click", function () {
    closeMenu();
  }, true); // capture phase — сработает раньше всех остальных

  // ===== Применить тему =====
  try {
    var savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
  } catch(e) {}

  // ===== Отрендерить профиль =====
  function renderProfile() {
    var user = getSession();
    if (!user) return;
    var nameEl   = document.getElementById("profileName");
    var avatarEl = document.getElementById("profileAvatar");
    var welcomeEl = document.getElementById("welcomeName");
    var name = user.name || "Пользователь";
    if (nameEl)   nameEl.textContent   = name;
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    if (welcomeEl) welcomeEl.textContent = name;
  }

  // ===== Scroll spy для навигации =====
  function initScrollSpy() {
    var links = document.querySelectorAll(".cabinet-nav-link");
    if (!links.length) return;
    var sections = [];
    links.forEach(function (l) {
      var id = l.getAttribute("href") || "";
      if (id.charAt(0) !== "#") return;
      var s = document.getElementById(id.slice(1));
      if (s) sections.push({ link: l, section: s });
    });
    if (!sections.length) return;

    function setActive() {
      var current = sections[0];
      for (var i = 0; i < sections.length; i++) {
        var rect = sections[i].section.getBoundingClientRect();
        if (rect.top <= 140) current = sections[i];
      }
      links.forEach(function (l) { l.classList.remove("is-active"); });
      current.link.classList.add("is-active");
    }
    window.addEventListener("scroll", setActive, { passive: true });
    setActive();
  }

  // ===== Анимации появления =====
  function initAnimations() {
    var targets = document.querySelectorAll(
      ".project-card, .service-card, .stat, .space-item, .space-card, .contacts-card"
    );
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    targets.forEach(function (el) { io.observe(el); });
  }

  // ===== Проверка авторизации (TEMP: always allow for browser preview) =====
  function requireAuth() {
    return true;
  }

  // ===== Старт =====
  function boot() {
    if (!requireAuth()) return;
    renderProfile();
    initScrollSpy();
    initAnimations();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  return {
    toggleMenu:   toggleMenu,
    toggleTheme:  toggleTheme,
    goSettings:   goSettings,
    goHome:       goHome,
    logout:       logout
  };
})();
