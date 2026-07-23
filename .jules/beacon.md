## 2026-07-23 — Structured Data: Add CreativeWork Schema to Template Pages
**Finding:** All dynamic template landing pages (16 pages generated from `seoTemplates.ts`) lacked any form of structured data (JSON-LD), despite the homepage having `WebApplication` schema.
**Root cause:** Astro dynamic routes mapping from data arrays (`[slug].astro`) do not automatically inherit structured data; it must be explicitly constructed and injected into the head slot for each generated page.
**Fix applied:** Constructed a `CreativeWork` JSON-LD schema using the dynamic `template.title` and `template.description` properties, and injected it into the `<BaseLayout>` head slot via `<script type="application/ld+json" set:html={JSON.stringify(schema)} slot="head" />`.
**Measurement:** Validate template pages via Google's Rich Results Test tool to ensure the `CreativeWork` schema is recognized without warnings. Watch for increased rich result impressions for template queries in Search Console.
**Watch for:** Other dynamically generated pages (e.g., individual blog posts or tools) might also lack proper schema implementation if they do not explicitly pass a JSON-LD block to the layout's head slot.
