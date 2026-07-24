## 2024-07-24 — Sitemaps: Replaced Static Sitemap with Dynamic Astro Generation
**Finding:** The application used a hardcoded, static `sitemap.xml` file which did not reflect the dynamically generated template and blog pages, making many important pages undiscoverable by search engine crawlers.
**Root cause:** A static `sitemap.xml` file was maintained manually in the repository root, missing new dynamic routes in `apps/marketing`.
**Fix applied:** Configured the `@astrojs/sitemap` integration in `apps/marketing/astro.config.mjs` and updated the `site` property. Removed the static `sitemap.xml` and updated `robots.txt` files (in root and `apps/web/public/`) to point to the newly generated `sitemap-index.xml`.
**Measurement:** Verify that `https://www.invoiceapp.ng/sitemap-index.xml` is successfully indexed via Google Search Console and contains all expected dynamic routes (blog posts, templates). Watch the number of indexed pages.
**Watch for:** Ensure any new Astro apps or routes are correctly captured by this generated sitemap pipeline during builds.
