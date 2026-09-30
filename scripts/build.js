// scripts/build.js
// مقالات Markdown داخل content/articles/ رو می‌خونه و این‌ها رو می‌سازه:
//   ۱. articles/<slug>.html  ← صفحه‌ی HTML ثابت با متادیتا، Breadcrumb، محتوای مقاله و مقالات مرتبط
//   ۲. magazine.html         ← فهرست کاملاً HTML و قابل خزیدن همه‌ی مقالات
//   ۳. sitemap.xml           ← آدرس همه‌ی صفحات و مقالات
//
// اجرا: npm run build
// نیازمندی‌ها: npm install

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const ARTICLES_SRC = path.join(ROOT, 'content', 'articles');
const ARTICLES_OUT = path.join(ROOT, 'articles');
const TEMPLATE_FILE = path.join(__dirname, 'templates', 'article.html');
const MAGAZINE_FILE = path.join(ROOT, 'magazine.html');
const SITEMAP_FILE = path.join(ROOT, 'sitemap.xml');
const SITE_URL = 'https://boomacademy.ir';

// ---------------------------------------------------------------- کمکی‌ها
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toEnDigits = (s) => String(s).replace(/[۰-۹]/g, (d) => FA_DIGITS.indexOf(d));
const toFaDigits = (s) => String(s).replace(/\d/g, (d) => FA_DIGITS[d]);

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// تاریخ شمسی (با ارقام فارسی) → میلادی YYYY-MM-DD
function jalaliToISO(dateStr) {
  const [jy0, jm, jd] = toEnDigits(dateStr).split('/').map((n) => parseInt(n, 10));
  const jy = jy0 + 1595;
  let days = -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const md = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm;
  for (gm = 0; gm < 13; gm++) {
    if (gd <= md[gm]) break;
    gd -= md[gm];
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${gy}-${pad(gm)}-${pad(gd)}`;
}

function readTime(html) {
  const words = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return `${toFaDigits(Math.max(1, Math.round(words / 150)))} دقیقه مطالعه`;
}

const articleUrl = (slug) => `${SITE_URL}/articles/${encodeURIComponent(slug)}.html`;

function articleImage(a) {
  const fallback = `${SITE_URL}/assets/images/og/og-image.jpg`;
  if (!a.image) return fallback;
  const rel = String(a.image).replace(/^\/+/, '');
  // اگر فایل عکس واقعاً در پروژه نباشه، به تصویر پیش‌فرض برمی‌گردیم تا لینک خراب در og:image نره
  if (!fs.existsSync(path.join(ROOT, rel))) {
    console.warn(`⚠️  عکس "${rel}" برای مقاله‌ی ${a.slug} پیدا نشد؛ og-image.jpg جایگزین شد.`);
    return fallback;
  }
  return `${SITE_URL}/${rel}`;
}

// عکس شاخص مقاله: فقط وقتی فایلش واقعاً در پروژه هست نمایش داده می‌شه؛ وگرنه ظاهر قبلی حفظ می‌شه
function imageRel(a) {
  if (!a.image) return null;
  const rel = String(a.image).replace(/^\/+/, '');
  return fs.existsSync(path.join(ROOT, rel)) ? rel : null;
}

function imageAlt(a) {
  return a.imageAlt || `تصویر مقاله: ${a.title}`;
}

function heroHtml(a) {
  const rel = imageRel(a);
  if (!rel) return '';
  return `<figure class="mag-cover">
            <img src="../${esc(rel)}" alt="${esc(imageAlt(a))}" width="1200" height="630" fetchpriority="high" decoding="async">
          </figure>`;
}

// ---------------------------------------------------------------- خواندن مقالات
function loadArticles() {
  const files = fs
    .readdirSync(ARTICLES_SRC)
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md');

  const articles = files.map((filename) => {
    const raw = fs.readFileSync(path.join(ARTICLES_SRC, filename), 'utf8');
    const { data, content } = matter(raw);

    for (const field of ['title', 'excerpt', 'date', 'category']) {
      if (!data[field]) throw new Error(`فیلد "${field}" در فایل ${filename} وجود نداره.`);
    }

    const slug = data.slug || filename.replace(/\.md$/, '');
    if (!/^[a-z0-9-]+$/i.test(slug)) {
      throw new Error(`slug فایل ${filename} باید فقط شامل حروف انگلیسی، عدد و خط تیره باشه.`);
    }

    return {
      slug,
      title: data.title,
      excerpt: data.excerpt,
      seoTitle: data.seoTitle || data.title,
      seoDescription: data.seoDescription || data.excerpt,
      date: data.date,
      updated: data.updated || null,
      category: data.category,
      image: data.image || null,
      imageAlt: data.imageAlt || null,
      content: marked.parse(content.trim()),
    };
  });

  // جدیدترین اول
  articles.sort((a, b) => jalaliToISO(b.date).localeCompare(jalaliToISO(a.date)));
  return articles;
}

function breadcrumbHtml(a) {
  return `<nav class="mag-breadcrumb" aria-label="مسیر صفحه">
            <ol>
              <li><a href="../index.html">آکادمی انفجار</a></li>
              <li><a href="../magazine.html">مجله BOOM</a></li>
              <li aria-current="page">${esc(a.title)}</li>
            </ol>
          </nav>`;
}

function relatedHtml(a, allArticles) {
  const related = allArticles
    .filter((item) => item.slug !== a.slug)
    .sort((x, y) => {
      const sameCategoryX = x.category === a.category ? 1 : 0;
      const sameCategoryY = y.category === a.category ? 1 : 0;
      if (sameCategoryX !== sameCategoryY) return sameCategoryY - sameCategoryX;
      return jalaliToISO(y.updated || y.date).localeCompare(jalaliToISO(x.updated || x.date));
    })
    .slice(0, 3);

  if (!related.length) return '';

  return `<section class="mag-related" aria-labelledby="relatedArticlesHeading">
          <div class="mag-list-head">
            <h2 id="relatedArticlesHeading">مقالات مرتبط</h2>
            <p>مطالب مرتبط را برای تکمیل این موضوع بخوانید.</p>
          </div>
          <nav class="mag-grid mag-related-grid" aria-label="مقالات مرتبط">
${related.map((r, i) => `            <a href="${esc(`../articles/${encodeURIComponent(r.slug)}.html`)}" class="mag-card mag-related-card">
              <span class="mag-card-index">${toFaDigits(String(i + 1).padStart(2, '0'))}</span>
              <span class="mag-card-tag">${esc(r.category)}</span>
              <h3>${esc(r.title)}</h3>
              <p>${esc(r.excerpt)}</p>
              <div class="mag-card-footer">
                <span class="mag-card-date">${esc(r.date)}</span>
                <span class="mag-card-read">${readTime(r.content)}</span>
              </div>
            </a>`).join('\n')}
          </nav>
        </section>`;
}

// ---------------------------------------------------------------- صفحه‌ی هر مقاله
function articleJsonLd(a) {
  const published = jalaliToISO(a.date);
  const modified = jalaliToISO(a.updated || a.date);
  const url = articleUrl(a.slug);
  const plain = a.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const graph = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      headline: a.title,
      description: a.seoDescription,
      articleSection: a.category,
      inLanguage: 'fa-IR',
      wordCount: plain.split(/\s+/).filter(Boolean).length,
      image: articleImage(a),
      datePublished: published,
      dateModified: modified,
      author: {
        '@type': 'Person',
        name: 'محمدحسین محررزاده',
        jobTitle: 'مربی رسمی فدراسیون بدنسازی و پرورش اندام',
      },
      publisher: {
        '@type': 'Organization',
        name: 'آکادمی انفجار BOOM',
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/images/brand/boom-logo.webp` },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'آکادمی انفجار', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'مجله BOOM', item: `${SITE_URL}/magazine.html` },
        { '@type': 'ListItem', position: 3, name: a.title, item: url },
      ],
    },
  ];
  // جلوگیری از بسته شدن تگ script توسط "<" داخل JSON
  return JSON.stringify(graph, null, 2).replace(/</g, '\\u003c');
}

