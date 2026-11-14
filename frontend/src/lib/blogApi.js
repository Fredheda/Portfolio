import { z } from 'zod';

// Shapes of the blog read API v1 as the backend forwards them (spec section
// 5). zod drops unknown keys, so an additive API change cannot break a page;
// the fields a page needs are required, so a breaking change fails here.
const Summary = z.object({
  postId: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()).default([]),
  publishedAt: z.string(),
  updatedAt: z.string(),
  readingTimeMinutes: z.number(),
  coverMediaId: z.string().nullable().optional(),
});

const Media = z.object({
  id: z.string(),
  kind: z.string(),
  mime: z.string(),
  alt: z.string().nullable().optional(),
});

const Post = Summary.extend({ body: z.string(), media: z.array(Media).default([]) });
const PostList = z.object({ items: z.array(Summary), nextCursor: z.string().nullable().optional() });

// kind 'not_found': no such post. kind 'unavailable': anything else, shown
// with fixed text; the cause (status, body) never reaches the page.
export class BlogError extends Error {
  constructor(kind) {
    super(kind);
    this.kind = kind;
  }
}

const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;
export const isSlug = (value) => typeof value === 'string' && SLUG.test(value);

export const mediaUrl = (slug, id) =>
  `/api/blog/posts/${encodeURIComponent(slug)}/media/${encodeURIComponent(id)}`;

async function getJson(path, schema, signal) {
  let response;
  try {
    response = await fetch(path, { signal, headers: { accept: 'application/json' } });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new BlogError('unavailable');
  }
  if (response.status === 404) throw new BlogError('not_found');
  if (!response.ok) throw new BlogError('unavailable');
  try {
    return schema.parse(await response.json());
  } catch {
    throw new BlogError('unavailable');
  }
}

export async function listPosts({ limit = 20, cursor, tag, signal } = {}) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set('cursor', cursor);
  if (tag) query.set('tag', tag);
  try {
    return await getJson(`/api/blog/posts?${query}`, PostList, signal);
  } catch (error) {
    // The list route does not exist while the blog is switched off.
    if (error instanceof BlogError && error.kind === 'not_found') throw new BlogError('unavailable');
    throw error;
  }
}

export const getPost = (slug, signal) =>
  getJson(`/api/blog/posts/${encodeURIComponent(slug)}`, Post, signal);
