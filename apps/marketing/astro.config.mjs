import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.invoiceapp.ng',
  integrations: [mdx(), react(), tailwind({ applyBaseStyles: false }), sitemap()],
  output: 'static',
});
