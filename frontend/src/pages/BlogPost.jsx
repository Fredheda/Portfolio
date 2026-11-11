import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BlogBody from '../components/blog/BlogBody';
import { getPost, isSlug, mediaUrl } from '../lib/blogApi';
import { content } from '../lib/content';
import { useDocumentHead } from '../lib/useDocumentHead';
import { PostMeta, TagLinks } from './BlogIndex';
import NotFound from './NotFound';

const button =
  'rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-royal';

export default function BlogPost() {
  const { slug } = useParams();
  const valid = isSlug(slug);
  const [state, setState] = useState({ status: valid ? 'loading' : 'not_found', post: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!valid) {
      setState({ status: 'not_found', post: null });
      return undefined;
    }
    const controller = new AbortController();
    setState({ status: 'loading', post: null });
    getPost(slug, controller.signal).then(
      (post) => setState({ status: 'ready', post }),
      (error) => {
        if (error?.name === 'AbortError') return;
        setState({ status: error?.kind === 'not_found' ? 'not_found' : 'error', post: null });
      },
    );
    return () => controller.abort();
  }, [slug, valid, attempt]);

  const { post } = state;
  useDocumentHead({
    title: post ? `${post.title} · ${content.profile.name}` : undefined,
    noindex: state.status === 'not_found',
  });

  if (state.status === 'not_found') return <NotFound />;

  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-page px-4 py-14 md:px-6 md:py-20">
        <Link to="/blog" className="text-sm font-semibold text-royal">
          All posts
        </Link>
        <div role="alert" className="mt-6">
          <p className="m-0 text-ink">This post can&apos;t be loaded right now.</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className={`${button} mt-4`}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (state.status === 'loading') return <div className="min-h-[60vh]" aria-busy="true" />;

  const cover = post.media.find((item) => item.id === post.coverMediaId && item.kind === 'image');

  return (
    <article className="hero-wash">
      <div className="mx-auto max-w-[46rem] px-4 py-14 md:px-6 md:py-20">
        <Link to="/blog" className="text-sm font-semibold text-royal">
          All posts
        </Link>
        <h1 className="mt-4 font-heading text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-col gap-3">
          <PostMeta post={post} />
          <TagLinks tags={post.tags} />
        </div>
        {cover && (
          <img
            src={mediaUrl(post.slug, cover.id)}
            alt={cover.alt ?? ''}
            className="mt-8 block h-auto max-w-full rounded-xl"
          />
        )}
        <div className="mt-8">
          <BlogBody slug={post.slug}>{post.body}</BlogBody>
        </div>
      </div>
    </article>
  );
}
