"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useSpring } from "framer-motion";
import { spring } from "@/lib/animations/variants";

export const HeroScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Framer Motion spring values for smooth camera parallax using variants.ts springs
  const cameraX = useSpring(0, spring);
  const cameraY = useSpring(0, spring);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene Setup
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

    // 3 overlapping wireframe torus knots for chromatic offset
    const heroToruses: THREE.Mesh[] = [];
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

    // Particle System (3000 particles)
    const particleCount = 3000;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const initialPositions: number[] = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 40;
      
      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = z;

      initialPositions.push(x, y, z);
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.15,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Connecting Lines
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
    scene.add(lineSegments);

    let scrollY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const targetX = (event.clientX / window.innerWidth - 0.5) * 8;
      const targetY = (event.clientY / window.innerHeight - 0.5) * 8;
      cameraX.set(targetX);
      cameraY.set(targetY);
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Read spring values for smooth parallax
      camera.position.x = cameraX.get();
      camera.position.y = -cameraY.get();
      
      // Camera dolly on scroll
      camera.position.z = 25 + (scrollY * 0.03);
      camera.lookAt(scene.position);

      // Rotate toruses
      heroToruses.forEach((torus, index) => {
        torus.rotation.y = elapsedTime * (0.04 + index * 0.01);
        torus.rotation.x = elapsedTime * (0.02 + index * 0.005);
        torus.rotation.z = elapsedTime * (0.01 + index * 0.002);
      });

      // Flow particles
      const posArr = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const initX = initialPositions[idx];
        const initY = initialPositions[idx + 1];

        posArr[idx] = initX + Math.sin(elapsedTime * 0.2 + initY) * 2;
        posArr[idx + 1] = initY + Math.cos(elapsedTime * 0.2 + initX) * 2;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Draw lines
      let lineIdx = 0;
      const linePosArr = lineSegments.geometry.attributes.position.array as Float32Array;
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
      // Fill remaining lines with zeros
      for (let k = lineIdx; k < lineMaxConnections; k++) {
        const linePosIdx = k * 6;
        if (linePosIdx + 5 < linePosArr.length) {
          linePosArr[linePosIdx] = 0;
          linePosArr[linePosIdx + 1] = 0;
          linePosArr[linePosIdx + 2] = 0;
          linePosArr[linePosIdx + 3] = 0;
          linePosArr[linePosIdx + 4] = 0;
          linePosArr[linePosIdx + 5] = 0;
        }
      }
      lineSegments.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (containerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.removeChild(renderer.domElement);
      }
      // Dispose materials/geometries
      heroToruses.forEach((torus) => {
        torus.geometry.dispose();
        if (Array.isArray(torus.material)) {
          torus.material.forEach((m) => m.dispose());
        } else {
          torus.material.dispose();
        }
      });
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
    };
  }, [cameraX, cameraY]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden" 
    />
  );
};
