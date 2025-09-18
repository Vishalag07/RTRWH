import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useLazyLoad = (options: UseLazyLoadOptions = {}) => {
  const { threshold = 0.1, rootMargin = '50px', triggerOnce = true } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    const isVisible = entry.isIntersecting;
    
    setIsIntersecting(isVisible);
    
    if (isVisible && triggerOnce) {
      setHasIntersected(true);
    }
  }, [triggerOnce]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [handleIntersection, threshold, rootMargin]);

  return {
    elementRef,
    isIntersecting,
    hasIntersected: triggerOnce ? hasIntersected : isIntersecting,
  };
};

export default useLazyLoad;
