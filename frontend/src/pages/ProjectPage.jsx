import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useParams } from 'react-router-dom';
import Diagram from '../components/Diagram';
import { content } from '../lib/content';
import { useEngineerMode } from '../lib/useEngineerMode';
import NotFound from './NotFound';

const prose = 'break-words text-[1.05rem] leading-[1.7] [&_a]:text-royal [&_a]:underline [&_p]:m-0';

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="m-0 font-serif text-2xl font-semibold tracking-[-0.01em]">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Md({ children, className = prose }) {
  return (
    <div className={className}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

export default function ProjectPage() {
  const { slug } = useParams();
  const [forEngineers, toggleEngineers] = useEngineerMode();
  const project = content.projects.find((p) => p.id === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!project) return <NotFound />;

  const { caseStudy } = project;

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
        <button
          type="button"
          aria-pressed={forEngineers}
          onClick={toggleEngineers}
          className={`mt-6 rounded-lg border px-4 py-2 text-sm font-semibold ${
            forEngineers ? 'border-royal bg-royal text-white' : 'border-line bg-white text-ink hover:border-royal'
          }`}
        >
          For engineers
        </button>

        <div className="max-w-[65ch]">
          <Section title="The problem">
            <Md>{caseStudy.problem}</Md>
          </Section>
          <Section title="What I built">
            <Md>{caseStudy.built}</Md>
          </Section>
          {forEngineers && (
            <Section title="How it's built">
              <Md className={`${prose} text-muted`}>{project.techLine}</Md>
              {caseStudy.architecture && <Diagram source={caseStudy.architecture} />}
            </Section>
          )}
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-block rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink no-underline hover:border-royal"
            >
              Code on GitHub
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
