import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { content } from '../../lib/content';
import Projects from './Projects';

const mockState = vi.hoisted(() => ({
  highlightedProjectIds: [],
  expandedProjectId: null,
}));
vi.mock('../../context/AgentUIContext', () => ({ useAgentUI: () => mockState }));

const { projects } = content;

const renderProjects = () =>
  render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>,
  );

beforeEach(() => {
  mockState.highlightedProjectIds = [];
  mockState.expandedProjectId = null;
});

describe('Projects', () => {
  it('links each card to its project page with the plain-English line', () => {
    renderProjects();
    for (const project of projects) {
      const link = screen.getByRole('link', { name: new RegExp(project.title) });
      expect(link).toHaveAttribute('href', `/projects/${project.id}`);
      expect(link).toHaveTextContent(project.plainEnglish);
    }
  });

  it('rings the cards fredbot highlights', () => {
    mockState.highlightedProjectIds = [projects[0].id];
    renderProjects();
    expect(screen.getByRole('link', { name: new RegExp(projects[0].title) })).toHaveClass('ring-2');
    expect(screen.getByRole('link', { name: new RegExp(projects[1].title) })).not.toHaveClass('ring-2');
  });

  it('shows the tech line only under the expanded project', () => {
    mockState.expandedProjectId = projects[0].id;
    renderProjects();
    expect(screen.getByText(projects[0].techLine)).toBeInTheDocument();
    expect(screen.queryByText(projects[1].techLine)).not.toBeInTheDocument();
  });
});
