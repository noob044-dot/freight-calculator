"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const AuthScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track cursor position locally to bypass React render triggers
  const mouseRef = useRef({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any residual canvas elements from previous renders/Strict Mode mounts
    containerRef.current.innerHTML = "";

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    
    // Set up camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 22;

    // Initialize WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 3 slow-rotating wireframe toruses on different axes
    const authToruses: THREE.Mesh[] = [];
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

    // 500 Particles forming shape fields
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const initialPositions: number[] = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 30;
      
      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = z;

      initialPositions.push(x, y, z);
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x6366f1,
      size: 0.15,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.targetX = (event.clientX / window.innerWidth - 0.5) * 10;
      mouseRef.current.targetY = (event.clientY / window.innerHeight - 0.5) * 10;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Trigger initial resize sync after mount layout settles
    const resizeTimeout = setTimeout(handleResize, 100);

    // Animation Loop using performance.now() to bypass Clock deprecation
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      try {
        const elapsedTime = (performance.now() - startTime) / 1000;

        // Smooth linear interpolation (lerp) for cursor updates
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

        const mX = mouseRef.current.x;
        const mY = mouseRef.current.y;

        // Slow rotate toruses
        authToruses.forEach((torus, index) => {
          torus.rotation.x += 0.002 * (index + 1);
          torus.rotation.y += 0.003 * (index + 1);
        });

        // Animate particles following cursor lerp value
        const posArr = particles.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          const initX = initialPositions[idx];
          const initY = initialPositions[idx + 1];
          const initZ = initialPositions[idx + 2];

          // Combine flow field waves with cursor pull influence
          const waveX = Math.sin(elapsedTime * 0.3 + initY) * 1.5;
          const waveY = Math.cos(elapsedTime * 0.3 + initX) * 1.5;

          posArr[idx] = initX + waveX + (mX - initX) * 0.15;
          posArr[idx + 1] = initY + waveY + (-mY - initY) * 0.15;
          posArr[idx + 2] = initZ;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // Adjust camera slightly based on mouse position
        camera.position.x = mX * 0.15;
        camera.position.y = -mY * 0.15;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animate);
      } catch (err) {
        console.error("AuthScene animate crash:", err);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimeout);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose materials & geometries to clear GPU memory
      authToruses.forEach((torus) => {
        torus.geometry.dispose();
        if (Array.isArray(torus.material)) {
          torus.material.forEach((m) => m.dispose());
        } else {
          torus.material.dispose();
        }
      });
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, []); // Run exactly once on mount, clean up on unmount

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden" 
    />
  );
};
