import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// @copilotkit/react-core/v2's own entry module does `import "./index.css"`
// internally as a side effect (unconditionally, regardless of how this app
// imports CopilotKit) -- that file is CopilotKit's pre-built Tailwind
// output, containing `@layer base` with no local `@tailwind base;` marker
// of its own, which this project's Tailwind config errors on when it tries
// to reprocess it. The actual stylesheet is loaded separately in main.jsx
// via a `?raw` import and injected as a <style> tag; this plugin only
// stubs out the package's own internal, unqueried import so Vite's default
// CSS/PostCSS pipeline never touches it.
//
// Needed in TWO forms: this Rollup-style plugin (resolveId/load) covers
// `vite build`, but `vite dev` pre-bundles @copilotkit/react-core via
// esbuild *before* this hook ever runs, so the CSS error still surfaced in
// dev even with this plugin present. The obvious fix -- excluding the
// package from optimizeDeps so it skips pre-bundling entirely -- broke
// esbuild's CJS->ESM interop for its transitive deps instead (confirmed
// live: `style-to-js`, pulled in by CopilotKit's markdown rendering,
// failed with "does not provide an export named 'default'" once excluded).
// So the package stays included in pre-bundling (interop stays intact),
// and an equivalent esbuild plugin (below) does the same stub *during*
// that pre-bundling pass instead of skipping it.
function stubCopilotKitV2Css() {
  const virtualId = '\0copilotkit-v2-css-stub';
  return {
    name: 'stub-copilotkit-v2-css',
    enforce: 'pre',
    resolveId(source, importer) {
      if (
        source === './index.css' &&
        importer?.includes('@copilotkit/react-core/dist/v2/index.mjs')
      ) {
        return virtualId;
      }
    },
    load(id) {
      if (id === virtualId) {
        return '';
      }
    },
  };
}

function stubCopilotKitV2CssEsbuildPlugin() {
  return {
    name: 'stub-copilotkit-v2-css-esbuild',
    setup(build) {
      build.onResolve({ filter: /^\.\/index\.css$/ }, (args) => {
        if (args.importer.includes('@copilotkit/react-core/dist/v2/index.mjs')) {
          return { path: args.path, namespace: 'copilotkit-v2-css-stub' };
        }
      });
      build.onLoad({ filter: /.*/, namespace: 'copilotkit-v2-css-stub' }, () => ({
        contents: '',
        loader: 'css',
      }));
    },
  };
}

export default defineConfig({
  plugins: [stubCopilotKitV2Css(), react()],
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [stubCopilotKitV2CssEsbuildPlugin()],
    },
  },
  server: {
    open: true,
  },
});