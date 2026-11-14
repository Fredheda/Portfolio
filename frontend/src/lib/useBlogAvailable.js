import { useEffect, useState } from 'react';
import { listPosts } from './blogApi';

// True once the blog API answers with at least one post. The header mounts
// once per page load, so this is one request per load (the backend caches
// the list for 60 s). A blog that is switched off (404), an API that is
// down, an empty list, a request that never answers: all mean false, and
// the header shows nothing and waits for nothing.
export function useBlogAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listPosts({ limit: 1, signal: controller.signal }).then(
      (page) => setAvailable(page.items.length > 0),
      () => {},
    );
    return () => controller.abort();
  }, []);

  return available;
}
