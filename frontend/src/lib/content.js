import { z } from 'zod';
import raw from '../../content/site-content.json';

// The one schema for content/site-content.json. The page, the link previews
// (see routeMeta.js) and this test all read the file through it, so a
// malformed edit fails CI instead of the live page.

const text = z.string().min(1);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'not a real calendar date');

const count = z.number().int().nonnegative();

export const contentSchema = z.object({
  profile: z.object({
    name: text,
    claim: text,
    now: text,
    headline: text,
    links: z.object({
      linkedin: z.string().url(),
      github: z.string().url(),
      email: z.string().startsWith('mailto:'),
    }),
    photo: z.object({
      src: text,
      srcLarge: text,
      alt: text,
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }),
  }),
  about: z.object({ paragraphs: z.array(text).min(1) }),
  experience: z
    .array(
      z.object({
        id: text,
        role: text,
        sector: text,
        start: z.string().regex(/^\d{4}$/),
        end: z.string().regex(/^\d{4}$/).nullable(),
        impact: text,
      }),
    )
    .min(1),
  postsUrl: z.string().url(),
  posts: z
    .array(
      z.object({
        id: text,
        date: isoDate,
        text,
        url: z.string().url(),
        reactions: count,
        comments: count,
      }),
    )
    .min(3)
    .max(6),
  projects: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        title: text,
        plainEnglish: text,
        techLine: text,
        link: z.string().url().nullable(),
        categories: z.array(text),
        featured: z.boolean(),
        caseStudy: z.object({
          problem: text,
          built: text,
          // Mermaid source (top-down flowchart), drawn behind "For engineers".
          architecture: text.optional(),
        }),
      }),
    )
    .min(1),
  fredbot: z.object({
    intro: text,
    suggestions: z.array(text).length(3),
  }),
});

export const content = contentSchema.parse(raw);
