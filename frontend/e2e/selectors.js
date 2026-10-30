// Every locator the specs need that is not a role or text locator. ESLint
// rejects `.locator(` in spec files, so a class rename is a change here only.

export const terminalInput = (page) => page.getByPlaceholder('ask me anything...');

// Projects.jsx marks a highlighted card with a ring.
export const highlightedCards = (page) => page.locator('#projects a.ring-2');
