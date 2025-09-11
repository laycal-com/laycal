'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function ParticleExplosions() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const explosions = useRef<THREE.Points[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    camera.position.z = 5;

    sceneRef.current = scene;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Create particle explosion
    const createExplosion = (position: THREE.Vector3, color: number, particleCount: number = 100) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const velocities: THREE.Vector3[] = [];
      const colors = new Float32Array(particleCount * 3);
      
      const colorObj = new THREE.Color(color);
      
      for (let i = 0; i < particleCount; i++) {
        // Start all particles at center
        positions[i * 3] = position.x;
        positions[i * 3 + 1] = position.y;
        positions[i * 3 + 2] = position.z;
        
        // Random explosion direction
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const velocity = Math.random() * 0.1 + 0.05;
        
        velocities.push(new THREE.Vector3(
          Math.sin(theta) * Math.cos(phi) * velocity,
          Math.sin(theta) * Math.sin(phi) * velocity,
          Math.cos(theta) * velocity
        ));
        
        // Particle colors with some variation
        colors[i * 3] = colorObj.r + (Math.random() - 0.5) * 0.3;
        colors[i * 3 + 1] = colorObj.g + (Math.random() - 0.5) * 0.3;
        colors[i * 3 + 2] = colorObj.b + (Math.random() - 0.5) * 0.3;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const material = new THREE.PointsMaterial({
        size: 0.05,
        transparent: true,
        opacity: 1,
        vertexColors: true,
        blending: THREE.AdditiveBlending
      });
      
      const explosion = new THREE.Points(geometry, material);
      explosion.userData = {
        velocities: velocities,
        life: 1.0,
        active: false
      };
      
      scene.add(explosion);
      explosions.current.push(explosion);
      return explosion;
    };

    // Create explosions for different sections
    const explosionConfigs = [
      { position: new THREE.Vector3(-2, 1, 0), color: 0x8b5cf6, particles: 150 }, // Hero - purple
      { position: new THREE.Vector3(2, 0, 0), color: 0x3b82f6, particles: 120 },   // Steps - blue
      { position: new THREE.Vector3(-1, -1, 0), color: 0x06b6d4, particles: 100 }, // Benefits - cyan
      { position: new THREE.Vector3(1, -2, 0), color: 0x10b981, particles: 130 },  // Comparison - green
      { position: new THREE.Vector3(0, 1, 0), color: 0xfbbf24, particles: 110 },   // Stats - yellow
      { position: new THREE.Vector3(-1, 0, 0), color: 0xef4444, particles: 140 }   // Pricing - red
    ];

    explosionConfigs.forEach((config, index) => {
      createExplosion(config.position, config.color, config.particles);
    });

    // Define triggerExplosion function first
    const triggerExplosion = (explosion: THREE.Points) => {
      explosion.userData.active = true;
      explosion.userData.life = 1.0;
      
      // Reset material opacity
      (explosion.material as THREE.PointsMaterial).opacity = 1;
      
      // GSAP animation for the explosion effect
      gsap.fromTo(explosion.userData, 
        { life: 1.0 },
        { 
          life: 0,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => {
            (explosion.material as THREE.PointsMaterial).opacity = explosion.userData.life;
          },
          onComplete: () => {
            explosion.userData.active = false;
            // Reset particles to center
            const positions = explosion.geometry.attributes.position.array as Float32Array;
            explosion.userData.velocities.forEach((velocity: THREE.Vector3, i: number) => {
              positions[i * 3] = explosion.position.x;
              positions[i * 3 + 1] = explosion.position.y;
              positions[i * 3 + 2] = explosion.position.z;
            });
            explosion.geometry.attributes.position.needsUpdate = true;
          }
        }
      );
      
      // Scale animation
      gsap.fromTo(explosion.scale,
        { x: 0.1, y: 0.1, z: 0.1 },
        {
          x: 1,
          y: 1, 
          z: 1,
          duration: 0.3,
          ease: "power3.out",
          onComplete: () => {
            gsap.to(explosion.scale, {
              x: 2,
              y: 2,
              z: 2,
              duration: 1.7,
              ease: "power2.out"
            });
          }
        }
      );
    };

    // ScrollTrigger for explosions
    const sections = [
      '.hero-section',
      '.how-it-works-section', 
      '.benefits-section',
      '.comparison-section',
      '.stats-section',
      '.pricing-section'
    ];

    sections.forEach((selector, index) => {
      ScrollTrigger.create({
        trigger: selector.includes('hero') ? 'body' : selector,
        start: 'top 70%',
        onEnter: () => {
          if (explosions.current[index]) {
            triggerExplosion(explosions.current[index]);
          }
        }
      });
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      explosions.current.forEach((explosion) => {
        if (explosion.userData.active) {
          const positions = explosion.geometry.attributes.position.array as Float32Array;
          const velocities = explosion.userData.velocities;
          
          for (let i = 0; i < velocities.length; i++) {
            // Update particle positions
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;
            
            // Apply gravity and drag
            velocities[i].y -= 0.001; // gravity
            velocities[i].multiplyScalar(0.98); // drag
          }
          
          explosion.geometry.attributes.position.needsUpdate = true;
          
          // Add some rotation to the explosion
          explosion.rotation.z += 0.01;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      
      if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      scene.clear();
      renderer.dispose();
      
      explosions.current.forEach((explosion) => {
        explosion.geometry.dispose();
        if (Array.isArray(explosion.material)) {
          explosion.material.forEach((material) => material.dispose());
        } else {
          explosion.material.dispose();
        }
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-5"
      style={{ zIndex: 5 }}
    />
  );
}