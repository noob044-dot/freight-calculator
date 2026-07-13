"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface RouteGlobeProps {
  originCoords?: { lat: number; lon: number } | null;
  destCoords?: { lat: number; lon: number } | null;
  originName?: string;
  destName?: string;
}

export default function RouteGlobe({
  originCoords,
  destCoords,
  originName = "Origin",
  destName = "Destination"
}: RouteGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Clear any residual canvas elements
    container.innerHTML = "";

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    
    // Set up camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 18;

    // Initialize WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group to hold globe items for rotation
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Wireframe Globe Sphere
    const globeRadius = 5;
    const sphereGeo = new THREE.SphereGeometry(globeRadius, 32, 32);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b, // slate-800
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(globeMesh);

    // 2. Latitude/Longitude Grid Lines (Atmosphere helper)
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x0891b2, // cyan-600
      transparent: true,
      opacity: 0.1
    });
    for (let i = 0; i < 4; i++) {
      const ringGeo = new THREE.RingGeometry(globeRadius + 0.05, globeRadius + 0.08, 64);
      const ring = new THREE.LineLoop(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.y = (i * Math.PI) / 4;
      globeGroup.add(ring);
    }

    // Conversion helper
    const convertLatLngToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.sin(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      );
    };

    let curveMesh: THREE.Line | null = null;
    let particleMesh: THREE.Mesh | null = null;
    let originPin: THREE.Mesh | null = null;
    let destPin: THREE.Mesh | null = null;
    let bezierCurve: THREE.QuadraticBezierCurve3 | null = null;

    // Render connecting route if coordinates are provided
    if (originCoords && destCoords) {
      const startVec = convertLatLngToVector3(originCoords.lat, originCoords.lon, globeRadius);
      const endVec = convertLatLngToVector3(destCoords.lat, destCoords.lon, globeRadius);

      // Midpoint pulled outward to create an arch
      const midVec = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
      const distance = startVec.distanceTo(endVec);
      midVec.normalize().multiplyScalar(globeRadius + distance * 0.25);

      // Generate quadratic bezier path
      bezierCurve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
      const points = bezierCurve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      
      const curveMat = new THREE.LineBasicMaterial({
        color: 0x22d3ee, // cyan-400
        transparent: true,
        opacity: 0.7,
        linewidth: 2
      });
      curveMesh = new THREE.Line(curveGeo, curveMat);
      globeGroup.add(curveMesh);

      // Origin Pin indicator
      const pinGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const originMat = new THREE.MeshBasicMaterial({ color: 0x10b981 }); // emerald-500
      originPin = new THREE.Mesh(pinGeo, originMat);
      originPin.position.copy(startVec);
      globeGroup.add(originPin);

      // Destination Pin indicator
      const destMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // rose-500
      destPin = new THREE.Mesh(pinGeo, destMat);
      destPin.position.copy(endVec);
      globeGroup.add(destPin);

      // Animated Bezier flow particle
      const pGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({
        color: 0xeab308, // amber-500
        transparent: true,
        opacity: 0.9
      });
      particleMesh = new THREE.Mesh(pGeo, pMat);
      particleMesh.position.copy(startVec);
      globeGroup.add(particleMesh);

      // Pivot the globe group to face the midpoint of the route
      const focusTarget = midVec.clone().normalize().multiplyScalar(1);
      globeGroup.lookAt(focusTarget);
      globeGroup.rotateY(Math.PI); // Orient camera looking directly at midpoint
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 300;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);
    const resizeTimeout = setTimeout(handleResize, 100);

    // Animation variables
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      try {
        const elapsed = (performance.now() - startTime) / 1000;

        if (!prefersReducedMotion) {
          // Slow passive rotation if route is not actively focused
          if (!originCoords || !destCoords) {
            globeGroup.rotation.y = elapsed * 0.15;
            globeGroup.rotation.x = Math.sin(elapsed * 0.05) * 0.1;
          }

          // Move the route traveler particle along bezier curve
          if (particleMesh && bezierCurve) {
            const progress = (elapsed * 0.4) % 1.0; // Complete cycle in 2.5s
            const point = bezierCurve.getPointAt(progress);
            particleMesh.position.copy(point);
          }
        }

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animate);
      } catch (err) {
        console.error("RouteGlobe animate error:", err);
      }
    };

    animate();

    // Clean up memory
    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      sphereGeo.dispose();
      sphereMat.dispose();
      ringMat.dispose();
      if (curveMesh) {
        curveMesh.geometry.dispose();
        if (Array.isArray(curveMesh.material)) {
          curveMesh.material.forEach((m) => m.dispose());
        } else {
          curveMesh.material.dispose();
        }
      }
      if (particleMesh) {
        particleMesh.geometry.dispose();
        (particleMesh.material as THREE.Material).dispose();
      }
      if (originPin) {
        originPin.geometry.dispose();
        (originPin.material as THREE.Material).dispose();
      }
      if (destPin) {
        destPin.geometry.dispose();
        (destPin.material as THREE.Material).dispose();
      }
      renderer.dispose();
    };
  }, [originCoords, destCoords]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div ref={containerRef} className="w-full h-full min-h-[300px]" />
      
      {/* City labels legend */}
      {originCoords && destCoords && (
        <div className="absolute bottom-2 flex gap-4 text-[9px] uppercase tracking-wider font-bold bg-black/40 border border-white/5 px-3 py-1.5 rounded-full backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300 max-w-[80px] truncate">{originName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-300 max-w-[80px] truncate">{destName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
