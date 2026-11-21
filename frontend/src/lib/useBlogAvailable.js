import { useEffect, useState } from 'react';
import { listPosts } from './blogApi';

// A cold read API takes about 30 s to answer the first request after an idle
// spell, so a failed request is tried again after these delays.
export const RETRY_DELAYS_MS = [5_000, 15_000, 30_000];

// True once the blog API answers with at least one post. The header mounts
// once per page load, so this is one request per load (the backend caches
// the list for 15 s), plus the retries above after a failure. An empty list
// and a blog that is switched off (404) are answers, not failures: they mean
// false and are not asked again. A request that never answers waits for no
// retry, and the header shows nothing and waits for nothing meanwhile.
export function useBlogAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    const ask = (retry) => {
      listPosts({ limit: 1, signal: controller.signal }).then(
        (page) => setAvailable(page.items.length > 0),
        (error) => {
          if (controller.signal.aborted || error?.off || retry >= RETRY_DELAYS_MS.length) return;
          timer = setTimeout(() => ask(retry + 1), RETRY_DELAYS_MS[retry]);
        },
      );
    };
    ask(0);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  return available;
}
