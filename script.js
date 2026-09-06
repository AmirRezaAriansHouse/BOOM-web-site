document.addEventListener('DOMContentLoaded', () => {

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
  setupSliderNav('.cert-slider-container', '.cert-prev', '.cert-next', 300);

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
  // ۴. مدیریت لایت‌باکس تصاویر (Lightbox Modal)
  // ==========================================
  const triggers = document.querySelectorAll('.lightbox-trigger');
  const modal = document.querySelector('.lightbox-modal');
  const modalImg = modal?.querySelector('img');
  const closeBtn = modal?.querySelector('.lightbox-close');

  function openModal(src) {
    if (!modal || !modalImg) return;
    modalImg.src = src;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const img = trigger.querySelector('img');
      if (img?.src) {
        openModal(img.src);
      }
    });
  });

  closeBtn?.addEventListener('click', closeModal);

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) {
      closeModal();
    }
  });

  // ==========================================
  // ۵. انیمیشن نمایش کارت‌ها هنگام اسکرول (Reveal)
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
  // ۶. حالت هدر هنگام اسکرول و هایلایت منو
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

});
// مدیریت لایت‌باکس تصاویر
const modal = document.getElementById('imageLightbox');
const modalImg = document.getElementById('lightboxImg');
const closeBtn = document.querySelector('.lightbox-close');
const triggers = document.querySelectorAll('.lightbox-trigger');

if (modal && modalImg) {
  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const img = trigger.querySelector('img');
      if (img && img.src) {
        modalImg.src = img.src;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  closeBtn?.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}   
