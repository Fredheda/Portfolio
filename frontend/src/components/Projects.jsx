import React from 'react';
import { motion } from 'framer-motion';

const projects = [
  {
    title: "Paper Podcasts",
    description: "An agentic research assistant that autonomously downloads and processes academic papers, generating podcast-style audio summaries. Built with Python using agentic AI patterns.",
    link: "https://github.com/Fredheda/paper-podcasts",
    categories: ["Agentic AI", "Python", "LLM"],
    icon: "fa-podcast"
  },
  {
    title: "TFL MCP Server",
    description: "A Model Context Protocol (MCP) server that exposes real-time Transport for London data to AI assistants, enabling natural language queries about tube lines, disruptions and service status.",
    link: "https://github.com/Fredheda/tfl-mcp",
    categories: ["MCP", "Python", "API"],
    icon: "fa-train"
  },
  {
    title: "MCP Client",
    description: "A lightweight Python client for interacting with Model Context Protocol (MCP) servers, enabling AI agents to discover and invoke tools exposed over the MCP standard.",
    link: "https://github.com/Fredheda/mcp-client",
    categories: ["MCP", "Python", "Agentic AI"],
    icon: "fa-plug"
  },
  {
    title: "SHAP — Open Source Contribution",
    description: "Contributed to SHAP (SHapley Additive exPlanations), the leading open-source library for explaining machine learning model outputs using game-theoretic approaches.",
    link: "https://github.com/Fredheda/shap",
    categories: ["Open Source", "ML", "Explainability"],
    icon: "fa-code-branch"
  }
];

const Projects = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      id="projects"
      className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-12 py-8 rounded-[15px] max-w-[1200px] mx-auto mb-12 font-montserrat relative overflow-hidden scroll-mt-20"
    >
      <h2 className="font-montserrat text-2xl font-bold tracking-tight text-left text-white mb-8 flex items-center">
        <i className="fas fa-rocket mr-4 text-sky-400"></i>
        Featured Projects
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project, index) => (
          <div
            key={index}
            className="group bg-gradient-to-br from-sky-400/5 via-zinc-800/95 to-zinc-900 rounded-xl border border-sky-400/20 hover:border-sky-400/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl text-white font-semibold group-hover:text-sky-400 transition-colors duration-300">
                  {project.title}
                </h3>
                <i className={`fas ${project.icon} text-sky-400 text-xl group-hover:scale-110 transition-transform duration-300`}></i>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {project.categories.map((category, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-sky-400/10 text-sky-400 border border-sky-400/20">
                    {category}
                  </span>
                ))}
              </div>

              <p className="text-zinc-300 text-sm leading-relaxed flex-grow">
                {project.description}
              </p>

              <div className="mt-6">
                <a
                  href={project.link}
                  className="inline-flex items-center text-sm text-white font-semibold py-2 px-4 rounded-lg bg-zinc-800/50 hover:bg-sky-400/20 border border-sky-400/20 hover:border-sky-400/50 transition-all duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-github mr-2"></i>
                  View Project
                  <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

export default Projects;
