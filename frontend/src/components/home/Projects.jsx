import { Link } from 'react-router-dom';
import { useAgentUI } from '../../context/AgentUIContext';
import { content } from '../../lib/content';
import Section from './Section';

// Case-study cards. fredbot's highlightProjects rings a card (ring-2; the
// e2e selector relies on it) and renderProjectCard opens the tech line.
export default function Projects() {
  const { highlightedProjectIds, expandedProjectId } = useAgentUI();

  return (
    <Section id="projects" title="Projects">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {content.projects.map((project) => (
          <div key={project.id} className="flex flex-col">
            <Link
              to={`/projects/${project.id}`}
              className={`flex flex-1 flex-col gap-2 rounded-xl border bg-white p-5 text-ink no-underline transition-colors hover:border-royal ${
                highlightedProjectIds.includes(project.id) ? 'border-royal ring-2 ring-royal/40' : 'border-line'
              }`}
            >
              <h3 className="m-0 text-base font-semibold">{project.title}</h3>
              <p className="m-0 leading-relaxed">{project.plainEnglish}</p>
              <span className="mt-auto flex flex-wrap gap-1.5 pt-2">
                {project.categories.map((category) => (
                  <span key={category} className="rounded-full bg-[#e8eef9] px-2.5 py-0.5 text-xs font-medium text-royal">
                    {category}
                  </span>
                ))}
              </span>
            </Link>
            {expandedProjectId === project.id && (
              <p className="mt-2 rounded-xl border border-line bg-white p-4 text-sm text-muted">{project.techLine}</p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
