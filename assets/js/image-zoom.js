// زوم تصاویر مقاله: کلیک/تپ برای باز شدن، چرخ ماوس یا پینچ برای زوم، کشیدن برای جابه‌جایی
(function () {
  var imgs = document.querySelectorAll('.mag-article-body img, .mag-cover img');
  if (!imgs.length) return;
  var ov = document.createElement('div');
  ov.className = 'zoom-overlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-label', 'نمایش بزرگ تصویر');
  ov.innerHTML = '<button class="zoom-btn zoom-close" aria-label="بستن">×</button>' +
    '<button class="zoom-btn zoom-in" aria-label="بزرگ‌نمایی">+</button>' +
    '<button class="zoom-btn zoom-out" aria-label="کوچک‌نمایی">−</button>' +
    '<img alt=""><div class="zoom-hint">برای زوم از چرخ ماوس یا دو انگشت استفاده کنید</div>';
  document.body.appendChild(ov);
  var big = ov.querySelector('img');
  var s = 1, x = 0, y = 0, pts = {}, startDist = 0, startS = 1, last = null, moved = false;
  function apply() {
    big.style.transform = 'translate(calc(-50% + ' + x + 'px), calc(-50% + ' + y + 'px)) scale(' + s + ')';
  }
  function setScale(v) {
    s = Math.min(6, Math.max(1, v));
    if (s === 1) { x = 0; y = 0; }
    apply();
  }
  function open(img) {
    big.src = img.currentSrc || img.src; big.alt = img.alt;
    s = 1; x = 0; y = 0; apply();
    ov.classList.add('active'); document.body.style.overflow = 'hidden';
  }
  function close() { ov.classList.remove('active'); document.body.style.overflow = ''; }
  imgs.forEach(function (img) {
    img.classList.add('zoomable');
    img.addEventListener('click', function () { open(img); });
  });
  ov.querySelector('.zoom-close').addEventListener('click', close);
  ov.querySelector('.zoom-in').addEventListener('click', function () { setScale(s * 1.5); });
  ov.querySelector('.zoom-out').addEventListener('click', function () { setScale(s / 1.5); });
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  document.addEventListener('keydown', function (e) {
    if (!ov.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    if (e.key === '+' || e.key === '=') setScale(s * 1.5);
    if (e.key === '-') setScale(s / 1.5);
  });
  ov.addEventListener('wheel', function (e) {
    e.preventDefault(); setScale(s * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  }, { passive: false });
  big.addEventListener('dblclick', function () { setScale(s > 1 ? 1 : 2.5); });
  big.addEventListener('pointerdown', function (e) {
    big.setPointerCapture(e.pointerId); pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pts);
    if (ids.length === 2) {
      var a = pts[ids[0]], b = pts[ids[1]];
      startDist = Math.hypot(a.x - b.x, a.y - b.y); startS = s;
    }
    last = { x: e.clientX, y: e.clientY }; moved = false;
  });
  big.addEventListener('pointermove', function (e) {
    if (!pts[e.pointerId]) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pts);
    if (ids.length === 2) {
      var a = pts[ids[0]], b = pts[ids[1]];
      setScale(startS * Math.hypot(a.x - b.x, a.y - b.y) / startDist);
    } else if (s > 1 && last) {
      x += e.clientX - last.x; y += e.clientY - last.y; apply(); moved = true;
    }
    last = { x: e.clientX, y: e.clientY };
  });
  function up(e) { delete pts[e.pointerId]; last = null; }
  big.addEventListener('pointerup', up);
  big.addEventListener('pointercancel', up);
})();
