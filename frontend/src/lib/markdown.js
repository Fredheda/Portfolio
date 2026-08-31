// The agent is instructed (see backend/agent/system_prompt.md) to write math
// using `$...$` / `$$...$$`, since that's all `rehype-katex` recognizes --
// but LLMs sometimes fall back to LaTeX's `\( ... \)` / `\[ ... \]` bracket
// delimiters anyway, which would otherwise render as literal escaped text
// instead of a typeset equation. Convert those into the dollar-sign forms
// before handing text to ReactMarkdown, as a rendering-side fallback for
// whatever the model actually produces.
export function normalizeMathDelimiters(text) {
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expr) => `$$${expr}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, expr) => `$${expr}$`);
}
