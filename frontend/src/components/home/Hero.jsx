import { Link } from 'react-router-dom';
import { content } from '../../lib/content';
import HeroGraph from './HeroGraph';

const { profile } = content;

export default function Hero() {
  return (
    <section className="hero-wash">
      <div className="mx-auto grid max-w-page items-center gap-10 px-4 pb-12 pt-14 md:px-6 md:pt-20 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <h1 className="m-0 max-w-[16ch] font-serif text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
            {profile.claim}
          </h1>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted">{profile.now}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={profile.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-royal px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-ink"
            >
              LinkedIn
            </a>
            <a
              href={profile.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink no-underline hover:border-royal"
            >
              GitHub
            </a>
            <Link
              to="/#fredbot"
              className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink no-underline hover:border-royal"
            >
              Ask fredbot
            </Link>
          </div>
        </div>
        <HeroGraph />
      </div>
    </section>
  );
}
