// Every locator the specs need that is not a role or text locator. ESLint
// rejects `.locator(` in spec files, so a class rename is a change here only.

export const terminalInput = (page) => page.getByPlaceholder('ask me anything...');

// The drawn architecture diagram on a case-study page (Diagram.jsx).
export const diagramSvg = (page) => page.locator('figure[aria-label="Architecture diagram"] svg');

// Projects.jsx marks a highlighted card with a ring.
export const highlightedCards = (page) => page.locator('#projects a.ring-2');
