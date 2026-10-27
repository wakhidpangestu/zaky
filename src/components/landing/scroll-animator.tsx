'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface ScrollAnimatorProps {
  children: React.ReactNode;
}

export default function ScrollAnimator({ children }: ScrollAnimatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only in browser and if reduced motion is false
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Elemen yang sudah berada di dalam viewport awal TIDAK dianimasikan:
      // menyembunyikannya (opacity 0) lalu memunculkannya perlahan menahan
      // Speed Index dan menimbulkan kedip. Animasi hanya untuk konten di
      // bawah lipatan layar yang memang belum terlihat pengguna.
      const viewportH = window.innerHeight;
      const inInitialView = (el: Element) => el.getBoundingClientRect().top < viewportH * 1.05;

      // 1. Reveal Elements with fade-up and subtle scale
      const revealElements = document.querySelectorAll('.gsap-fade-up');
      revealElements.forEach((el) => {
        if (inInitialView(el)) return;
        gsap.fromTo(
          el,
          {
            opacity: 0,
            y: 35,
            scale: 0.98,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // 2. Stagger Groups (cards, grid items)
      const staggerGroups = document.querySelectorAll('.gsap-stagger-group');
      staggerGroups.forEach((group) => {
        if (inInitialView(group)) return;
        const items = group.querySelectorAll('.gsap-stagger-item');
        if (items.length > 0) {
          gsap.fromTo(
            items,
            {
              opacity: 0,
              y: 40,
              scale: 0.96,
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              stagger: 0.12,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: group,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      });

      // 3. Parallax elements on scroll
      const parallaxItems = document.querySelectorAll('.gsap-parallax');
      parallaxItems.forEach((item) => {
        gsap.to(item, {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: item,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
