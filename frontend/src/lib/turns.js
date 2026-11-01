// Turns the agent's AG-UI message list into what the fredbot panel shows:
// the visitor's questions, and each text answer with the tool calls made
// since the previous question. Tool-call-only assistant messages and tool
// results get no line of their own.
export function groupTurns(messages) {
  const turns = [];
  let pendingTools = [];

  for (const message of messages) {
    if (message.role === 'user') {
      pendingTools = [];
      if (typeof message.content === 'string' && message.content.length > 0) {
        turns.push({ id: message.id, role: 'user', content: message.content, tools: [] });
      }
      continue;
    }
    if (message.role !== 'assistant') continue;

    for (const call of message.toolCalls ?? []) {
      pendingTools.push({ id: call.id, name: call.function?.name ?? 'tool' });
    }
    if (typeof message.content === 'string' && message.content.length > 0) {
      turns.push({ id: message.id, role: 'assistant', content: message.content, tools: pendingTools });
      pendingTools = [];
    }
  }
  return turns;
}

export const formatSeconds = (ms) => `${(ms / 1000).toFixed(1)} s`;