function renderArticlePage(template, a, allArticles) {
  const url = articleUrl(a.slug);
  const shareText = encodeURIComponent(a.title);
  const values = {
    TITLE: esc(a.title),
    SEO_TITLE: esc(a.seoTitle),
    DESCRIPTION: esc(a.seoDescription),
    CATEGORY: esc(a.category),
    DATE: esc(a.date),
    ISO_DATE: jalaliToISO(a.date),
    ISO_MODIFIED: jalaliToISO(a.updated || a.date),
    READTIME: readTime(a.content),
    URL: url,
    SITE_URL,
    ARTICLE_IMAGE: esc(articleImage(a)),
    BREADCRUMB: breadcrumbHtml(a),
    HERO: heroHtml(a),
    RELATED: relatedHtml(a, allArticles),
    JSONLD: articleJsonLd(a),
    SHARE_WA: esc(`https://wa.me/?text=${shareText}%20${encodeURIComponent(url)}`),
    SHARE_TG: esc(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${shareText}`),
    CONTENT: a.content,
  };
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (m, key) => {
    if (!(key in values)) throw new Error(`placeholder ناشناخته در قالب: ${m}`);
    return values[key];
  });
}

function buildArticlePages(articles) {
  const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
  fs.mkdirSync(ARTICLES_OUT, { recursive: true });

  const keep = new Set(articles.map((a) => `${a.slug}.html`));
  for (const f of fs.readdirSync(ARTICLES_OUT)) {
    if (f.endsWith('.html') && !keep.has(f)) fs.unlinkSync(path.join(ARTICLES_OUT, f));
  }

  for (const a of articles) {
    fs.writeFileSync(path.join(ARTICLES_OUT, `${a.slug}.html`), renderArticlePage(template, a, articles), 'utf8');
  }
  console.log(`✅ ${articles.length} صفحه‌ی HTML در articles/ ساخته شد.`);
}

// ---------------------------------------------------------------- صفحه‌ی لیست (magazine.html)
const BOOK_ICON =
  '<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path></svg>';

function featuredHtml(a) {
  return `<section class="section mag-featured-section" id="magFeaturedSection" aria-labelledby="featuredArticleHeading">
      <div class="wrap">
        <article class="mag-featured" data-reveal>
          <a href="articles/${encodeURIComponent(a.slug)}.html" class="mag-featured-media${imageRel(a) ? ' has-image' : ''}" aria-label="مطالعه ${esc(a.title)}">
            ${imageRel(a) ? `<img src="${esc(imageRel(a))}" alt="${esc(imageAlt(a))}" width="1200" height="630" decoding="async">` : BOOK_ICON}
          </a>
          <div class="mag-featured-body">
            <span class="mag-featured-label">جدیدترین مقاله</span>
            <span class="mag-card-tag">${esc(a.category)}</span>
            <h2 id="featuredArticleHeading"><a href="articles/${encodeURIComponent(a.slug)}.html">${esc(a.title)}</a></h2>
            <p>${esc(a.excerpt)}</p>
            <div class="mag-featured-meta">
              <span>${esc(a.date)}</span>
              <span class="mag-dot">•</span>
              <span>${readTime(a.content)}</span>
            </div>
            <a class="mag-read-link" href="articles/${encodeURIComponent(a.slug)}.html">مطالعه مقاله ←</a>
          </div>
        </article>
      </div>
    </section>`;
}

function cardHtml(a, index) {
  return `<article class="mag-card-wrap">
          <a href="articles/${encodeURIComponent(a.slug)}.html" class="mag-card">
            ${imageRel(a) ? `<span class="mag-card-thumb"><img src="${esc(imageRel(a))}" alt="${esc(imageAlt(a))}" width="1200" height="630" loading="lazy" decoding="async"></span>\n            ` : ''}<span class="mag-card-index">${toFaDigits(String(index + 1).padStart(2, '0'))}</span>
            <span class="mag-card-tag">${esc(a.category)}</span>
            <h3>${esc(a.title)}</h3>
            <p>${esc(a.excerpt)}</p>
            <div class="mag-card-footer">
              <span class="mag-card-date">${esc(a.date)}</span>
              <span class="mag-card-read">${readTime(a.content)}</span>
            </div>
          </a>
        </article>`;
}

function replaceBetween(html, name, inner) {
  const start = `<!-- BUILD:${name}:START -->`;
  const end = `<!-- BUILD:${name}:END -->`;
  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i === -1 || j === -1 || j < i) throw new Error(`مارکر ${start} در magazine.html پیدا نشد.`);
  return html.slice(0, i + start.length) + '\n' + inner + '\n' + html.slice(j);
}

function buildMagazinePage(articles) {
  let html = fs.readFileSync(MAGAZINE_FILE, 'utf8');
  const [featured, ...rest] = articles;

  html = replaceBetween(html, 'FEATURED', featured ? '    ' + featuredHtml(featured) : '');
  const listInner = rest.length
    ? rest.map((a, i) => '          ' + cardHtml(a, i)).join('\n')
    : '          <p class="mag-empty">هنوز مقاله‌ی دیگری منتشر نشده. به‌زودی مطالب تخصصی اینجا اضافه می‌شوند.</p>';
  html = replaceBetween(html, 'LIST', listInner);

  fs.writeFileSync(MAGAZINE_FILE, html, 'utf8');
  console.log(`✅ magazine.html با ${articles.length} لینک HTML ثابت به‌روز شد.`);
}

// ---------------------------------------------------------------- sitemap.xml
function buildSitemap(articles) {
  const latest = articles.map((a) => jalaliToISO(a.updated || a.date)).sort().pop();
  const urls = [
    { loc: `${SITE_URL}/`, changefreq: 'monthly', priority: '1.0' },
    { loc: `${SITE_URL}/magazine.html`, changefreq: 'weekly', priority: '0.8', lastmod: latest },
    ...articles.map((a) => ({
      loc: articleUrl(a.slug),
      lastmod: jalaliToISO(a.updated || a.date),
      changefreq: 'monthly',
      priority: '0.6',
    })),
  ];
  const body = urls
    .map((u) =>
      `  <url>\n    <loc>${esc(u.loc)}</loc>\n` +
      (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : '') +
      `    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n');
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!-- این فایل خودکار توسط scripts/build.js ساخته می‌شه؛ دستی ویرایش نکن. -->\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  fs.writeFileSync(SITEMAP_FILE, xml, 'utf8');
  console.log(`✅ sitemap.xml با ${urls.length} آدرس ساخته شد.`);
}

// ---------------------------------------------------------------- اجرا
const articles = loadArticles();
buildArticlePages(articles);
buildMagazinePage(articles);
buildSitemap(articles);
