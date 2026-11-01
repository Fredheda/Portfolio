import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { content } from '../lib/content';
import NotFound from './NotFound';

// Phase 1 stub: the case study itself (problem, decisions, "try it") comes in
// phase 2. The page exists now so project links and previews have a URL.
export default function ProjectPage() {
  const { slug } = useParams();
  const project = content.projects.find((p) => p.id === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!project) return <NotFound />;

  return (
    <article className="hero-wash">
      <div className="mx-auto max-w-page px-4 py-14 md:px-6 md:py-20">
        <Link to="/#projects" className="text-sm font-semibold text-royal">
          All projects
        </Link>
        <h1 className="mt-4 font-serif text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
          {project.title}
        </h1>
        <p className="mt-4 max-w-[60ch] text-xl leading-relaxed">{project.plainEnglish}</p>
        <p className="mt-2 max-w-[60ch] text-muted">{project.techLine}</p>
        <p className="mt-10 max-w-[60ch] rounded-xl border border-line bg-white p-5 text-muted">
          The full case study is on its way: the problem, the decisions and trade-offs, and a way to try it.
        </p>
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink no-underline hover:border-royal"
          >
            Code on GitHub
          </a>
        )}
      </div>
    </article>
  );
}
