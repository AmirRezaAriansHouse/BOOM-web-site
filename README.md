# سایت آکادمی انفجار (BOOM)

## ساختار پوشه‌ها

```
├── index.html              صفحه اصلی
├── magazine.html           لیست مقالات (کارت‌ها بین مارکرهای BUILD خودکار ساخته می‌شوند)
├── articles/               ⚠️ خودکار: یک صفحه‌ی HTML ثابت برای هر مقاله (npm run build)
├── sitemap.xml             ⚠️ خودکار (npm run build)
├── favicon.ico             (باید در ریشه بماند)
├── robots.txt
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   ├── icons/              favicon-16/32، icon-192، apple-touch-icon
│   └── images/
│       ├── brand/  hero/  coach/  gallery/  certificates/
│       └── og/             تصویر اشتراک‌گذاری (Open Graph)
├── content/
│   └── articles/           مقالات Markdown (+ راهنمای README.md)
└── scripts/
    ├── build.js            ساخت صفحات مقاله، لیست مجله و sitemap
    └── templates/
        └── article.html    قالب صفحه‌ی مقاله
```

## کار با مقالات

```
npm install        # فقط بار اول
npm run build      # ساخت articles/*.html ، به‌روزرسانی magazine.html و sitemap.xml
```

جزئیات بیشتر: `content/articles/README.md`

## نکته‌ی نگهداری
هدر و فوتر سایت در سه جا وجود دارد: `index.html`، `magazine.html` و `scripts/templates/article.html`.
اگر منوی سایت را تغییر دادی، هر سه را به‌روز کن و بعد `npm run build` بزن.
