import siteContent from '../../content/site-content.json';
import { useAgentUI } from '../context/AgentUIContext';

const projects = siteContent.projects;

const Projects = () => {
  const { highlightedProjectIds, expandedProjectId } = useAgentUI();

  return (
    <section id="projects" className="max-w-[1200px] mx-auto mb-12 px-2 scroll-mt-20">
      <div className="font-mono text-xs text-zinc-500 mb-4 tracking-wide">$ ls projects/</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {projects.map((project) => (
          <div key={project.id}>
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`group block bg-zinc-900/80 border rounded-lg p-4 transition-all duration-300 hover:border-zinc-500 no-underline ${
                highlightedProjectIds.includes(project.id)
                  ? 'border-white/70 ring-2 ring-white/40 ring-offset-2 ring-offset-surface-950'
                  : 'border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-white font-semibold group-hover:text-zinc-200">{project.title}</h3>
                <i className={`fas ${project.icon} text-zinc-500 text-sm`} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {project.categories.map((category) => (
                  <span key={category} className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-400">
                    {category}
                  </span>
                ))}
              </div>
            </a>
            {expandedProjectId === project.id && (
              <div className="mt-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
                <p>{project.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Projects;
