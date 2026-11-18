"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let animation: Animation | undefined;
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      animation = element.animate([
        { opacity: 0, transform: "translateY(22px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 650, delay, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
      observer.disconnect();
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => { observer.disconnect(); animation?.cancel(); };
  }, [delay]);
  return <div ref={ref}>{children}</div>;
}
