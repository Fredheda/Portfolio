import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import siteContent from '../../content/site-content.json';
import Projects from './Projects';

const mockState = vi.hoisted(() => ({
  highlightedProjectIds: [],
  expandedProjectId: null,
}));
vi.mock('../context/AgentUIContext', () => ({ useAgentUI: () => mockState }));

const projects = siteContent.projects;

beforeEach(() => {
  mockState.highlightedProjectIds = [];
  mockState.expandedProjectId = null;
});

describe('Projects', () => {
  it('renders a card for every project, linking out safely', () => {
    render(<Projects />);
    for (const project of projects) {
      const link = screen.getByRole('link', { name: new RegExp(project.title) });
      expect(link).toHaveAttribute('href', project.link);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('shows the categories of a project', () => {
    render(<Projects />);
    const first = projects[0];
    for (const category of first.categories) {
      expect(screen.getAllByText(category).length).toBeGreaterThan(0);
    }
  });

  it('shows the description only for the expanded project', () => {
    mockState.expandedProjectId = projects[0].id;
    render(<Projects />);
    expect(screen.getByText(projects[0].description)).toBeInTheDocument();
    expect(screen.queryByText(projects[1].description)).not.toBeInTheDocument();
  });
});
