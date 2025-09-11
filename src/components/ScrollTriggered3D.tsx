'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function ScrollTriggered3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const explosiveElements = useRef<THREE.Group[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    camera.position.z = 10;

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    containerRef.current.appendChild(renderer.domElement);

    // Create explosive 3D elements for different sections
    const createExplosiveElement = (type: string, color: number, position: THREE.Vector3) => {
      const group = new THREE.Group();
      
      switch (type) {
        case 'dataExplosion':
          // Create data cubes that explode outward
          for (let i = 0; i < 20; i++) {
            const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const material = new THREE.MeshBasicMaterial({
              color: color,
              transparent: true,
              opacity: 0.8,
              wireframe: true
            });
            const cube = new THREE.Mesh(geometry, material);
            
            // Random position within a sphere
            const phi = Math.acos(-1 + (2 * i) / 20);
            const theta = Math.sqrt(20 * Math.PI) * phi;
            
            cube.position.set(
              Math.cos(theta) * Math.sin(phi) * 0.1,
              Math.sin(theta) * Math.sin(phi) * 0.1,
              Math.cos(phi) * 0.1
            );
            
            cube.userData = {
              originalPosition: cube.position.clone(),
              explosionDirection: cube.position.clone().normalize(),
              explosionSpeed: Math.random() * 2 + 1
            };
            
            group.add(cube);
          }
          break;

        case 'neuralNetwork':
          // Create a neural network that forms and connects
          const nodes = [];
          for (let i = 0; i < 12; i++) {
            const nodeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
            const nodeMaterial = new THREE.MeshBasicMaterial({
              color: color,
              transparent: true,
              opacity: 0.9
            });
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
            
            node.position.set(
              (Math.random() - 0.5) * 4,
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 2
            );
            
            nodes.push(node);
            group.add(node);
          }
          
          // Add connections between nodes
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              if (Math.random() > 0.7) { // 30% chance of connection
                const lineGeometry = new THREE.BufferGeometry();
                const points = [nodes[i].position, nodes[j].position];
                lineGeometry.setFromPoints(points);
                
                const lineMaterial = new THREE.LineBasicMaterial({
                  color: color,
                  transparent: true,
                  opacity: 0.3
                });
                
                const line = new THREE.Line(lineGeometry, lineMaterial);
                group.add(line);
              }
            }
          }
          break;

        case 'callWaves':
          // Create sound wave rings
          for (let i = 0; i < 8; i++) {
            const ringGeometry = new THREE.RingGeometry(0.5 + i * 0.3, 0.6 + i * 0.3, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
              color: color,
              transparent: true,
              opacity: 0.6 - i * 0.05,
              side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.z = i * 0.1;
            ring.userData = {
              animationDelay: i * 0.1,
              originalScale: 1 + i * 0.1
            };
            group.add(ring);
          }
          break;

        case 'moneyRain':
          // Create falling dollar signs and coins
          for (let i = 0; i < 15; i++) {
            const geometry = i % 2 === 0 
              ? new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16)
              : new THREE.TorusGeometry(0.2, 0.05, 8, 16);
            
            const material = new THREE.MeshBasicMaterial({
              color: color,
              transparent: true,
              opacity: 0.8,
              wireframe: i % 2 === 1
            });
            
            const coin = new THREE.Mesh(geometry, material);
            coin.position.set(
              (Math.random() - 0.5) * 6,
              5 + Math.random() * 3,
              (Math.random() - 0.5) * 3
            );
            
            coin.userData = {
              fallSpeed: Math.random() * 0.02 + 0.01,
              rotationSpeed: (Math.random() - 0.5) * 0.05
            };
            
            group.add(coin);
          }
          break;

        case 'statsRocket':
          // Create upward trending arrows and charts
          for (let i = 0; i < 10; i++) {
            const arrowGeometry = new THREE.ConeGeometry(0.1, 0.5, 8);
            const arrowMaterial = new THREE.MeshBasicMaterial({
              color: color,
              transparent: true,
              opacity: 0.8
            });
            const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
            
            arrow.position.set(
              (i - 5) * 0.5,
              -2,
              Math.random() * 2 - 1
            );
            arrow.rotation.x = -Math.PI / 2; // Point upward
            
            arrow.userData = {
              riseSpeed: Math.random() * 0.03 + 0.02,
              targetHeight: Math.random() * 4 + 3
            };
            
            group.add(arrow);
          }
          break;
      }

      group.position.copy(position);
      group.scale.set(0, 0, 0);
      group.userData = {
        type: type,
        animationPhase: 'hidden',
        originalPosition: position.clone()
      };

      scene.add(group);
      explosiveElements.current.push(group);
      return group;
    };

    // Create explosive elements for each section
    createExplosiveElement('neuralNetwork', 0x8b5cf6, new THREE.Vector3(-3, 0, 0));
    createExplosiveElement('dataExplosion', 0x3b82f6, new THREE.Vector3(3, -5, 0));
    createExplosiveElement('callWaves', 0x06b6d4, new THREE.Vector3(-2, -10, 0));
    createExplosiveElement('neuralNetwork', 0xef4444, new THREE.Vector3(0, -15, 0));
    createExplosiveElement('statsRocket', 0x10b981, new THREE.Vector3(2, -20, 0));
    createExplosiveElement('moneyRain', 0xfbbf24, new THREE.Vector3(-1, -25, 0));

    // GSAP ScrollTrigger animations
    explosiveElements.current.forEach((element, index) => {
      const sectionHeight = window.innerHeight;
      const triggerStart = index * sectionHeight * 0.8;
      
      ScrollTrigger.create({
        trigger: document.body,
        start: triggerStart,
        end: triggerStart + sectionHeight,
        onEnter: () => {
          element.userData.animationPhase = 'exploding';
          
          // Pop-in animation
          gsap.to(element.scale, {
            x: 1.2,
            y: 1.2,
            z: 1.2,
            duration: 0.3,
            ease: "back.out(2)",
            onComplete: () => {
              gsap.to(element.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 0.2,
                ease: "power2.out"
              });
            }
          });

          // Rotation during entrance
          gsap.to(element.rotation, {
            y: element.rotation.y + Math.PI * 2,
            duration: 1,
            ease: "power2.out"
          });

          // Individual element animations based on type
          if (element.userData.type === 'dataExplosion') {
            element.children.forEach((child, childIndex) => {
              if (child.userData.explosionDirection) {
                gsap.to(child.position, {
                  x: child.userData.explosionDirection.x * child.userData.explosionSpeed,
                  y: child.userData.explosionDirection.y * child.userData.explosionSpeed,
                  z: child.userData.explosionDirection.z * child.userData.explosionSpeed,
                  duration: 1,
                  delay: childIndex * 0.05,
                  ease: "power2.out"
                });
              }
            });
          }

          if (element.userData.type === 'callWaves') {
            element.children.forEach((child, childIndex) => {
              gsap.fromTo(child.scale, 
                { x: 0, y: 0, z: 1 },
                {
                  x: 1,
                  y: 1,
                  z: 1,
                  duration: 0.5,
                  delay: childIndex * 0.1,
                  ease: "power2.out"
                }
              );
            });
          }
        },
        onLeave: () => {
          element.userData.animationPhase = 'fading';
          gsap.to(element.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.5,
            ease: "power2.in"
          });
        }
      });
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      explosiveElements.current.forEach((group) => {
        if (group.userData.animationPhase === 'exploding') {
          // Continuous animations for active elements
          group.children.forEach((child) => {
            // Floating animation
            child.position.y += Math.sin(Date.now() * 0.002 + child.position.x) * 0.002;
            
            // Continuous rotation
            if (child.userData.rotationSpeed) {
              child.rotation.y += child.userData.rotationSpeed;
            }
            
            // Money rain effect
            if (child.userData.fallSpeed) {
              child.position.y -= child.userData.fallSpeed;
              if (child.position.y < -3) {
                child.position.y = 5;
              }
            }
            
            // Stats rocket effect
            if (child.userData.riseSpeed && child.position.y < child.userData.targetHeight) {
              child.position.y += child.userData.riseSpeed;
            }
          });
          
          // Group-level floating
          group.position.y += Math.sin(Date.now() * 0.001) * 0.001;
          group.rotation.y += 0.002;
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
      
      explosiveElements.current.forEach((group) => {
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
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ zIndex: 1 }}
    />
  );
}