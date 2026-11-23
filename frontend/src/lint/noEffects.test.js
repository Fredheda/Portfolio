import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import process from 'node:process';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { effectBaseline } from '../../eslint.config.js';

const FRONTEND = process.cwd();
const SRC = join(FRONTEND, 'src');
const EFFECTS_DIR = join(SRC, 'lib', 'effects');
const HOOK = /\buse(Layout|Insertion)?Effect\b/;
const TEST_FILE = /\.test\.jsx?$/;
const BANNED_RULES = new Set(['no-restricted-imports', 'no-restricted-syntax']);

const eslint = new ESLint({ cwd: FRONTEND });

const violations = {
  namedImport: 'import { useEffect } from "react";\nexport function C() { useEffect(() => {}); }\n',
  renamedImport: 'import { useEffect as e } from "react";\nexport function C() { e(() => {}); }\n',
  namespaceCall: 'import React from "react";\nexport function C() { React.useEffect(() => {}); }\n',
  layoutImport: 'import { useLayoutEffect } from "react";\nexport function C() { useLayoutEffect(() => {}); }\n',
  destructured: 'const { useEffect: e } = React;\nexport function C() { e(() => {}); }\n',
  destructuredKey: 'const { "useEffect": e } = React;\nexport function C() { e(() => {}); }\n',
};

const reexports = {
  namedReexport: 'export { useEffect } from "react";\n',
  allReexport: 'export * from "react";\n',
  aliasedExport: 'import { useEffect } from "react";\nexport { useEffect as useFx };\n',
};

async function bannedMessages(code, filePath) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((message) => BANNED_RULES.has(message.ruleId));
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sourceFiles = walk(SRC)
  .filter((path) => /\.jsx?$/.test(path) && !TEST_FILE.test(path))
  .filter((path) => !path.startsWith(EFFECTS_DIR + sep));

const relativePath = (path) => relative(FRONTEND, path).split(sep).join('/');

describe('effects rule', () => {
  it.each(Object.entries(violations))('flags %s outside src/lib/effects', async (_, code) => {
    const messages = await bannedMessages(code, join(SRC, 'components', 'Snippet.jsx'));
    expect(messages.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(violations))('allows %s inside src/lib/effects', async (_, code) => {
    const messages = await bannedMessages(code, join(EFFECTS_DIR, 'snippet.js'));
    expect(messages).toEqual([]);
  });

  it.each(Object.entries(reexports))('flags %s inside src/lib/effects', async (_, code) => {
    const messages = await bannedMessages(code, join(EFFECTS_DIR, 'snippet.js'));
    expect(messages.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(reexports))('flags %s outside src/lib/effects', async (_, code) => {
    const messages = await bannedMessages(code, join(SRC, 'components', 'Snippet.jsx'));
    expect(messages.length).toBeGreaterThan(0);
  });

  it('lists exactly the files that still call an effect hook', () => {
    const withHook = sourceFiles
      .filter((path) => HOOK.test(readFileSync(path, 'utf8')))
      .map(relativePath)
      .sort();
    expect(withHook).toEqual([...effectBaseline].sort());
  });

  it('has no eslint-disable for the effects rules in src', () => {
    const offenders = sourceFiles
      .filter((path) => /eslint-disable[^\n]*no-restricted-(imports|syntax)/.test(readFileSync(path, 'utf8')))
      .map(relativePath);
    expect(offenders).toEqual([]);
  });
});
