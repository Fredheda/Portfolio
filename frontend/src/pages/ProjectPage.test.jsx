import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Link, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { content } from '../lib/content';
import ProjectPage from './ProjectPage';

// The drawing itself is covered by Diagram.test.jsx and the browser test.
vi.mock('../components/Diagram', () => ({ default: ({ source }) => <pre data-testid="diagram">{source}</pre> }));

const byId = (id) => content.projects.find((p) => p.id === id);
const podcasts = byId('paper-podcasts');
const canvas = byId('copilotkit-canvas');

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Link to="/projects/tfl-mcp-server">to tfl</Link>
      <Routes>
        <Route path="/projects/:slug" element={<ProjectPage />} />
      </Routes>
    </MemoryRouter>,
  );

const toggle = () => screen.getByRole('button', { name: 'For engineers' });

beforeEach(() => {
  sessionStorage.clear();
  window.scrollTo = vi.fn();
});

describe('ProjectPage', () => {
  it('leads with the title and the plain-English line', () => {
    renderAt(`/projects/${podcasts.id}`);
    expect(screen.getByRole('heading', { level: 1, name: podcasts.title })).toBeInTheDocument();
    const lead = screen.getByText(podcasts.plainEnglish);
    const firstSection = screen.getAllByRole('heading', { level: 2 })[0];
    expect(lead.compareDocumentPosition(firstSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('link', { name: 'All projects' })).toHaveAttribute('href', '/#projects');
  });

  it('shows the problem and what was built, in that order', () => {
    renderAt(`/projects/${podcasts.id}`);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['The problem', 'What I built']);
    expect(screen.getByText(podcasts.caseStudy.problem)).toBeInTheDocument();
    expect(screen.getByText(podcasts.caseStudy.built)).toBeInTheDocument();
    expect(screen.queryByText(/case study is on its way/)).not.toBeInTheDocument();
  });

  it('hides the tech line and architecture until "For engineers" is pressed', async () => {
    renderAt(`/projects/${podcasts.id}`);
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('heading', { name: "How it's built" })).not.toBeInTheDocument();
    expect(screen.queryByText(podcasts.techLine)).not.toBeInTheDocument();

    await userEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { level: 2, name: "How it's built" })).toBeInTheDocument();
    expect(screen.getByText(podcasts.techLine)).toBeInTheDocument();
    expect(screen.getByTestId('diagram').textContent).toBe(podcasts.caseStudy.architecture);
  });

  it('keeps the toggle on and scrolls to the top when moving to another project', async () => {
    renderAt(`/projects/${podcasts.id}`);
    await userEvent.click(toggle());
    window.scrollTo.mockClear();
    await userEvent.click(screen.getByRole('link', { name: 'to tfl' }));
    expect(screen.getByRole('heading', { level: 1, name: byId('tfl-mcp-server').title })).toBeInTheDocument();
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('links to GitHub in a new tab when the repo is public', () => {
    renderAt(`/projects/${podcasts.id}`);
    const link = screen.getByRole('link', { name: 'Code on GitHub' });
    expect(link).toHaveAttribute('href', podcasts.link);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows no GitHub link and no empty Links heading when the repo is private', () => {
    renderAt(`/projects/${canvas.id}`);
    expect(screen.queryByRole('link', { name: 'Code on GitHub' })).not.toBeInTheDocument();
    expect(within(document.body).queryByRole('heading', { name: /links/i })).not.toBeInTheDocument();
  });
});
