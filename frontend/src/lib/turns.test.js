import { describe, expect, it } from 'vitest';
import { formatSeconds, groupTurns } from './turns';

const call = (id, name) => ({ id, type: 'function', function: { name, arguments: '{}' } });

describe('groupTurns', () => {
  it('attaches the tool calls before an answer to that answer', () => {
    const turns = groupTurns([
      { id: 'u1', role: 'user', content: 'show project details' },
      { id: 'a1', role: 'assistant', content: '', toolCalls: [call('c1', 'get_project_details')] },
      { id: 't1', role: 'tool', toolCallId: 'c1', content: '{}' },
      { id: 'a2', role: 'assistant', content: 'Done.' },
    ]);
    expect(turns).toEqual([
      { id: 'u1', role: 'user', content: 'show project details', tools: [] },
      { id: 'a2', role: 'assistant', content: 'Done.', tools: [{ id: 'c1', name: 'get_project_details' }] },
    ]);
  });

  it('collects several tool calls in order', () => {
    const turns = groupTurns([
      { id: 'u1', role: 'user', content: 'q' },
      { id: 'a1', role: 'assistant', content: '', toolCalls: [call('c1', 'list_projects')] },
      { id: 't1', role: 'tool', toolCallId: 'c1', content: '[]' },
      { id: 'a2', role: 'assistant', content: '', toolCalls: [call('c2', 'highlightProjects')] },
      { id: 't2', role: 'tool', toolCallId: 'c2', content: 'ok' },
      { id: 'a3', role: 'assistant', content: 'Here.' },
    ]);
    expect(turns[1].tools.map((t) => t.name)).toEqual(['list_projects', 'highlightProjects']);
  });

  it('does not carry tools over to the next question', () => {
    const turns = groupTurns([
      { id: 'u1', role: 'user', content: 'q1' },
      { id: 'a1', role: 'assistant', content: '', toolCalls: [call('c1', 'get_profile')] },
      { id: 't1', role: 'tool', toolCallId: 'c1', content: '{}' },
      { id: 'a2', role: 'assistant', content: 'One.' },
      { id: 'u2', role: 'user', content: 'q2' },
      { id: 'a3', role: 'assistant', content: 'Two.' },
    ]);
    expect(turns.at(-1)).toEqual({ id: 'a3', role: 'assistant', content: 'Two.', tools: [] });
  });
});

describe('formatSeconds', () => {
  it('shows one decimal and a unit', () => {
    expect(formatSeconds(2140)).toBe('2.1 s');
    expect(formatSeconds(80)).toBe('0.1 s');
  });
});
