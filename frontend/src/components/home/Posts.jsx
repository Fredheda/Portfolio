import { content } from '../../lib/content';
import { postAge } from '../../lib/postAge';
import Section from './Section';

const MAX_TEXT = 300;

const shorten = (text) => (text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT).trimEnd()}…` : text);

const initials = (name) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

// LinkedIn-style cards for the owner's recent posts, from the content file
// (LinkedIn has no API for a person's own posts). Newest first.
export default function Posts({ posts = content.posts, now = new Date() }) {
  const { profile, postsUrl } = content;
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Section
      id="posts"
      title="Recent posts"
      aside={
        <a href={postsUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-royal">
          See all on LinkedIn
        </a>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((post) => {
          const age = postAge(post.date, now);
          return (
            <article key={post.id} className="flex">
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full flex-col gap-3 rounded-xl border border-line bg-white p-4 text-ink no-underline hover:border-royal"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white"
                  >
                    {initials(profile.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{profile.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {profile.headline}
                      {age && ` · ${age}`}
                    </span>
                  </span>
                </div>
                <p className="m-0 break-words text-sm leading-relaxed">{shorten(post.text)}</p>
                <span className="mt-auto flex justify-between text-xs text-muted">
                  <span>{post.reactions} reactions</span>
                  <span>{post.comments} comments</span>
                </span>
              </a>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
