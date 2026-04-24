import { useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function motionOk(): boolean {
  if (typeof window === 'undefined') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export type LandingGsapRefs = {
  root?: RefObject<HTMLDivElement | null>;
  nav?: RefObject<HTMLElement | null>;
  heroParallax?: RefObject<HTMLDivElement | null>;
  orbA?: RefObject<HTMLDivElement | null>;
  orbB?: RefObject<HTMLDivElement | null>;
  heroCopy?: RefObject<HTMLElement | null>;
  heroPreview?: RefObject<HTMLDivElement | null>;
};

/**
 * Landing animations: nav + hero copy stagger, floating orbs, parallax backdrop,
 * preview entrance, scroll reveals, subtle hero sparkle rotation.
 */
export function useLandingPageGsap(enabled: boolean, refs: LandingGsapRefs) {
  useLayoutEffect(() => {
    if (!enabled || !motionOk()) return;

    const root = refs.root?.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);

      if (refs.nav && refs.nav.current) {
        gsap.fromTo(
          refs.nav.current,
          { y: -20, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.55,
            ease: 'power3.out',
          }
        );
      }

      const heroLines = q('[data-gsap-hero]');
      if (heroLines.length && refs.heroCopy && refs.heroCopy.current) {
        gsap.fromTo(
          heroLines,
          { y: 52, opacity: 0, filter: 'blur(12px)' },
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            stagger: 0.12,
            duration: 0.95,
            ease: 'power3.out',
            delay: 0.12,
          }
        );
      }

      const sparkle = root.querySelector<HTMLElement>('[data-gsap-hero-sparkle]');
      if (sparkle) {
        gsap.to(sparkle, {
          rotate: 360,
          duration: 14,
          repeat: -1,
          ease: 'none',
        });
      }

      if (refs.orbA && refs.orbA.current) {
        gsap.fromTo(
          refs.orbA.current,
          { scale: 0.92, opacity: 0.35 },
          {
            scale: 1.08,
            opacity: 0.75,
            x: 56,
            y: -40,
            duration: 9,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          }
        );
      }
      if (refs.orbB && refs.orbB.current) {
        gsap.fromTo(
          refs.orbB.current,
          { scale: 0.9, opacity: 0.28 },
          {
            scale: 1.12,
            opacity: 0.7,
            x: -64,
            y: 48,
            duration: 11,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          }
        );
      }

      if (refs.heroParallax && refs.heroParallax.current) {
        gsap.to(refs.heroParallax.current, {
          y: 140,
          ease: 'none',
          scrollTrigger: {
            trigger: refs.heroParallax.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      if (refs.heroPreview && refs.heroPreview.current) {
        gsap.fromTo(
          refs.heroPreview.current,
          {
            scale: 0.82,
            opacity: 0,
            y: 72,
            rotateX: 14,
          },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 1.2,
            ease: 'power3.out',
            delay: 0.45,
            transformPerspective: 1200,
          }
        );
      }

      q('[data-gsap-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.72,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        });
      });

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    }, root);

    return () => {
      ctx.revert();
    };
  }, [enabled]);
}
