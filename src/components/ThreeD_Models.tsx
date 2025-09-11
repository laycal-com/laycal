'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function ThreeD_Models() {
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
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    camera.position.z = 15;

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    containerRef.current.appendChild(renderer.domElement);

    // Add lighting for proper 3D appearance
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x8b5cf6, 1, 50);
    pointLight1.position.set(-10, 5, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 1, 50);
    pointLight2.position.set(10, -5, 10);
    scene.add(pointLight2);

    // Create 3D models for each section
    const create3DModel = (type: string, position: THREE.Vector3, scale: number = 1) => {
      const group = new THREE.Group();
      
      switch (type) {
        case 'ai_brain':
          // Create a detailed AI brain with neurons
          const brainGroup = new THREE.Group();
          
          // Main brain sphere
          const brainGeometry = new THREE.SphereGeometry(2, 32, 32);
          const brainMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b5cf6,
            transparent: true,
            opacity: 0.7,
            emissive: 0x220066,
            shininess: 100
          });
          const brain = new THREE.Mesh(brainGeometry, brainMaterial);
          brain.castShadow = true;
          brain.receiveShadow = true;
          brainGroup.add(brain);

          // Neural nodes
          for (let i = 0; i < 20; i++) {
            const nodeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
            const nodeMaterial = new THREE.MeshPhongMaterial({
              color: 0x00ffff,
              emissive: 0x004466
            });
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
            
            const phi = Math.acos(-1 + (2 * i) / 20);
            const theta = Math.sqrt(20 * Math.PI) * phi;
            
            node.position.set(
              Math.cos(theta) * Math.sin(phi) * 2.5,
              Math.sin(theta) * Math.sin(phi) * 2.5,
              Math.cos(phi) * 2.5
            );
            
            brainGroup.add(node);
          }

          // Rotating rings around brain
          for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(3 + i * 0.5, 0.1, 8, 32);
            const ringMaterial = new THREE.MeshPhongMaterial({
              color: [0xff6b6b, 0x4ecdc4, 0x45b7d1][i],
              emissive: [0x441111, 0x114444, 0x111144][i]
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            (ring as any).rotationSpeed = (Math.random() - 0.5) * 0.02;
            brainGroup.add(ring);
          }

          group.add(brainGroup);
          break;

        case 'data_server':
          // Create a detailed server/data center
          const serverGroup = new THREE.Group();
          
          // Main server rack
          const rackGeometry = new THREE.BoxGeometry(3, 4, 1.5);
          const rackMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 80
          });
          const rack = new THREE.Mesh(rackGeometry, rackMaterial);
          rack.castShadow = true;
          rack.receiveShadow = true;
          serverGroup.add(rack);

          // Server units
          for (let i = 0; i < 6; i++) {
            const unitGeometry = new THREE.BoxGeometry(2.8, 0.5, 1.4);
            const unitMaterial = new THREE.MeshPhongMaterial({
              color: 0x666666,
              emissive: i % 2 === 0 ? 0x001100 : 0x110000
            });
            const unit = new THREE.Mesh(unitGeometry, unitMaterial);
            unit.position.y = -1.5 + (i * 0.6);
            serverGroup.add(unit);

            // LED indicators
            const ledGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const ledMaterial = new THREE.MeshPhongMaterial({
              color: i % 2 === 0 ? 0x00ff00 : 0xff0000,
              emissive: i % 2 === 0 ? 0x004400 : 0x440000
            });
            const led = new THREE.Mesh(ledGeometry, ledMaterial);
            led.position.set(1.2, -1.5 + (i * 0.6), 0.8);
            serverGroup.add(led);
          }

          // Data cables
          for (let i = 0; i < 8; i++) {
            const cableGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
            const cableMaterial = new THREE.MeshPhongMaterial({
              color: [0x0088ff, 0x88ff00, 0xff8800][i % 3]
            });
            const cable = new THREE.Mesh(cableGeometry, cableMaterial);
            cable.position.set(
              -2 + (i * 0.5),
              2.5,
              1
            );
            cable.rotation.z = Math.PI / 2;
            serverGroup.add(cable);
          }

          group.add(serverGroup);
          break;

        case 'phone_system':
          // Create a 3D phone/communication hub
          const phoneGroup = new THREE.Group();

          // Main phone body
          const phoneGeometry = new THREE.BoxGeometry(1, 2, 0.3);
          const phoneMaterial = new THREE.MeshPhongMaterial({
            color: 0x2c3e50,
            shininess: 100
          });
          const phone = new THREE.Mesh(phoneGeometry, phoneMaterial);
          phone.castShadow = true;
          phoneGroup.add(phone);

          // Screen
          const screenGeometry = new THREE.PlaneGeometry(0.8, 1.4);
          const screenMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            emissive: 0x004422
          });
          const screen = new THREE.Mesh(screenGeometry, screenMaterial);
          screen.position.z = 0.16;
          phoneGroup.add(screen);

          // Sound waves
          for (let i = 0; i < 5; i++) {
            const waveGeometry = new THREE.TorusGeometry(1 + i * 0.5, 0.05, 8, 32);
            const waveMaterial = new THREE.MeshPhongMaterial({
              color: 0x00aaff,
              transparent: true,
              opacity: 0.6 - i * 0.1,
              emissive: 0x002244
            });
            const wave = new THREE.Mesh(waveGeometry, waveMaterial);
            wave.position.y = 1.5;
            wave.rotation.x = Math.PI / 2;
            (wave as any).animationDelay = i * 0.2;
            phoneGroup.add(wave);
          }

          group.add(phoneGroup);
          break;

        case 'money_stack':
          // Create a 3D money/coin stack
          const moneyGroup = new THREE.Group();

          // Coin stack
          for (let i = 0; i < 10; i++) {
            const coinGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
            const coinMaterial = new THREE.MeshPhongMaterial({
              color: 0xffd700,
              shininess: 100,
              emissive: 0x332200
            });
            const coin = new THREE.Mesh(coinGeometry, coinMaterial);
            coin.position.y = i * 0.12;
            coin.castShadow = true;
            coin.receiveShadow = true;
            moneyGroup.add(coin);
          }

          // Dollar signs floating around
          for (let i = 0; i < 6; i++) {
            const dollarGeometry = new THREE.RingGeometry(0.3, 0.5, 16);
            const dollarMaterial = new THREE.MeshPhongMaterial({
              color: 0x00ff00,
              emissive: 0x002200
            });
            const dollar = new THREE.Mesh(dollarGeometry, dollarMaterial);
            dollar.position.set(
              Math.cos(i * Math.PI / 3) * 2,
              Math.sin(i * Math.PI / 3) * 1.5,
              Math.sin(i * Math.PI / 3) * 0.5
            );
            (dollar as any).rotationSpeed = 0.02;
            moneyGroup.add(dollar);
          }

          group.add(moneyGroup);
          break;

        case 'rocket_stats':
          // Create a 3D rocket with stats
          const rocketGroup = new THREE.Group();

          // Rocket body
          const bodyGeometry = new THREE.ConeGeometry(0.5, 3, 8);
          const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xff4757,
            shininess: 80
          });
          const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
          body.position.y = 1;
          body.castShadow = true;
          rocketGroup.add(body);

          // Rocket fins
          for (let i = 0; i < 4; i++) {
            const finGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.1);
            const finMaterial = new THREE.MeshPhongMaterial({
              color: 0x2f3542
            });
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            fin.position.set(
              Math.cos(i * Math.PI / 2) * 0.6,
              -0.5,
              Math.sin(i * Math.PI / 2) * 0.6
            );
            rocketGroup.add(fin);
          }

          // Exhaust flames
          for (let i = 0; i < 3; i++) {
            const flameGeometry = new THREE.ConeGeometry(0.3 - i * 0.1, 1 + i * 0.3, 8);
            const flameMaterial = new THREE.MeshPhongMaterial({
              color: [0xff6b35, 0xff8c42, 0xffa652][i],
              emissive: [0x441100, 0x442200, 0x443300][i]
            });
            const flame = new THREE.Mesh(flameGeometry, flameMaterial);
            flame.position.y = -1.5 - i * 0.3;
            rocketGroup.add(flame);
          }

          // Chart bars rising
          for (let i = 0; i < 5; i++) {
            const barHeight = 1 + i * 0.5;
            const barGeometry = new THREE.BoxGeometry(0.3, barHeight, 0.3);
            const barMaterial = new THREE.MeshPhongMaterial({
              color: [0x3742fa, 0x2ed573, 0xffa502, 0xff4757, 0x5f27cd][i],
              emissive: 0x111111
            });
            const bar = new THREE.Mesh(barGeometry, barMaterial);
            bar.position.set(
              (i - 2) * 0.8,
              -2 + barHeight / 2,
              2
            );
            bar.castShadow = true;
            rocketGroup.add(bar);
          }

          group.add(rocketGroup);
          break;

        case 'vs_battle':
          // Create 3D vs battle scene
          const vsGroup = new THREE.Group();

          // Left side (traditional)
          const leftGeometry = new THREE.BoxGeometry(2, 2, 2);
          const leftMaterial = new THREE.MeshPhongMaterial({
            color: 0xff4757,
            emissive: 0x441111
          });
          const leftCube = new THREE.Mesh(leftGeometry, leftMaterial);
          leftCube.position.x = -4;
          leftCube.castShadow = true;
          vsGroup.add(leftCube);

          // Right side (AI)
          const rightGeometry = new THREE.IcosahedronGeometry(1.5, 1);
          const rightMaterial = new THREE.MeshPhongMaterial({
            color: 0x2ed573,
            emissive: 0x114411,
            shininess: 100
          });
          const rightShape = new THREE.Mesh(rightGeometry, rightMaterial);
          rightShape.position.x = 4;
          rightShape.castShadow = true;
          vsGroup.add(rightShape);

          // VS text in the middle
          const vsGeometry = new THREE.RingGeometry(0.5, 1, 16);
          const vsMaterial = new THREE.MeshPhongMaterial({
            color: 0xffa502,
            emissive: 0x442200
          });
          const vs = new THREE.Mesh(vsGeometry, vsMaterial);
          vs.position.y = 2;
          vsGroup.add(vs);

          // Energy beam
          const beamGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8, 16);
          const beamMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b5cf6,
            emissive: 0x442266,
            transparent: true,
            opacity: 0.8
          });
          const beam = new THREE.Mesh(beamGeometry, beamMaterial);
          beam.rotation.z = Math.PI / 2;
          vsGroup.add(beam);

          group.add(vsGroup);
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

    // Create 3D models for each section
    create3DModel('ai_brain', new THREE.Vector3(-5, 5, 0), 0.8);
    create3DModel('data_server', new THREE.Vector3(5, 0, 0), 0.6);
    create3DModel('phone_system', new THREE.Vector3(-3, -5, 0), 0.8);
    create3DModel('vs_battle', new THREE.Vector3(0, -10, 0), 0.5);
    create3DModel('rocket_stats', new THREE.Vector3(4, -15, 0), 0.7);
    create3DModel('money_stack', new THREE.Vector3(-2, -20, 0), 0.9);

    // ScrollTrigger animations
    models.current.forEach((model, index) => {
      ScrollTrigger.create({
        trigger: document.body,
        start: `${index * 20}% top`,
        end: `${(index + 1) * 20}% top`,
        onEnter: () => {
          model.userData.animationPhase = 'appearing';
          
          // Scale up animation
          gsap.to(model.scale, {
            x: model.userData.targetScale,
            y: model.userData.targetScale,
            z: model.userData.targetScale,
            duration: 1.5,
            ease: "elastic.out(1, 0.3)"
          });

          // Rotation entrance
          gsap.fromTo(model.rotation, 
            { y: -Math.PI * 2 },
            { 
              y: 0,
              duration: 2,
              ease: "power2.out"
            }
          );

          // Floating animation
          gsap.to(model.position, {
            y: model.userData.originalPosition.y + Math.sin(index) * 2,
            duration: 3,
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
            duration: 0.8,
            ease: "power2.in"
          });
        }
      });
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      models.current.forEach((model, index) => {
        if (model.userData.animationPhase === 'appearing') {
          // Continuous rotations for active models
          model.rotation.y += 0.005;
          
          // Animate specific elements within each model
          model.children.forEach((child) => {
            if (child instanceof THREE.Group) {
              child.children.forEach((subChild) => {
                if ((subChild as any).rotationSpeed) {
                  subChild.rotation.y += (subChild as any).rotationSpeed;
                }
                if ((subChild as any).animationDelay !== undefined) {
                  const time = Date.now() * 0.001;
                  subChild.scale.setScalar(1 + Math.sin(time + (subChild as any).animationDelay) * 0.2);
                }
              });
            }
          });
        }
      });

      // Animate lights
      const time = Date.now() * 0.001;
      pointLight1.position.x = Math.cos(time) * 10;
      pointLight1.position.z = Math.sin(time) * 10;
      pointLight2.position.x = Math.cos(time + Math.PI) * 10;
      pointLight2.position.z = Math.sin(time + Math.PI) * 10;

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
        model.children.forEach((child) => {
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
      className="fixed inset-0 pointer-events-none z-20"
      style={{ zIndex: 20 }}
    />
  );
}

