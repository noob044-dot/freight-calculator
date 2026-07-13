"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const HeroScene: React.FC<{ className?: string }> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track cursor and scroll positions locally to bypass React render cycles
  const stateRef = useRef({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    scrollY: 0
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any residual canvas elements from previous renders/Strict Mode mounts
    containerRef.current.innerHTML = "";

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;
    
    const scene = new THREE.Scene();
    
    // Camera config
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 25;

    // Renderer config (alpha true, antialias true)
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
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

    const handleMouseMove = (event: MouseEvent) => {
      stateRef.current.targetX = (event.clientX / window.innerWidth - 0.5) * 8;
      stateRef.current.targetY = (event.clientY / window.innerHeight - 0.5) * 8;
    };

    const handleScroll = () => {
      stateRef.current.scrollY = window.scrollY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    const resizeTimeout = setTimeout(handleResize, 100);

    // Animation Loop using performance.now() to bypass Clock deprecation
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      try {
        const elapsedTime = (performance.now() - startTime) / 1000;

        // Smooth mouse interpolation (lerp)
        stateRef.current.x += (stateRef.current.targetX - stateRef.current.x) * 0.05;
        stateRef.current.y += (stateRef.current.targetY - stateRef.current.y) * 0.05;

        const mX = stateRef.current.x;
        const mY = stateRef.current.y;
        const sY = stateRef.current.scrollY;

        // Update camera position smoothly
        camera.position.x = mX;
        camera.position.y = -mY;
        
        // Camera dolly zoom on scroll
        camera.position.z = 25 + (sY * 0.03);
        camera.lookAt(scene.position);

        // Rotate toruses continuously
        heroToruses.forEach((torus, index) => {
          torus.rotation.y = elapsedTime * (0.04 + index * 0.01);
          torus.rotation.x = elapsedTime * (0.02 + index * 0.005);
          torus.rotation.z = elapsedTime * (0.01 + index * 0.002);
        });

        // Flow particles smoothly in space
        const posArr = particles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          const initX = initialPositions[idx];
          const initY = initialPositions[idx + 1];

          posArr[idx] = initX + Math.sin(elapsedTime * 0.2 + initY) * 2;
          posArr[idx + 1] = initY + Math.cos(elapsedTime * 0.2 + initX) * 2;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // Draw connecting wire lines
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
        // Fill unused line coordinates with zeros
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
      } catch (err) {
        console.error("HeroScene animate crash:", err);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimeout);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.removeChild(renderer.domElement);
      }
      
      // Clear GPU memory allocations
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
      renderer.dispose();
    };
  }, []); // Run exactly once on mount, clean up on unmount

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden ${className}`} 
    />
  );
};
