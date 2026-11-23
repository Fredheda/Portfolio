import { useEffect, useRef } from 'react';

export function useEventListener(target, type, handler, options) {
  const handlerRef = useRef(handler);
  const capture = options?.capture;
  const passive = options?.passive;

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const listenerOptions = { capture, passive };
    const listener = (event) => handlerRef.current(event);
    target.addEventListener(type, listener, listenerOptions);
    return () => target.removeEventListener(type, listener, listenerOptions);
  }, [target, type, capture, passive]);
}
