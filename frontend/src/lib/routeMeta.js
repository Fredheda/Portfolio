// Per-route <title> and link-preview tags. Built from the content file at
// build time (vite.config.mjs writes dist/route-meta.json), so server.js,
// whose image ships only dist/, needs no copy of the content.

export const SITE_ORIGIN = 'https://frederikheda.com';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

// Every path the server answers with a 200; anything else is a 404.
export function buildRouteMeta(content) {
  const { profile, projects } = content;
  const meta = {
    '/': { title: profile.name, description: profile.claim },
    '/about': { title: `About ${profile.name}`, description: profile.claim },
    '/privacy-policy': {
      title: `Privacy policy · ${profile.name}`,
      description: `How ${profile.name}'s site handles your data.`,
    },
  };
  for (const project of projects) {
    meta[`/projects/${project.id}`] = {
      title: `${project.title} · ${profile.name}`,
      description: project.plainEnglish,
    };
  }
  return meta;
}

export function renderHead({ title, description, url, image }) {
  const [t, d, u, i] = [title, description, url, image].map(escapeHtml);
  return [
    `<meta name="description" content="${d}">`,
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:url" content="${u}">`,
    `<meta property="og:image" content="${i}">`,
    '<meta name="twitter:card" content="summary_large_image">',
  ].join('\n  ');
}

// What dist/route-meta.json holds: per path, the escaped title and the
// head tags to put at the <!--route-meta--> marker.
export function routeHeads(content) {
  const image = `${SITE_ORIGIN}${content.profile.photo.srcLarge}`;
  return Object.fromEntries(
    Object.entries(buildRouteMeta(content)).map(([path, { title, description }]) => [
      path,
      {
        title: escapeHtml(title),
        head: renderHead({ title, description, url: `${SITE_ORIGIN}${path === '/' ? '' : path}`, image }),
      },
    ]),
  );
}
