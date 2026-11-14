import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlogError, getPost, isSlug, listPosts, mediaUrl } from './blogApi';

const summary = {
  postId: '01JABC',
  slug: 'hello-world',
  title: 'Hello world',
  summary: 'A first post.',
  tags: ['maths'],
  publishedAt: '2026-11-10T08:00:00Z',
  updatedAt: '2026-11-10T08:00:00Z',
  readingTimeMinutes: 4,
  coverMediaId: 'm1',
  futureField: { added: 'in v1.1' },
};

const reply = (status, body) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body });

afterEach(() => vi.unstubAllGlobals());

describe('listPosts', () => {
  it('asks for the page, cursor and tag, and drops unknown fields', async () => {
    const fetch = reply(200, { items: [summary], nextCursor: 'c2' });
    vi.stubGlobal('fetch', fetch);
    const page = await listPosts({ limit: 5, cursor: 'c1', tag: 'maths' });
    expect(fetch.mock.calls[0][0]).toBe('/api/blog/posts?limit=5&cursor=c1&tag=maths');
    expect(page.nextCursor).toBe('c2');
    expect(page.items[0].slug).toBe('hello-world');
    expect(page.items[0]).not.toHaveProperty('futureField');
  });

  it('treats a 404 as unavailable: the list route only exists while the blog is on', async () => {
    vi.stubGlobal('fetch', reply(404, { detail: 'Not Found' }));
    await expect(listPosts()).rejects.toMatchObject({ kind: 'unavailable' });
  });
});

describe('getPost', () => {
  const post = {
    ...summary,
    body: '# Hi',
    version: 1,
    media: [{ id: 'm1', kind: 'image', mime: 'image/png', alt: 'A pixel', blobPath: 'x' }],
  };

  it('returns the post without storage paths', async () => {
    vi.stubGlobal('fetch', reply(200, post));
    const result = await getPost('hello-world');
    expect(result.body).toBe('# Hi');
    expect(result.media[0].alt).toBe('A pixel');
    expect(result.media[0]).not.toHaveProperty('blobPath');
  });

  it('maps 404 to not_found and other failures to unavailable', async () => {
    vi.stubGlobal('fetch', reply(404, {}));
    await expect(getPost('nope')).rejects.toMatchObject({ kind: 'not_found' });
    vi.stubGlobal('fetch', reply(503, { error: 'blog_unavailable' }));
    await expect(getPost('nope')).rejects.toMatchObject({ kind: 'unavailable' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));
    await expect(getPost('nope')).rejects.toBeInstanceOf(BlogError);
  });

  it('treats a body that does not match the contract as unavailable', async () => {
    vi.stubGlobal('fetch', reply(200, { slug: 'x' }));
    await expect(getPost('x')).rejects.toMatchObject({ kind: 'unavailable' });
  });

  it('rethrows an abort so the page can ignore it', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort));
    await expect(getPost('x')).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('mediaUrl and isSlug', () => {
  it('builds the only media URL the pages ever use', () => {
    expect(mediaUrl('hello-world', 'm_1')).toBe('/api/blog/posts/hello-world/media/m_1');
  });

  it('accepts slugs and rejects everything else', () => {
    expect(isSlug('hello-world')).toBe(true);
    for (const bad of ['Hello', 'a_b', '../x', '', '-a', 'a'.repeat(101), undefined]) {
      expect(isSlug(bad)).toBe(false);
    }
  });
});
