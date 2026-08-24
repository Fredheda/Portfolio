import { useFrontendTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';
import { useAgentUI } from '../context/AgentUIContext';
import { normalizeSpec, validateSpec } from '../lib/vega-spec';
import siteContent from '../../../content/site-content.json';

const KNOWN_IDS = siteContent.projects.map((p) => p.id);

export default function AgentTools() {
  const { setHighlightedProjectIds, setExpandedProjectId, setSkillsChartSpec } = useAgentUI();

  useFrontendTool({
    name: 'highlightProjects',
    description:
      "Scroll to and highlight one or more project cards on the page, by id. " +
      `Known ids: ${KNOWN_IDS.join(', ')}.`,
    parameters: z.object({
      ids: z.array(z.string()).describe('Project ids to highlight.'),
    }),
    handler: async ({ ids }) => {
      const valid = ids.filter((id) => KNOWN_IDS.includes(id));
      if (valid.length === 0) {
        return `Error: none of [${ids.join(', ')}] are known project ids. Known ids: ${KNOWN_IDS.join(', ')}.`;
      }
      setHighlightedProjectIds(valid);
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return `Highlighted: ${valid.join(', ')}.`;
    },
  });

  useFrontendTool({
    name: 'renderProjectCard',
    description: 'Open a richer detail panel for one project, docked under its card on the page.',
    parameters: z.object({
      projectId: z.string().describe('The project id to show details for.'),
    }),
    handler: async ({ projectId }) => {
      if (!KNOWN_IDS.includes(projectId)) {
        return `Error: no project with id '${projectId}'. Known ids: ${KNOWN_IDS.join(', ')}.`;
      }
      setExpandedProjectId(projectId);
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return `Opened detail panel for ${projectId}.`;
    },
  });

  useFrontendTool({
    name: 'renderSkillsChart',
    description:
      'Draw a Vega-Lite v5 chart into the Skills & Expertise section. Only chart ' +
      'real counts derived from the skill categories/groups shown on the page — ' +
      'never invented proficiency scores. Inline data under data.values; omit ' +
      'width/height.',
    parameters: z.object({
      spec: z.record(z.string(), z.any()).describe('A Vega-Lite v5 specification object.'),
    }),
    handler: async ({ spec }) => {
      const problem = validateSpec(spec);
      if (problem) {
        return `Error: that Vega-Lite spec is invalid and was not rendered (${problem}). Fix the spec and call renderSkillsChart again.`;
      }
      setSkillsChartSpec(normalizeSpec(spec));
      document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return 'Chart rendered in the Skills & Expertise section.';
    },
  });

  return null;
}
