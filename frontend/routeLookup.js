// The route-meta entry for a request path, or undefined when the path is not
// a route. Own properties only: a plain object also answers for names every
// object inherits ("constructor", "__proto__", "toString"), and those must
// never count as a known route.
export function lookupRoute(routeMeta, pathname) {
  return Object.hasOwn(routeMeta, pathname) ? routeMeta[pathname] : undefined;
}
