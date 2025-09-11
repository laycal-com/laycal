'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function Advanced3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const models = useRef<THREE.Group[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 10, 50);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    containerRef.current.appendChild(renderer.domElement);

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(10, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 4096;
    mainLight.shadow.mapSize.height = 4096;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    scene.add(mainLight);

    // Colored accent lights
    const purpleLight = new THREE.PointLight(0x8b5cf6, 2, 30);
    purpleLight.position.set(-10, 5, 10);
    scene.add(purpleLight);

    const blueLight = new THREE.PointLight(0x3b82f6, 2, 30);
    blueLight.position.set(10, -5, 10);
    scene.add(blueLight);

    const greenLight = new THREE.PointLight(0x10b981, 1.5, 25);
    greenLight.position.set(0, 10, -10);
    scene.add(greenLight);

    // Create detailed 3D models
    const createDetailedModel = (type: string, position: THREE.Vector3, scale: number = 1) => {
      const group = new THREE.Group();
      
      switch (type) {
        case 'ai_headquarters':
          // Create a futuristic AI headquarters building
          const hqGroup = new THREE.Group();
          
          // Main building
          const buildingGeometry = new THREE.BoxGeometry(4, 6, 4);
          const buildingMaterial = new THREE.MeshPhongMaterial({
            color: 0x2c3e50,
            shininess: 100,
            transparent: true,
            opacity: 0.9
          });
          const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
          building.castShadow = true;
          building.receiveShadow = true;
          hqGroup.add(building);

          // Glowing windows
          for (let floor = 0; floor < 5; floor++) {
            for (let window = 0; window < 3; window++) {
              const windowGeometry = new THREE.PlaneGeometry(0.5, 0.8);
              const windowMaterial = new THREE.MeshPhongMaterial({
                color: 0x00ffff,
                emissive: 0x004466,
                transparent: true,
                opacity: 0.8
              });
              const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
              windowMesh.position.set(
                (window - 1) * 1.2,
                floor * 1.2 - 2,
                2.01
              );
              hqGroup.add(windowMesh);
            }
          }

          // Rotating antenna
          const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
          const antennaMaterial = new THREE.MeshPhongMaterial({
            color: 0xff6b6b,
            emissive: 0x441111
          });
          const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
          antenna.position.y = 4;
          (antenna as any).rotationSpeed = 0.02;
          hqGroup.add(antenna);

          // Data streams
          for (let i = 0; i < 8; i++) {
            const streamGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const streamMaterial = new THREE.MeshPhongMaterial({
              color: 0x4ecdc4,
              emissive: 0x223333
            });
            const stream = new THREE.Mesh(streamGeometry, streamMaterial);
            const angle = (i / 8) * Math.PI * 2;
            stream.position.set(
              Math.cos(angle) * 3,
              2,
              Math.sin(angle) * 3
            );
            (stream as any).orbitSpeed = 0.01;
            (stream as any).angle = angle;
            hqGroup.add(stream);
          }

          group.add(hqGroup);
          break;

        case 'call_center_3d':
          // Create a 3D call center with multiple workstations
          const centerGroup = new THREE.Group();

          // Main platform
          const platformGeometry = new THREE.CylinderGeometry(5, 5, 0.5, 32);
          const platformMaterial = new THREE.MeshPhongMaterial({
            color: 0x34495e,
            shininess: 50
          });
          const platform = new THREE.Mesh(platformGeometry, platformMaterial);
          platform.position.y = -0.25;
          platform.receiveShadow = true;
          centerGroup.add(platform);

          // Workstations arranged in a circle
          for (let i = 0; i < 8; i++) {
            const stationGroup = new THREE.Group();
            
            // Desk
            const deskGeometry = new THREE.BoxGeometry(1.5, 0.1, 1);
            const deskMaterial = new THREE.MeshPhongMaterial({
              color: 0x95a5a6
            });
            const desk = new THREE.Mesh(deskGeometry, deskMaterial);
            desk.castShadow = true;
            stationGroup.add(desk);

            // Monitor
            const monitorGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.1);
            const monitorMaterial = new THREE.MeshPhongMaterial({
              color: 0x2c3e50
            });
            const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
            monitor.position.set(0, 0.4, -0.3);
            stationGroup.add(monitor);

            // Screen
            const screenGeometry = new THREE.PlaneGeometry(0.7, 0.5);
            const screenMaterial = new THREE.MeshPhongMaterial({
              color: 0x00ff88,
              emissive: 0x004422
            });
            const screen = new THREE.Mesh(screenGeometry, screenMaterial);
            screen.position.set(0, 0.4, -0.24);
            stationGroup.add(screen);

            // Position station in circle
            const angle = (i / 8) * Math.PI * 2;
            stationGroup.position.set(
              Math.cos(angle) * 3,
              0.5,
              Math.sin(angle) * 3
            );
            stationGroup.rotation.y = angle + Math.PI;

            centerGroup.add(stationGroup);
          }

          // Central hologram
          const holoGeometry = new THREE.ConeGeometry(0.5, 2, 8);
          const holoMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b5cf6,
            transparent: true,
            opacity: 0.6,
            emissive: 0x442266
          });
          const hologram = new THREE.Mesh(holoGeometry, holoMaterial);
          hologram.position.y = 2;
          (hologram as any).rotationSpeed = 0.02;
          centerGroup.add(hologram);

          group.add(centerGroup);
          break;

        case 'data_visualization':
          // Create 3D data visualization with charts and graphs
          const dataGroup = new THREE.Group();

          // 3D Bar chart
          for (let i = 0; i < 10; i++) {
            const height = Math.random() * 4 + 1;
            const barGeometry = new THREE.BoxGeometry(0.4, height, 0.4);
            const barMaterial = new THREE.MeshPhongMaterial({
              color: new THREE.Color().setHSL((i / 10) * 0.8, 0.8, 0.6),
              emissive: new THREE.Color().setHSL((i / 10) * 0.8, 0.5, 0.1)
            });
            const bar = new THREE.Mesh(barGeometry, barMaterial);
            bar.position.set(
              (i - 4.5) * 0.8,
              height / 2,
              0
            );
            bar.castShadow = true;
            (bar as any).targetHeight = height;
            (bar as any).currentHeight = 0;
            dataGroup.add(bar);
          }

          // Floating data nodes
          for (let i = 0; i < 20; i++) {
            const nodeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
            const nodeMaterial = new THREE.MeshPhongMaterial({
              color: 0x00aaff,
              emissive: 0x002244
            });
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
            node.position.set(
              (Math.random() - 0.5) * 8,
              Math.random() * 6 + 2,
              (Math.random() - 0.5) * 6
            );
            (node as any).floatSpeed = Math.random() * 0.02 + 0.01;
            (node as any).floatOffset = Math.random() * Math.PI * 2;
            dataGroup.add(node);
          }

          // Growth arrows
          for (let i = 0; i < 5; i++) {
            const arrowGeometry = new THREE.ConeGeometry(0.2, 1, 8);
            const arrowMaterial = new THREE.MeshPhongMaterial({
              color: 0x10b981,
              emissive: 0x114411
            });
            const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
            arrow.position.set(
              (i - 2) * 1.5,
              4,
              -3
            );
            arrow.rotation.x = -Math.PI / 2;
            (arrow as any).riseSpeed = 0.02;
            dataGroup.add(arrow);
          }

          group.add(dataGroup);
          break;

        case 'money_machine':
          // Create a 3D money-making machine
          const moneyGroup = new THREE.Group();

          // Main machine body
          const machineGeometry = new THREE.BoxGeometry(3, 4, 2);
          const machineMaterial = new THREE.MeshPhongMaterial({
            color: 0x2c3e50,
            shininess: 80
          });
          const machine = new THREE.Mesh(machineGeometry, machineMaterial);
          machine.castShadow = true;
          machine.receiveShadow = true;
          moneyGroup.add(machine);

          // Money output slot
          const slotGeometry = new THREE.BoxGeometry(1.5, 0.3, 0.1);
          const slotMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000
          });
          const slot = new THREE.Mesh(slotGeometry, slotMaterial);
          slot.position.set(0, -0.5, 1.01);
          moneyGroup.add(slot);

          // Spinning coins
          for (let i = 0; i < 15; i++) {
            const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
            const coinMaterial = new THREE.MeshPhongMaterial({
              color: 0xffd700,
              shininess: 100,
              emissive: 0x332200
            });
            const coin = new THREE.Mesh(coinGeometry, coinMaterial);
            coin.position.set(
              (Math.random() - 0.5) * 6,
              Math.random() * 6 + 2,
              (Math.random() - 0.5) * 4
            );
            coin.castShadow = true;
            (coin as any).spinSpeed = Math.random() * 0.1 + 0.05;
            (coin as any).fallSpeed = Math.random() * 0.02 + 0.01;
            moneyGroup.add(coin);
          }

          // Dollar signs
          for (let i = 0; i < 8; i++) {
            const dollarGeometry = new THREE.RingGeometry(0.3, 0.5, 16);
            const dollarMaterial = new THREE.MeshPhongMaterial({
              color: 0x00ff00,
              emissive: 0x002200,
              transparent: true,
              opacity: 0.8
            });
            const dollar = new THREE.Mesh(dollarGeometry, dollarMaterial);
            const angle = (i / 8) * Math.PI * 2;
            dollar.position.set(
              Math.cos(angle) * 4,
              3 + Math.sin(angle * 2) * 0.5,
              Math.sin(angle) * 4
            );
            (dollar as any).orbitSpeed = 0.01;
            (dollar as any).angle = angle;
            moneyGroup.add(dollar);
          }

          group.add(moneyGroup);
          break;

        case 'rocket_ship':
          // Create a detailed rocket ship for growth
          const rocketGroup = new THREE.Group();

          // Main rocket body
          const bodyGeometry = new THREE.CylinderGeometry(0.8, 1, 5, 16);
          const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xf5f6fa,
            shininess: 100
          });
          const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
          body.castShadow = true;
          rocketGroup.add(body);

          // Rocket tip
          const tipGeometry = new THREE.ConeGeometry(0.8, 2, 16);
          const tipMaterial = new THREE.MeshPhongMaterial({
            color: 0xff4757,
            shininess: 80
          });
          const tip = new THREE.Mesh(tipGeometry, tipMaterial);
          tip.position.y = 3.5;
          rocketGroup.add(tip);

          // Fins
          for (let i = 0; i < 4; i++) {
            const finGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.1);
            const finMaterial = new THREE.MeshPhongMaterial({
              color: 0x2f3542
            });
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            const angle = (i / 4) * Math.PI * 2;
            fin.position.set(
              Math.cos(angle) * 1.1,
              -2,
              Math.sin(angle) * 1.1
            );
            fin.rotation.y = angle;
            rocketGroup.add(fin);
          }

          // Exhaust flames
          for (let i = 0; i < 5; i++) {
            const flameGeometry = new THREE.ConeGeometry(0.4 - i * 0.05, 1.5 + i * 0.2, 8);
            const flameMaterial = new THREE.MeshPhongMaterial({
              color: [0xff6b35, 0xff8c42, 0xffa652, 0xffcc70, 0xfff200][i],
              emissive: [0x441100, 0x442200, 0x443300, 0x444400, 0x445500][i],
              transparent: true,
              opacity: 0.8 - i * 0.1
            });
            const flame = new THREE.Mesh(flameGeometry, flameMaterial);
            flame.position.y = -3.5 - i * 0.3;
            (flame as any).flickerSpeed = 0.1 + i * 0.02;
            rocketGroup.add(flame);
          }

          // Stars around rocket
          for (let i = 0; i < 12; i++) {
            const starGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const starMaterial = new THREE.MeshPhongMaterial({
              color: 0xffffff,
              emissive: 0x444444
            });
            const star = new THREE.Mesh(starGeometry, starMaterial);
            const angle = (i / 12) * Math.PI * 2;
            const radius = 6 + Math.random() * 2;
            star.position.set(
              Math.cos(angle) * radius,
              Math.random() * 8 - 4,
              Math.sin(angle) * radius
            );
            (star as any).twinkleSpeed = Math.random() * 0.02 + 0.01;
            rocketGroup.add(star);
          }

          group.add(rocketGroup);
          break;
      }

      group.position.copy(position);
      group.scale.set(0.01, 0.01, 0.01);
      group.userData = {
        type: type,
        animationPhase: 'hidden',
        originalPosition: position.clone(),
        targetScale: scale
      };

      scene.add(group);
      models.current.push(group);
      return group;
    };

    // Create 3D models for each section with proper spacing
    createDetailedModel('ai_headquarters', new THREE.Vector3(-8, 8, 0), 0.4);
    createDetailedModel('call_center_3d', new THREE.Vector3(8, 2, 0), 0.3);
    createDetailedModel('data_visualization', new THREE.Vector3(-6, -4, 0), 0.5);
    createDetailedModel('money_machine', new THREE.Vector3(6, -10, 0), 0.4);
    createDetailedModel('rocket_ship', new THREE.Vector3(0, -16, 0), 0.3);

    // ScrollTrigger animations with proper timing
    models.current.forEach((model, index) => {
      ScrollTrigger.create({
        trigger: document.body,
        start: `${index * 15}% top`,
        end: `${(index + 1) * 15 + 10}% top`,
        onEnter: () => {
          model.userData.animationPhase = 'appearing';
          
          // Dramatic entrance animation
          gsap.fromTo(model.scale, 
            { x: 0.01, y: 0.01, z: 0.01 },
            {
              x: model.userData.targetScale,
              y: model.userData.targetScale,
              z: model.userData.targetScale,
              duration: 2,
              ease: "elastic.out(1, 0.3)"
            }
          );

          // Entrance rotation
          gsap.fromTo(model.rotation, 
            { x: Math.PI, y: -Math.PI * 2, z: 0 },
            { 
              x: 0,
              y: 0,
              z: 0,
              duration: 2.5,
              ease: "power2.out"
            }
          );

          // Floating animation
          gsap.to(model.position, {
            y: model.userData.originalPosition.y + Math.sin(index) * 1.5,
            duration: 4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
          });
        },
        onLeave: () => {
          model.userData.animationPhase = 'disappearing';
          gsap.to(model.scale, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            duration: 1,
            ease: "power2.in"
          });
        }
      });
    });

    // Animation loop with enhanced effects
    const animate = () => {
      requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      models.current.forEach((model, index) => {
        if (model.userData.animationPhase === 'appearing') {
          // Global model rotation
          model.rotation.y += 0.002;
          
          // Animate specific elements within each model
          model.traverse((child) => {
            if ((child as any).rotationSpeed) {
              child.rotation.y += (child as any).rotationSpeed;
            }
            if ((child as any).orbitSpeed) {
              (child as any).angle += (child as any).orbitSpeed;
              child.position.x = Math.cos((child as any).angle) * 3;
              child.position.z = Math.sin((child as any).angle) * 3;
            }
            if ((child as any).floatSpeed) {
              child.position.y += Math.sin(time * (child as any).floatSpeed + (child as any).floatOffset) * 0.01;
            }
            if ((child as any).spinSpeed) {
              child.rotation.y += (child as any).spinSpeed;
              child.rotation.x += (child as any).spinSpeed * 0.5;
            }
            if ((child as any).flickerSpeed) {
              const scale = 1 + Math.sin(time * (child as any).flickerSpeed) * 0.2;
              child.scale.setScalar(scale);
            }
            if ((child as any).twinkleSpeed) {
              const opacity = 0.5 + Math.sin(time * (child as any).twinkleSpeed) * 0.5;
              if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
                child.material.opacity = opacity;
              }
            }
          });
        }
      });

      // Animate lights
      purpleLight.position.x = Math.cos(time * 0.5) * 12;
      purpleLight.position.z = Math.sin(time * 0.5) * 12;
      blueLight.position.x = Math.cos(time * 0.7 + Math.PI) * 10;
      blueLight.position.z = Math.sin(time * 0.7 + Math.PI) * 10;
      greenLight.position.x = Math.cos(time * 0.3) * 8;
      greenLight.position.z = Math.sin(time * 0.3) * 8;

      // Camera subtle movement
      camera.position.x = Math.sin(time * 0.1) * 2;
      camera.position.y = 5 + Math.cos(time * 0.15) * 1;
      camera.lookAt(0, 0, 0);

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
      
      models.current.forEach((model) => {
        model.traverse((child) => {
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
      className="fixed inset-0 pointer-events-none z-30"
      style={{ zIndex: 30 }}
    />
  );
}