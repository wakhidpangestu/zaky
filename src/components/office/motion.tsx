'use client';
import { useEffect, useRef, useState } from 'react';

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Animates a number from its previous value to `target` (ease-out cubic).
 * Every later change animates from the shown value, so numbers follow live data.
 */
export function useCountUp(target: number, duration = 750) {
  const [value, setValue] = useState(0);
  const shown = useRef(0);
  useEffect(() => {
    const from = shown.current;
    if (prefersReduced() || from === target) {
      shown.current = target;
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const next = from + (target - from) * (1 - (1 - t) ** 3);
      shown.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

/** A number that counts toward its value; `format` renders the in-between frames too. */
export function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString('id-ID'),
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const shown = useCountUp(value);
  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
