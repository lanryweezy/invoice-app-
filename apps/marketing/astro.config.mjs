import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [mdx(), react(), tailwind({ applyBaseStyles: false }), sitemap()],
  site: 'https://www.invoiceapp.ng',
  output: 'static',
});
