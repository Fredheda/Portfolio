import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { content } from '../lib/content';

const { profile, about } = content;

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <article className="hero-wash">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="max-w-[65ch]">
          <h1 className="m-0 font-serif text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
            {profile.name}
          </h1>
          <p className="mt-4 text-lg text-muted">{profile.now}</p>
          <div className="mt-8 space-y-5 text-[1.05rem] leading-[1.7] [&_a]:text-royal [&_a]:underline">
            {about.paragraphs.map((paragraph) => (
              <ReactMarkdown key={paragraph}>{paragraph}</ReactMarkdown>
            ))}
          </div>
        </div>
        <img
          src={profile.photo.src}
          srcSet={`${profile.photo.src} ${profile.photo.width}w, ${profile.photo.srcLarge} ${profile.photo.width * 2}w`}
          sizes="(min-width: 1024px) 320px, 100vw"
          alt={profile.photo.alt}
          width={profile.photo.width}
          height={profile.photo.height}
          loading="lazy"
          decoding="async"
          className="h-auto w-full max-w-[320px] rounded-xl border border-line object-cover lg:order-none"
        />
      </div>
    </article>
  );
}
