import { motion } from 'framer-motion';

const projects = [
  {
    title: "Paper Podcasts",
    description: "An agentic research assistant that autonomously downloads and processes academic papers, generating podcast-style audio summaries. Built with Python using agentic AI patterns.",
    link: "https://github.com/Fredheda/paper-podcasts",
    categories: ["Agentic AI", "Python", "LLM"],
    icon: "fa-podcast",
    accent: 'cyan',
    featured: true,
  },
  {
    title: "TFL MCP Server",
    description: "A Model Context Protocol (MCP) server that exposes real-time Transport for London data to AI assistants, enabling natural language queries about tube lines, disruptions and service status.",
    link: "https://github.com/Fredheda/tfl-mcp",
    categories: ["MCP", "Python", "API"],
    icon: "fa-train",
    accent: 'violet',
  },
  {
    title: "MCP Client",
    description: "A lightweight Python client for interacting with Model Context Protocol (MCP) servers, enabling AI agents to discover and invoke tools exposed over the MCP standard.",
    link: "https://github.com/Fredheda/mcp-client",
    categories: ["MCP", "Python", "Agentic AI"],
    icon: "fa-plug",
    accent: 'violet',
  },
  {
    title: "SHAP — Open Source Contribution",
    description: "Contributed to SHAP (SHapley Additive exPlanations), the leading open-source library for explaining machine learning model outputs using game-theoretic approaches.",
    link: "https://github.com/Fredheda/shap",
    categories: ["Open Source", "ML", "Explainability"],
    icon: "fa-code-branch",
    accent: 'gold',
  }
];

const accentMap = {
  cyan: {
    pill: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
    border: 'border-accent-cyan/20 hover:border-accent-cyan/50',
    gradient: 'from-cyan-500/5 via-zinc-800/95 to-zinc-900',
    glow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]',
    titleHover: 'group-hover:text-accent-cyan',
    iconColor: 'text-accent-cyan',
  },
  violet: {
    pill: 'bg-accent-violet/10 text-accent-violet border-accent-violet/20',
    border: 'border-accent-violet/20 hover:border-accent-violet/50',
    gradient: 'from-violet-500/5 via-zinc-800/95 to-zinc-900',
    glow: 'hover:shadow-[0_0_30px_rgba(167,139,250,0.15)]',
    titleHover: 'group-hover:text-accent-violet',
    iconColor: 'text-accent-violet',
  },
  gold: {
    pill: 'bg-amber-400/10 text-accent-gold border-amber-400/20',
    border: 'border-amber-400/20 hover:border-amber-400/50',
    gradient: 'from-amber-400/5 via-zinc-800/95 to-zinc-900',
    glow: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]',
    titleHover: 'group-hover:text-accent-gold',
    iconColor: 'text-accent-gold',
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const Projects = () => {
  const featured = projects[0];
  const rest = projects.slice(1);
  const featuredColors = accentMap[featured.accent];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      id="projects"
      className="bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900 px-6 md:px-12 py-8 rounded-[15px] max-w-[1200px] mx-auto mb-12 relative overflow-hidden scroll-mt-20"
    >
      <motion.h2
        custom={0}
        variants={cardVariant}
        className="font-heading text-2xl font-bold tracking-tight text-left text-white mb-8 flex items-center"
      >
        <i className="fas fa-rocket mr-4 gradient-text" style={{ WebkitTextFillColor: 'unset' }} />
        Featured Projects
      </motion.h2>

      {/* Featured project — full width */}
      <motion.div custom={0} variants={cardVariant} className="mb-6">
        <a
          href={featured.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`group block bg-gradient-to-br ${featuredColors.gradient} rounded-xl border ${featuredColors.border} transition-all duration-500 hover:-translate-y-1 ${featuredColors.glow} no-underline`}
        >
          <div className="p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                {featured.categories.map((cat, i) => (
                  <span key={i} className={`text-xs px-2 py-1 rounded-full border ${featuredColors.pill}`}>{cat}</span>
                ))}
              </div>
              <h3 className={`text-2xl md:text-3xl text-white font-bold mb-3 ${featuredColors.titleHover} transition-colors duration-300`}>
                {featured.title}
              </h3>
              <p className="text-zinc-300 text-base leading-relaxed mb-4">
                {featured.description}
              </p>
              <span className="inline-flex items-center text-sm text-white font-semibold py-2 px-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 group-hover:border-accent-cyan/50 transition-all duration-300">
                <i className="fab fa-github mr-2" />
                View Project
                <i className="fas fa-arrow-right ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </span>
            </div>
            <div className="shrink-0 flex items-center justify-center">
              <i className={`fas ${featured.icon} ${featuredColors.iconColor} text-5xl md:text-6xl group-hover:scale-110 transition-transform duration-300`} />
            </div>
          </div>
        </a>
      </motion.div>

      {/* Remaining projects — grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rest.map((project, index) => {
          const colors = accentMap[project.accent];
          return (
            <motion.div key={index} custom={index + 1} variants={cardVariant}>
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block h-full bg-gradient-to-br ${colors.gradient} rounded-xl border ${colors.border} transition-all duration-500 hover:-translate-y-1 ${colors.glow} no-underline`}
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-lg text-white font-semibold ${colors.titleHover} transition-colors duration-300`}>
                      {project.title}
                    </h3>
                    <i className={`fas ${project.icon} ${colors.iconColor} text-xl group-hover:scale-110 transition-transform duration-300`} />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.categories.map((category, i) => (
                      <span key={i} className={`text-xs px-2 py-1 rounded-full border ${colors.pill}`}>
                        {category}
                      </span>
                    ))}
                  </div>

                  <p className="text-zinc-300 text-sm leading-relaxed flex-grow">
                    {project.description}
                  </p>

                  <div className="mt-6">
                    <span className="inline-flex items-center text-sm text-white font-semibold py-2 px-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 group-hover:border-zinc-500/50 transition-all duration-300">
                      <i className="fab fa-github mr-2" />
                      View Project
                      <i className="fas fa-arrow-right ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </span>
                  </div>
                </div>
              </a>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};

export default Projects;
