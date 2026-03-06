/**
 * Hook that observes elements and adds 'revealed' class when they enter viewport.
 * Uses native IntersectionObserver for zero-dependency scroll animations.
 *
 * @param options - IntersectionObserver options
 * @param options.threshold - Visibility threshold to trigger reveal (default 0.1)
 * @param options.rootMargin - Root margin for the observer (default "0px 0px -50px 0px")
 * @returns ref callback to attach to container element
 *
 * @example
 * ```tsx
 * const sectionRef = useScrollReveal();
 * return (
 *   <section ref={sectionRef}>
 *     <h2 className="scroll-reveal">Title</h2>
 *     <div className="scroll-reveal">Content</div>
 *   </section>
 * );
 * ```
 */
export { useScrollReveal };

export default function useScrollReveal(options?: {
  threshold?: number;
  rootMargin?: string;
}) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      // Clean up previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      containerRef.current = node;

      if (!node) return;

      const threshold = options?.threshold ?? 0.1;
      const rootMargin = options?.rootMargin ?? '0px 0px -50px 0px';

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        { threshold, rootMargin }
      );

      const targets = node.querySelectorAll(
        '.scroll-reveal, .scroll-reveal-left'
      );

      targets.forEach((target) => {
        observerRef.current?.observe(target);
      });
    },
    [options?.threshold, options?.rootMargin]
  );

  return ref;
}
