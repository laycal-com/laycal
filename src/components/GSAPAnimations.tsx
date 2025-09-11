'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function GSAPAnimations() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      // Hero text stagger animation
      const tl = gsap.timeline();
      tl.fromTo('.hero-text', 
        { 
          opacity: 0, 
          y: 100,
          scale: 0.8
        }, 
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 1.2, 
          stagger: 0.2,
          ease: "power3.out"
        }
      );

      // Stats counter animation
      gsap.fromTo('.stat-number', 
        { innerText: 0 },
        {
          innerText: (i, target) => target.dataset.value,
          duration: 2,
          ease: "power2.out",
          snap: { innerText: 1 },
          scrollTrigger: {
            trigger: '.stats-section',
            start: 'top 80%',
          }
        }
      );

      // Cards hover animation
      const cards = gsap.utils.toArray('.feature-card');
      cards.forEach((card: any) => {
        gsap.set(card, { transformOrigin: 'center center' });
        
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            scale: 1.05,
            rotationY: 5,
            rotationX: 5,
            duration: 0.3,
            ease: "power2.out"
          });
        });
        
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            scale: 1,
            rotationY: 0,
            rotationX: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });

      // Floating animation for benefits
      gsap.to('.benefit-card', {
        y: -10,
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.2
      });

      // Table rows animation
      gsap.fromTo('.table-row', 
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: {
            trigger: '.comparison-table',
            start: 'top 80%',
          }
        }
      );

      // Pricing cards scale on scroll
      gsap.fromTo('.pricing-card', 
        { opacity: 0, scale: 0.8, rotationY: 45 },
        {
          opacity: 1,
          scale: 1,
          rotationY: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: '.pricing-section',
            start: 'top 80%',
          }
        }
      );

      // Final CTA pulse animation
      gsap.to('.final-cta-button', {
        scale: 1.1,
        duration: 1.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

      // Parallax effect for sections
      gsap.utils.toArray('.parallax-section').forEach((section: any) => {
        gsap.fromTo(section, 
          { y: 100 },
          {
            y: -100,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 1
            }
          }
        );
      });

      // Cleanup
      return () => {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      };
    }
  }, []);

  return null;
}