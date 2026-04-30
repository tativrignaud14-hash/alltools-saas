"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const colors = [0x2f6bff, 0x27d17f, 0xf5b84b, 0xff5c7a, 0x8bd3ff];

export default function Hero3DScene() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.8, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(4, 6, 5);
    scene.add(key);

    const coreGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.48,
      roughness: 0.24,
      emissive: 0x1d2745,
      emissiveIntensity: 0.25,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    const rings: THREE.Mesh[] = [];
    for (let index = 0; index < 5; index++) {
      const geometry = new THREE.TorusGeometry(1.72 + index * 0.36, 0.012, 8, 96);
      const material = new THREE.MeshBasicMaterial({
        color: colors[index],
        transparent: true,
        opacity: 0.44,
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.x = Math.PI / 2 + index * 0.16;
      ring.rotation.y = index * 0.34;
      rings.push(ring);
      group.add(ring);
    }

    const nodes: THREE.Mesh[] = [];
    for (let index = 0; index < 42; index++) {
      const geometry = new THREE.BoxGeometry(0.16, 0.16, 0.16);
      const material = new THREE.MeshStandardMaterial({
        color: colors[index % colors.length],
        emissive: colors[index % colors.length],
        emissiveIntensity: 0.28,
        metalness: 0.1,
        roughness: 0.4,
      });
      const node = new THREE.Mesh(geometry, material);
      const angle = index * 1.19;
      const radius = 2.2 + (index % 7) * 0.32;
      node.position.set(Math.cos(angle) * radius, Math.sin(index * 0.7) * 1.35, Math.sin(angle) * radius);
      node.rotation.set(index * 0.12, index * 0.2, index * 0.08);
      nodes.push(node);
      group.add(node);
    }

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 });
    for (let index = 0; index < nodes.length; index += 3) {
      const points = [nodes[index].position, nodes[(index + 8) % nodes.length].position];
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
    }

    let frame = 0;
    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const animate = () => {
      frame += 0.01;
      group.rotation.y = frame * 0.42;
      group.rotation.x = Math.sin(frame * 0.7) * 0.16;
      core.rotation.x += 0.012;
      core.rotation.y += 0.017;
      rings.forEach((ring, index) => {
        ring.rotation.z += 0.004 + index * 0.001;
      });
      nodes.forEach((node, index) => {
        node.position.y += Math.sin(frame * 2 + index) * 0.0028;
        node.rotation.x += 0.006;
        node.rotation.y += 0.008;
      });
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      rings.forEach((ring) => {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      });
      nodes.forEach((node) => {
        node.geometry.dispose();
        (node.material as THREE.Material).dispose();
      });
      host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />;
}
