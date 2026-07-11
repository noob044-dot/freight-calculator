"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useSpring } from "framer-motion";
import { spring } from "@/lib/animations/variants";

export const AuthScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Spring values for mouse tracking
  const mouseX = useSpring(0, spring);
  const mouseY = useSpring(0, spring);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 22;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
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
      const targetX = (event.clientX / window.innerWidth - 0.5) * 10;
      const targetY = (event.clientY / window.innerHeight - 0.5) * 10;
      mouseX.set(targetX);
      mouseY.set(targetY);
    };

    window.addEventListener("mousemove", handleMouseMove);

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

      // Slow rotate toruses
      authToruses.forEach((torus, index) => {
        torus.rotation.x += 0.002 * (index + 1);
        torus.rotation.y += 0.003 * (index + 1);
      });

      // Animate particles following cursor spring value
      const posArr = particles.geometry.attributes.position.array as Float32Array;
      const mX = mouseX.get();
      const mY = mouseY.get();

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const initX = initialPositions[idx];
        const initY = initialPositions[idx + 1];
        const initZ = initialPositions[idx + 2];

        // Combine flow field waves with cursor pull influence (lerp cursor offset)
        const waveX = Math.sin(elapsedTime * 0.3 + initY) * 1.5;
        const waveY = Math.cos(elapsedTime * 0.3 + initX) * 1.5;

        posArr[idx] = initX + waveX + (mX - initX) * 0.15;
        posArr[idx + 1] = initY + waveY + (-mY - initY) * 0.15;
        posArr[idx + 2] = initZ;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Adjust camera slightly based on mouse
      camera.position.x = mX * 0.15;
      camera.position.y = -mY * 0.15;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (containerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.removeChild(renderer.domElement);
      }
      // Clean resources
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
    };
  }, [mouseX, mouseY]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden" 
    />
  );
};
