import { useState } from 'react';

const KEY = 'portfolio.forEngineers';

// Storage can be missing or blocked (private windows, blocked site data), so
// every access is guarded and the toggle still works for the page view.
function read() {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function write(on) {
  try {
    if (on) sessionStorage.setItem(KEY, '1');
    else sessionStorage.removeItem(KEY);
  } catch {
    // Kept in state only.
  }
}

// [on, toggle]. The initial value is read synchronously so a reload or deep
// link shows the engineer detail at once, with no flash of the hidden state.
export function useEngineerMode() {
  const [on, setOn] = useState(read);
  const toggle = () => {
    const next = !on;
    write(next);
    setOn(next);
  };
  return [on, toggle];
}
