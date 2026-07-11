"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface BackgroundThreeProps {
  type?: "hero" | "auth" | "calculate";
}

export const BackgroundThree: React.FC<BackgroundThreeProps> = ({ type = "hero" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene Setup
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 2. Objects Creation based on Page Type
    const heroToruses: THREE.Mesh[] = [];
    const authToruses: THREE.Mesh[] = [];
    let calcGrid: THREE.GridHelper | null = null;

    if (type === "hero") {
      // 3 overlapping wireframe torus knots for chromatic offset
      const colors = [0x22d3ee, 0x38bdf8, 0x6366f1]; // Cyan, Sky, Indigo
      colors.forEach((color, idx) => {
        const geometry = new THREE.TorusKnotGeometry(6 + idx * 0.08, 1.6 - idx * 0.05, 120, 16);
        const material = new THREE.MeshBasicMaterial({
          color: color,
          wireframe: true,
          transparent: true,
          opacity: 0.10 - idx * 0.02
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.z = (idx * Math.PI) / 3;
        heroToruses.push(mesh);
        scene.add(mesh);
      });
    } else if (type === "auth") {
      // 3 slow-rotating wireframe toruses on different axes
      const colors = [0x22d3ee, 0x6366f1, 0x8b5cf6]; // cyan, indigo, violet
      for (let i = 0; i < 3; i++) {
        const geometry = new THREE.TorusGeometry(5 + i * 2, 0.8, 12, 48);
        const material = new THREE.MeshBasicMaterial({
          color: colors[i],
          wireframe: true,
          transparent: true,
          opacity: 0.08
        });
        const torus = new THREE.Mesh(geometry, material);
        torus.rotation.x = Math.random() * Math.PI;
        torus.rotation.y = Math.random() * Math.PI;
        authToruses.push(torus);
        scene.add(torus);
      }
    } else if (type === "calculate") {
      // Calculate Page: Perspective Grid Floor + floating accents
      calcGrid = new THREE.GridHelper(60, 30, 0x38bdf8, 0x1e293b);
      calcGrid.position.y = -10;
      calcGrid.rotation.x = 0.1;
      scene.add(calcGrid);
    }

    // 3. Floating Particles System (InstancedMesh or Points for 60fps performance)
    const particleCount = type === "hero" ? 3000 : type === "auth" ? 500 : 800;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const initialPositions: number[] = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Distribute particles in a box bounds
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 40;
      
      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = z;

      initialPositions.push(x, y, z);
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Custom Shader-like Material for Glowing circular nodes
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8, // Sky-400
      size: 0.15,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 3b. Line connections between particles for Hero mode
    const lineMaxConnections = 150;
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(lineMaxConnections * 2 * 3);
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending
    });
    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    if (type === "hero") {
      scene.add(lineSegments);
    }

    // 4. Parallax Mouse & Scroll Events
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let scrollY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 8;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 8;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    // 5. Window Resize Event
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 6. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Lerp mouse follow for camera parallax
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      
      camera.position.x = targetX;
      camera.position.y = -targetY;
      
      // Camera dolly on scroll: move camera backwards when scrolling down
      camera.position.z = 25 + (scrollY * 0.03);
      camera.lookAt(scene.position);

      // Rotate Chromatic Wireframe Torus Knots
      heroToruses.forEach((torus, index) => {
        torus.rotation.y = elapsedTime * (0.04 + index * 0.01);
        torus.rotation.x = elapsedTime * (0.02 + index * 0.005);
        torus.rotation.z = elapsedTime * (0.01 + index * 0.002);
      });

      authToruses.forEach((torus, index) => {
        torus.rotation.x += 0.002 * (index + 1);
        torus.rotation.y += 0.003 * (index + 1);
      });

      if (calcGrid) {
        calcGrid.position.z = (elapsedTime * 2) % 2;
      }

      // Animate Particles with simple math vectors simulating flow field
      const posArr = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const initX = initialPositions[idx];
        const initY = initialPositions[idx + 1];

        // Apply simple sine/cosine wave flow field
        posArr[idx] = initX + Math.sin(elapsedTime * 0.2 + initY) * 2;
        posArr[idx + 1] = initY + Math.cos(elapsedTime * 0.2 + initX) * 2;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Animate Line connections
      if (type === "hero") {
        let lineIdx = 0;
        const linePosArr = lineSegments.geometry.attributes.position.array as Float32Array;
        // Limit checks to keep 60fps on low-end laptops
        const checkCount = Math.min(particleCount, 120);

        for (let i = 0; i < checkCount; i++) {
          const idxA = i * 3;
          const xA = posArr[idxA];
          const yA = posArr[idxA + 1];
          const zA = posArr[idxA + 2];

          for (let j = i + 1; j < checkCount; j++) {
            const idxB = j * 3;
            const xB = posArr[idxB];
            const yB = posArr[idxB + 1];
            const zB = posArr[idxB + 2];

            const dx = xA - xB;
            const dy = yA - yB;
            const dz = zA - zB;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 8) {
              const linePosIdx = lineIdx * 6;
              if (linePosIdx + 5 < linePosArr.length) {
                linePosArr[linePosIdx] = xA;
                linePosArr[linePosIdx + 1] = yA;
                linePosArr[linePosIdx + 2] = zA;
                linePosArr[linePosIdx + 3] = xB;
                linePosArr[linePosIdx + 4] = yB;
                linePosArr[linePosIdx + 5] = zB;
                lineIdx++;
              }
            }
          }
        }
        // Fill remaining segments with zero to prevent old rendering
        for (let k = lineIdx * 6; k < linePosArr.length; k++) {
          linePosArr[k] = 0;
        }
        lineSegments.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      // Just draw one static frame
      renderer.render(scene, camera);
    } else {
      animate();
    }

    // 7. Cleanup & Disposal
    const currentContainer = containerRef.current;
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      // Dispose geometries & materials
      heroToruses.forEach(t => {
        t.geometry.dispose();
        (t.material as THREE.Material).dispose();
      });
      authToruses.forEach(t => {
        t.geometry.dispose();
        (t.material as THREE.Material).dispose();
      });
      if (calcGrid) {
        calcGrid.geometry.dispose();
        (calcGrid.material as THREE.Material).dispose();
      }
      particleGeometry.dispose();
      particleMaterial.dispose();
      
      lineGeometry.dispose();
      lineMaterial.dispose();
      
      renderer.dispose();

      if (currentContainer && renderer.domElement) {
        currentContainer.removeChild(renderer.domElement);
      }
    };
  }, [type]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: "screen" }}
    />
  );
};
