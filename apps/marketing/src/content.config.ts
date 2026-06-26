import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string(),
    category: z.string(),
    readTime: z.string(),
    date: z.string(),
    imageUrl: z.string().url(),
  }),
});

export const collections = {
  'blog': blogCollection,
};
