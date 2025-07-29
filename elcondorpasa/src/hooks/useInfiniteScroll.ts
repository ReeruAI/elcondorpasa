// hooks/useInfiniteScroll.ts
import { useState, useEffect, useCallback, useRef } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export const useInfiniteScroll = (
  callback: () => void,
  options: UseInfiniteScrollOptions = {}
) => {
  const { threshold = 0.1, rootMargin = "100px" } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current = observer;
    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [target, callback, threshold, rootMargin]);

  const setTargetRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current && target) {
        observerRef.current.unobserve(target);
      }
      setTarget(node);
    },
    [target]
  );

  return setTargetRef;
};
