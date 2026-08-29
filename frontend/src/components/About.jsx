import { VegaEmbed } from 'react-vega';
import { useAgentUI } from '../context/AgentUIContext';
import siteContent from '../../content/site-content.json';

const skills = siteContent.skillCategories.flatMap((category) =>
  category.groups.flatMap((group) => group.items)
);

const About = () => {
  const { skillsChartSpec } = useAgentUI();

  return (
    <section id="skills" className="max-w-[1200px] mx-auto mb-12 px-2 scroll-mt-20">
      <div className="font-mono text-xs text-zinc-500 mb-4 tracking-wide">$ cat skills.txt</div>

      {skillsChartSpec && (
        <div className="mb-6 p-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
          <VegaEmbed spec={skillsChartSpec} options={{ actions: false }} className="w-full" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors duration-200"
          >
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
};

export default About;
