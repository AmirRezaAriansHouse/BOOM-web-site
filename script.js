document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // ۰. مدیریت تغییر تم (روشن/تیره)
  // ==========================================
  (function setupThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      const isLight = document.documentElement.classList.toggle('light-theme');
      try {
        localStorage.setItem('boom-theme', isLight ? 'light' : 'dark');
      } catch (e) {}
    });
  })();

  // ==========================================
  // ۱. انیمیشن ورودی بخش هیرو (Hero Section)
  // ==========================================
  const heroSelectors = [
    '.hero-brand-custom-header',
    '.hero-title',
    '.hero-lead',
    '.hero-actions',
    '.hero-badges'
  ];

  heroSelectors.forEach((selector, index) => {
    const element = document.querySelector(selector);
    if (element) {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = `all 0.6s ease ${index * 0.15}s`;
      
      requestAnimationFrame(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      });
    }
  });

  // ==========================================
  // ۲. مدیریت اسلایدرها (سازگار با RTL و لمس)
  // ==========================================
  function setupSliderNav(containerSelector, prevBtnSelector, nextBtnSelector, scrollAmount = 300) {
    const container = document.querySelector(containerSelector);
    const prevBtn = document.querySelector(prevBtnSelector);
    const nextBtn = document.querySelector(nextBtnSelector);

    if (!container) return;

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        e.currentTarget.blur();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        e.currentTarget.blur();
      });
    }
  }

  setupSliderNav('.gallery-slider-container', '.gallery-prev', '.gallery-next', 300);

  // ==========================================
  // ۳. مدیریت منوی موبایل و لایه تاریک (Backdrop Overlay)
  // ==========================================
  const mobileToggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.boom-navigation');
  const navLinks = document.querySelectorAll('.boom-navigation a');

  // ساخت خودکار لایه تاریک پس‌زمینه در صورت عدم وجود
  let overlay = document.querySelector('.mobile-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);
  }

  function openMenu() {
    mobileToggle?.classList.add('open');
    nav?.classList.add('active');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden'; // قفل اسکرول صفحه هنگام باز بودن منو
  }

  function closeMenu() {
    mobileToggle?.classList.remove('open');
    nav?.classList.remove('active');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  mobileToggle?.addEventListener('click', () => {
    if (nav?.classList.contains('active')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay?.addEventListener('click', closeMenu);
  navLinks.forEach(link => link.addEventListener('click', closeMenu));

  // ==========================================
  // ۴. مدیریت لایت‌باکس تصاویر (Lightbox Modal) با قابلیت قبلی/بعدی برای مدارک
  // ==========================================
  const certCards = Array.from(document.querySelectorAll('.cert-card[data-cert-index]'));
  const certData = certCards.map(card => {
    const img = card.querySelector('img');
    return { src: img?.getAttribute('src') || '', alt: img?.getAttribute('alt') || '' };
  });

  const modal = document.getElementById('imageLightbox');
  const modalImg = document.getElementById('lightboxImg');
  const modalCaption = document.getElementById('lightboxCaption');
  const modalCounter = document.getElementById('lightboxCounter');
  const closeBtn = modal?.querySelector('.lightbox-close');
  const prevBtn = modal?.querySelector('.lightbox-prev');
  const nextBtn = modal?.querySelector('.lightbox-next');

  let currentCertIndex = -1;

  function renderModal(index) {
    const item = certData[index];
    if (!modal || !modalImg || !item) return;
    modalImg.src = item.src;
    modalImg.alt = item.alt;
    if (modalCaption) modalCaption.textContent = item.alt;
    if (modalCounter) modalCounter.textContent = `${toPersianDigits(index + 1)} از ${toPersianDigits(certData.length)}`;
  }

  function toPersianDigits(num) {
    const map = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(num).replace(/\d/g, d => map[d]);
  }

  function openModal(src, alt) {
    if (!modal || !modalImg) return;
    modalImg.src = src;
    modalImg.alt = alt || '';
    if (modalCaption) modalCaption.textContent = alt || '';
    if (modalCounter) modalCounter.textContent = '';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function openCertModal(index) {
    currentCertIndex = index;
    const hasNav = certData.length > 1;
    modal?.classList.toggle('has-nav', hasNav);
    renderModal(index);
    modal?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function showRelativeCert(delta) {
    if (currentCertIndex < 0 || certData.length === 0) return;
    currentCertIndex = (currentCertIndex + delta + certData.length) % certData.length;
    renderModal(currentCertIndex);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentCertIndex = -1;
  }

  // مدارک: باز شدن با قابلیت پیمایش قبلی/بعدی
  certCards.forEach((card, index) => {
    card.addEventListener('click', () => openCertModal(index));
  });

  // سایر تصاویر لایت‌باکس (گالری و غیره): بدون پیمایش
  document.querySelectorAll('.lightbox-trigger:not(.cert-card)').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const img = trigger.querySelector('img');
      if (img?.src) {
        modal?.classList.remove('has-nav');
        openModal(img.src, img.alt);
      }
    });
  });

  prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); showRelativeCert(-1); });
  nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); showRelativeCert(1); });

  closeBtn?.addEventListener('click', closeModal);

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!modal?.classList.contains('active')) return;
    if (e.key === 'Escape') closeModal();
    if (modal.classList.contains('has-nav')) {
      if (e.key === 'ArrowLeft') showRelativeCert(-1);
      if (e.key === 'ArrowRight') showRelativeCert(1);
    }
  });

  // ==========================================
  // ۵. مدیریت کشوی گواهینامه‌ها (نمایش دو ردیف + دکمه نمایش همه)
  // ==========================================
  (function setupCertToggle() {
    const panel = document.getElementById('certGridPanel');
    const scroll = document.getElementById('certGridScroll');
    const grid = document.getElementById('certGrid');
    const toggleWrap = document.querySelector('.cert-toggle-wrap');
    const toggleBtn = document.getElementById('certToggleBtn');
    const toggleText = document.getElementById('certToggleText');
    const totalCerts = certData.length;

    if (!panel || !scroll || !grid || !toggleBtn) return;

    let isExpanded = false;

    function getCollapsedHeight() {
      const cards = Array.from(grid.querySelectorAll('.cert-card'));
      if (!cards.length) return scroll.scrollHeight;

      const tops = [...new Set(cards.map(c => c.offsetTop))].sort((a, b) => a - b);

      if (tops.length <= 2) {
        return null; // فقط ۱ یا ۲ ردیف داریم؛ نیازی به کشو نیست
      }

      const thirdRowTop = tops[2];
      const gap = parseFloat(getComputedStyle(grid).rowGap) || 18;
      return Math.max(0, thirdRowTop - gap / 2);
    }

    function applyCollapsedState() {
      const collapsedHeight = getCollapsedHeight();

      if (collapsedHeight === null) {
        // محتوای کم؛ کشو غیرفعال می‌شود
        scroll.style.maxHeight = 'none';
        panel.classList.add('no-toggle');
        toggleWrap?.classList.add('is-hidden');
        return;
      }

      panel.classList.remove('no-toggle');
      toggleWrap?.classList.remove('is-hidden');

      if (isExpanded) {
        scroll.style.maxHeight = scroll.scrollHeight + 'px';
      } else {
        scroll.style.maxHeight = collapsedHeight + 'px';
      }
    }

    function toggleCerts() {
      isExpanded = !isExpanded;
      panel.classList.toggle('is-expanded', isExpanded);
      toggleBtn.classList.toggle('is-open', isExpanded);
      if (toggleText) {
        toggleText.textContent = isExpanded
          ? 'بستن گواهینامه‌ها'
          : `مشاهده همه گواهینامه‌ها (${toPersianDigits(totalCerts)})`;
      }
      applyCollapsedState();

      if (!isExpanded) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    toggleBtn.addEventListener('click', toggleCerts);

    // اجرای اولیه پس از رندر شدن کامل تصاویر
    window.addEventListener('load', applyCollapsedState);
    applyCollapsedState();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applyCollapsedState, 200);
    });
  })();

  // ==========================================
  // ۶. انیمیشن نمایش کارت‌ها هنگام اسکرول (Reveal)
  // ==========================================
  const revealElements = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');
  
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('in'));
  }

  // ==========================================
  // ۷. حالت هدر هنگام اسکرول و هایلایت منو
  // ==========================================
  const header = document.querySelector('.boom-header');
  const sections = document.querySelectorAll('section[id], main[id]');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }

    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id') || '';
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (current && link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // ==========================================
  // ۸. رنگی شدن دائمی نقشه پس از اولین هاور
  // ==========================================
  const mapFrame = document.querySelector('.address-map-frame');
  if (mapFrame) {
    const revealMap = () => mapFrame.classList.add('is-revealed');
    mapFrame.addEventListener('mouseenter', revealMap, { once: true });
    mapFrame.addEventListener('touchstart', revealMap, { once: true, passive: true });
  }

});