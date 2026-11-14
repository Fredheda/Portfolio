import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listPosts } from '../lib/blogApi';
import { formatDate, readingTime } from '../lib/blogFormat';
import { content } from '../lib/content';
import { useDocumentHead } from '../lib/useDocumentHead';

const shell = 'mx-auto max-w-page px-4 py-14 md:px-6 md:py-20';
const button =
  'rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-royal';

export function PostMeta({ post }) {
  return (
    <p className="m-0 text-sm text-muted">
      {formatDate(post.publishedAt)} · {readingTime(post.readingTimeMinutes)}
    </p>
  );
}

export function TagLinks({ tags }) {
  if (!tags.length) return null;
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            to={`/blog?tag=${encodeURIComponent(tag)}`}
            className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-royal no-underline hover:border-royal"
          >
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function BlogIndex() {
  const [params] = useSearchParams();
  const tag = params.get('tag')?.slice(0, 50) || undefined;
  const [state, setState] = useState({ status: 'loading', items: [], next: null });
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  useDocumentHead({ title: `Blog · ${content.profile.name}` });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', items: [], next: null });
    setMoreFailed(false);
    listPosts({ tag, signal: controller.signal }).then(
      (page) =>
        setState({ status: page.items.length ? 'ready' : 'empty', items: page.items, next: page.nextCursor ?? null }),
      (error) => {
        if (error?.name !== 'AbortError') setState({ status: 'error', items: [], next: null });
      },
    );
    return () => controller.abort();
  }, [tag, attempt]);

  const loadMore = async () => {
    setLoadingMore(true);
    setMoreFailed(false);
    try {
      const page = await listPosts({ tag, cursor: state.next });
      setState((current) => ({ ...current, items: [...current.items, ...page.items], next: page.nextCursor ?? null }));
    } catch {
      setMoreFailed(true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="hero-wash">
      <div className={shell}>
        <h1 className="m-0 font-heading text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">Blog</h1>
        {tag && (
          <p className="mt-4 text-muted">
            Posts tagged <strong className="text-ink">{tag}</strong>.{' '}
            <Link to="/blog" className="font-semibold text-royal">
              Show all posts
            </Link>
          </p>
        )}

        {state.status === 'loading' && <div className="mt-10 min-h-[40vh]" aria-busy="true" />}

        {state.status === 'empty' && <p className="mt-10 text-muted">No posts yet.</p>}

        {state.status === 'error' && (
          <div role="alert" className="mt-10">
            <p className="m-0 text-ink">Posts can&apos;t be loaded right now.</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className={`${button} mt-4`}>
              Try again
            </button>
          </div>
        )}

        {state.items.length > 0 && (
          <ul className="mt-10 grid list-none gap-4 p-0 md:grid-cols-2">
            {state.items.map((post) => (
              <li key={post.postId}>
                <article className="flex h-full flex-col gap-3 rounded-xl border border-line bg-white p-5">
                  <PostMeta post={post} />
                  <h2 className="m-0 font-heading text-xl font-semibold leading-snug">
                    <Link to={`/blog/${post.slug}`} className="text-ink no-underline hover:text-royal">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="m-0 text-muted">{post.summary}</p>
                  <TagLinks tags={post.tags} />
                </article>
              </li>
            ))}
          </ul>
        )}

        {state.next && (
          <div className="mt-8">
            {moreFailed && (
              <p role="alert" className="mb-3 text-ink">
                More posts can&apos;t be loaded right now.
              </p>
            )}
            <button type="button" onClick={loadMore} disabled={loadingMore} className={button}>
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
