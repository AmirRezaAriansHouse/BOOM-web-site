const BOOM = {
  selectors: { 
    header: 'header', 
    reveal: '[data-reveal], [data-reveal-stagger]', 
    hero: ['.hero .eyebrow','.hero h1','.hero .lead','.hero .hero-actions','.hero-badges'], 
    buttons: '.btn', 
    anchors: 'a[href^="#"]' 
  },
  scroll: { headerThreshold: 35, revealThreshold: 0.14, revealOffset: '-50px', anchorOffset: 18 },
  animation: { heroDelay: 120, heroStep: 100, duration: 750 }
};

function prefersReducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
function supportsHover() { return window.matchMedia('(hover: hover) and (pointer: fine)').matches; }
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

function initScrollReveal() {
  const elements = $$(BOOM.selectors.reveal);
  if (!elements.length) return;
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('in'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); observer.unobserve(entry.target); }
    });
  }, { threshold: BOOM.scroll.revealThreshold, rootMargin: `0px 0px ${BOOM.scroll.revealOffset} 0px` });
  elements.forEach(el => observer.observe(el));
}

function initHeader() {
  const header = $(BOOM.selectors.header);
  if (!header) return;
  let ticking = false;
  const updateHeader = () => { header.classList.toggle('scrolled', window.scrollY > BOOM.scroll.headerThreshold); ticking = false; };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; window.requestAnimationFrame(updateHeader); } }, { passive: true });
  updateHeader();
}

function initHero() {
  const heroEls = $$(BOOM.selectors.hero.join(','));
  if (!heroEls.length) return;
  if (prefersReducedMotion()) { heroEls.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; }); return; }
  heroEls.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(24px)'; el.style.transition = 'opacity .75s cubic-bezier(.22,1,.36,1), transform .75s cubic-bezier(.22,1,.36,1)'; });
  heroEls.forEach((el, i) => window.setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, BOOM.animation.heroDelay + i * BOOM.animation.heroStep));
}

function initSmoothNavigation() {
  $$(BOOM.selectors.anchors).forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const headerHeight = $(BOOM.selectors.header)?.offsetHeight || 0;
      window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - BOOM.scroll.anchorOffset), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      if (history.replaceState && targetId !== '#top') history.replaceState(null, '', targetId);
    });
  });
}

function initButtonGlow() {
  if (!supportsHover()) return;
  $$(BOOM.selectors.buttons).forEach(btn => {
    btn.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      btn.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
    btn.addEventListener('pointerleave', () => { btn.style.removeProperty('--mx'); btn.style.removeProperty('--my'); });
  });
}

/* اسلایدر گالری کشویی گواهینامه‌ها */
function initCertificatesSlider() {
  const track = $('.cert-track');
  const slides = $$('.cert-slide');
  const prevBtn = $('.cert-prev');
  const nextBtn = $('.cert-next');
  const dotsContainer = $('.cert-dots');

  if (!track || !slides.length) return;

  let currentIndex = 0;

  function getVisibleSlidesCount() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 992) return 2;
    return 3;
  }

  function getMaxIndex() {
    return Math.max(0, slides.length - getVisibleSlidesCount());
  }

  function createDots() {
    dotsContainer.innerHTML = '';
    const totalDots = getMaxIndex() + 1;
    for (let i = 0; i < totalDots; i++) {
      const dot = document.createElement('div');
      dot.classList.add('cert-dot');
      if (i === currentIndex) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    const dots = $$('.cert-dot', dotsContainer);
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  function goToSlide(index) {
    const maxIndex = getMaxIndex();
    currentIndex = Math.max(0, Math.min(index, maxIndex));

    const slideWidth = slides[0].offsetWidth + 20; // 20px gap
    track.style.transform = `translateX(${currentIndex * slideWidth}px)`; // RTL sliding
    updateDots();
  }

  nextBtn?.addEventListener('click', () => {
    if (currentIndex < getMaxIndex()) goToSlide(currentIndex + 1);
    else goToSlide(0);
  });

  prevBtn?.addEventListener('click', () => {
    if (currentIndex > 0) goToSlide(currentIndex - 1);
    else goToSlide(getMaxIndex());
  });

  window.addEventListener('resize', () => {
    createDots();
    goToSlide(currentIndex);
  });

  createDots();
  goToSlide(0);
}

function initBoomAcademy() {
  initScrollReveal(); 
  initHeader(); 
  initHero(); 
  initSmoothNavigation(); 
  initButtonGlow();
  initCertificatesSlider();
}

document.readyState === 'loading' 
  ? document.addEventListener('DOMContentLoaded', initBoomAcademy, { once: true }) 
  : initBoomAcademy();
  // اسکریپت عملکرد لایت‌باکس و زوم تصاویر گالری
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('imageLightbox');
  const modalImg = document.getElementById('lightboxImg');
  const closeBtn = document.querySelector('.lightbox-close');
  const triggers = document.querySelectorAll('.lightbox-trigger');

  triggers.forEach(img => {
    img.addEventListener('click', () => {
      modal.style.display = 'flex';
      modalImg.src = img.src;
    });
  });

  const closeModal = () => {
    modal.style.display = 'none';
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // بسته شدن با کلیک روی پس‌زمینه تاریک بیرون عکس
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // بسته شدن با کلید Esc کیبورد
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
});