import { useEffect, useRef, useState } from 'react';

// How long each tool call took, measured in the browser from the run's
// TOOL_CALL_START to its TOOL_CALL_RESULT event, keyed by tool call id.
// Frontend tools send no result event, so they never get a time: the panel
// shows only real measurements.
export function useToolTimings(agent) {
  const [timings, setTimings] = useState(() => new Map());
  const startedAt = useRef(new Map());

  useEffect(() => {
    if (!agent) return undefined;
    const { unsubscribe } = agent.subscribe({
      onToolCallStartEvent: ({ event }) => {
        startedAt.current.set(event.toolCallId, Date.now());
      },
      onToolCallResultEvent: ({ event }) => {
        const start = startedAt.current.get(event.toolCallId);
        if (start === undefined) return;
        startedAt.current.delete(event.toolCallId);
        setTimings((previous) => new Map(previous).set(event.toolCallId, Date.now() - start));
      },
    });
    return unsubscribe;
  }, [agent]);

  return timings;
}
