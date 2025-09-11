'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>();
  const scrollTriggeredElements = useRef<THREE.Group[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 8;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Create animated particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 30;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Create particle materials with different colors
    const particlesMaterials = [
      new THREE.PointsMaterial({
        size: 0.003,
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      }),
      new THREE.PointsMaterial({
        size: 0.005,
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      }),
      new THREE.PointsMaterial({
        size: 0.002,
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })
    ];

    // Create multiple particle systems
    const particleSystems: THREE.Points[] = [];
    particlesMaterials.forEach((material, index) => {
      const particlesMesh = new THREE.Points(particlesGeometry.clone(), material);
      particlesMesh.position.set(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      );
      particleSystems.push(particlesMesh);
      scene.add(particlesMesh);
    });

    // Create scroll-triggered 3D elements for each section
    const createScrollElement = (type: string, yPosition: number) => {
      const group = new THREE.Group();
      
      switch (type) {
        case 'hero':
          // AI Brain/Neural Network
          const brainGeometry = new THREE.SphereGeometry(1.5, 32, 32);
          const brainMaterial = new THREE.MeshBasicMaterial({
            color: 0x8b5cf6,
            transparent: true,
            opacity: 0.3,
            wireframe: true
          });
          const brain = new THREE.Mesh(brainGeometry, brainMaterial);
          
          // Add neural connections
          for (let i = 0; i < 20; i++) {
            const lineGeometry = new THREE.BufferGeometry();
            const points = [];
            points.push(new THREE.Vector3(
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3
            ));
            points.push(new THREE.Vector3(
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3
            ));
            lineGeometry.setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({ 
              color: 0x3b82f6,
              transparent: true,
              opacity: 0.5
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            group.add(line);
          }
          
          group.add(brain);
          break;

        case 'steps':
          // Floating CSV/Data cubes
          for (let i = 0; i < 8; i++) {
            const cubeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const cubeMaterial = new THREE.MeshBasicMaterial({
              color: [0x10b981, 0x3b82f6, 0x8b5cf6][i % 3],
              transparent: true,
              opacity: 0.7,
              wireframe: true
            });
            const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            cube.position.set(
              (Math.random() - 0.5) * 6,
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3
            );
            (cube as any).rotationSpeed = {
              x: (Math.random() - 0.5) * 0.02,
              y: (Math.random() - 0.5) * 0.02,
              z: (Math.random() - 0.5) * 0.02,
            };
            group.add(cube);
          }
          break;

        case 'benefits':
          // Floating phone/communication icons
          for (let i = 0; i < 6; i++) {
            const geometry = i % 2 === 0 
              ? new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8)
              : new THREE.SphereGeometry(0.2, 16, 16);
            const material = new THREE.MeshBasicMaterial({
              color: 0x06b6d4,
              transparent: true,
              opacity: 0.6,
              wireframe: true
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 4,
              (Math.random() - 0.5) * 4
            );
            (mesh as any).rotationSpeed = {
              x: (Math.random() - 0.5) * 0.015,
              y: (Math.random() - 0.5) * 0.015,
              z: (Math.random() - 0.5) * 0.015,
            };
            group.add(mesh);
          }
          break;

        case 'comparison':
          // VS. battle elements - geometric shapes facing off
          const leftGeometry = new THREE.OctahedronGeometry(0.8);
          const leftMaterial = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            transparent: true,
            opacity: 0.7,
            wireframe: true
          });
          const leftShape = new THREE.Mesh(leftGeometry, leftMaterial);
          leftShape.position.set(-3, 0, 0);
          
          const rightGeometry = new THREE.IcosahedronGeometry(0.8);
          const rightMaterial = new THREE.MeshBasicMaterial({
            color: 0x10b981,
            transparent: true,
            opacity: 0.7,
            wireframe: true
          });
          const rightShape = new THREE.Mesh(rightGeometry, rightMaterial);
          rightShape.position.set(3, 0, 0);
          
          // Add energy beams between them
          const beamGeometry = new THREE.CylinderGeometry(0.05, 0.05, 6, 8);
          const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0x8b5cf6,
            transparent: true,
            opacity: 0.5
          });
          const beam = new THREE.Mesh(beamGeometry, beamMaterial);
          beam.rotation.z = Math.PI / 2;
          
          group.add(leftShape);
          group.add(rightShape);
          group.add(beam);
          break;

        case 'pricing':
          // Floating currency symbols and price tags
          for (let i = 0; i < 10; i++) {
            const geometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
            const material = new THREE.MeshBasicMaterial({
              color: 0xfbbf24,
              transparent: true,
              opacity: 0.6,
              wireframe: true
            });
            const torus = new THREE.Mesh(geometry, material);
            torus.position.set(
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 6,
              (Math.random() - 0.5) * 4
            );
            (torus as any).rotationSpeed = {
              x: (Math.random() - 0.5) * 0.02,
              y: (Math.random() - 0.5) * 0.02,
              z: (Math.random() - 0.5) * 0.02,
            };
            group.add(torus);
          }
          break;

        case 'stats':
          // Data visualization elements
          for (let i = 0; i < 15; i++) {
            const height = Math.random() * 2 + 0.5;
            const geometry = new THREE.CylinderGeometry(0.1, 0.1, height, 6);
            const material = new THREE.MeshBasicMaterial({
              color: [0x8b5cf6, 0x3b82f6, 0x10b981][i % 3],
              transparent: true,
              opacity: 0.7
            });
            const cylinder = new THREE.Mesh(geometry, material);
            cylinder.position.set(
              (i % 5 - 2) * 1.5,
              height / 2,
              Math.floor(i / 5) * 1.5 - 1.5
            );
            group.add(cylinder);
          }
          break;
      }

      group.position.set(
        (Math.random() - 0.5) * 4,
        yPosition,
        -5
      );
      group.scale.set(0, 0, 0); // Start invisible
      group.userData = { 
        targetScale: 1,
        triggered: false,
        type: type,
        animationPhase: 0
      };
      
      scene.add(group);
      scrollTriggeredElements.current.push(group);
      return group;
    };

    // Create scroll elements for each section
    createScrollElement('hero', 0);
    createScrollElement('steps', -8);
    createScrollElement('benefits', -16);
    createScrollElement('comparison', -24);
    createScrollElement('stats', -32);
    createScrollElement('pricing', -40);

    // Scroll handler
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      const sections = ['hero', 'steps', 'benefits', 'comparison', 'stats', 'pricing'];
      
      scrollTriggeredElements.current.forEach((element, index) => {
        const sectionProgress = (scrollPercent * sections.length) - index;
        const userData = element.userData;
        
        if (sectionProgress > 0 && sectionProgress < 1 && !userData.triggered) {
          userData.triggered = true;
          userData.animationPhase = 1; // Start popping animation
        }
        
        if (userData.animationPhase === 1) {
          // Pop-in animation
          const scale = Math.min(userData.targetScale, element.scale.x + 0.05);
          element.scale.set(scale, scale, scale);
          
          // Add rotation during pop-in
          element.rotation.y += 0.02;
          element.rotation.x += 0.01;
          
          if (scale >= userData.targetScale) {
            userData.animationPhase = 2; // Stable floating
          }
        } else if (userData.animationPhase === 2) {
          // Floating animation
          element.position.y += Math.sin(Date.now() * 0.001 + index) * 0.005;
          element.rotation.y += 0.005;
          
          // Pulse effect
          const pulse = 1 + Math.sin(Date.now() * 0.002 + index) * 0.1;
          element.scale.set(pulse, pulse, pulse);
        }
        
        // Fade out when scrolled past
        if (sectionProgress > 1.5) {
          const fadeScale = Math.max(0, element.scale.x - 0.02);
          element.scale.set(fadeScale, fadeScale, fadeScale);
          if (fadeScale <= 0) {
            userData.triggered = false;
            userData.animationPhase = 0;
          }
        }
      });
    };

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Animate particle systems
      particleSystems.forEach((particles, index) => {
        particles.rotation.x += 0.0003 * (index + 1);
        particles.rotation.y += 0.0005 * (index + 1);
        
        // Mouse interaction with particles
        particles.rotation.x += mouseY * 0.0002;
        particles.rotation.y += mouseX * 0.0002;
      });

      // Animate scroll elements children
      scrollTriggeredElements.current.forEach((group) => {
        group.children.forEach((child) => {
          if ((child as any).rotationSpeed) {
            child.rotation.x += (child as any).rotationSpeed.x;
            child.rotation.y += (child as any).rotationSpeed.y;
            child.rotation.z += (child as any).rotationSpeed.z;
          }
        });
      });

      renderer.render(scene, camera);
    };

    // Event listeners
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    animate();

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of Three.js objects
      scene.clear();
      renderer.dispose();
      
      // Dispose scroll elements
      scrollTriggeredElements.current.forEach((group) => {
        group.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      });
      
      // Dispose particle systems
      particleSystems.forEach((particles) => {
        particles.geometry.dispose();
        if (Array.isArray(particles.material)) {
          particles.material.forEach((material) => material.dispose());
        } else {
          particles.material.dispose();
        }
      });
      
      particlesGeometry.dispose();
      particlesMaterials.forEach(material => material.dispose());
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ zIndex: -1 }}
    />
  );
}