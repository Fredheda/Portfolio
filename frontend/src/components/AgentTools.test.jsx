import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import siteContent from '../../content/site-content.json';
import AgentTools from './AgentTools';

const agentUI = vi.hoisted(() => ({
  setHighlightedProjectIds: vi.fn(),
  setExpandedProjectId: vi.fn(),
}));
const registered = vi.hoisted(() => ({ tools: {} }));

vi.mock('../context/AgentUIContext', () => ({ useAgentUI: () => agentUI }));
vi.mock('@copilotkit/react-core/v2', () => ({
  useFrontendTool: (tool) => {
    registered.tools[tool.name] = tool;
  },
}));

const knownId = siteContent.projects[0].id;

beforeEach(() => {
  agentUI.setHighlightedProjectIds.mockReset();
  agentUI.setExpandedProjectId.mockReset();
  registered.tools = {};
  document.body.innerHTML = '<div id="projects"></div>';
});

describe('AgentTools', () => {
  it('highlightProjects highlights known ids and scrolls to the projects section', async () => {
    render(<AgentTools />);
    const result = await registered.tools.highlightProjects.handler({ ids: [knownId, 'nope'] });

    expect(agentUI.setHighlightedProjectIds).toHaveBeenCalledWith([knownId]);
    expect(result).toBe(`Highlighted: ${knownId}.`);
    expect(document.getElementById('projects').scrollIntoView).toHaveBeenCalled();
  });

  it('highlightProjects returns an error when no id is known', async () => {
    render(<AgentTools />);
    const result = await registered.tools.highlightProjects.handler({ ids: ['nope'] });

    expect(agentUI.setHighlightedProjectIds).not.toHaveBeenCalled();
    expect(result).toContain('Error: none of [nope] are known project ids.');
  });

  it('renderProjectCard expands a known project', async () => {
    render(<AgentTools />);
    const result = await registered.tools.renderProjectCard.handler({ projectId: knownId });

    expect(agentUI.setExpandedProjectId).toHaveBeenCalledWith(knownId);
    expect(result).toBe(`Opened detail panel for ${knownId}.`);
  });

  it('renderProjectCard rejects an unknown project', async () => {
    render(<AgentTools />);
    const result = await registered.tools.renderProjectCard.handler({ projectId: 'nope' });

    expect(agentUI.setExpandedProjectId).not.toHaveBeenCalled();
    expect(result).toContain("Error: no project with id 'nope'.");
  });
});
