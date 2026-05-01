"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const colors = [0x00e5ff, 0xd8ff4f, 0xff5a5f, 0x7c5cff, 0xffb000];
const panelColors = [0x00e5ff, 0xd8ff4f, 0x7c5cff, 0xff5a5f];

export default function Hero3DScene() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    camera.position.set(0.2, 0.4, 10.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(4, 6, 5);
    scene.add(key);
    const cyanLight = new THREE.PointLight(0x00e5ff, 3.2, 14);
    cyanLight.position.set(-2.8, 1.7, 3.8);
    scene.add(cyanLight);
    const limeLight = new THREE.PointLight(0xd8ff4f, 1.7, 12);
    limeLight.position.set(3.2, -1.4, 2.6);
    scene.add(limeLight);

    const tubes: THREE.Mesh[] = [];
    const curves: THREE.CatmullRomCurve3[] = [];
    for (let index = 0; index < 6; index++) {
      const offset = index - 2.5;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-5.7, Math.sin(index) * 1.1, -2.8 + offset * 0.18),
        new THREE.Vector3(-2.8, 1.8 - index * 0.36, -1.6 + Math.sin(index * 0.8)),
        new THREE.Vector3(-0.2, -1.4 + index * 0.5, 0.6 + Math.cos(index)),
        new THREE.Vector3(2.9, 1.2 - index * 0.3, 1.2 - Math.sin(index * 0.6)),
        new THREE.Vector3(5.9, -0.8 + Math.cos(index) * 1.2, -2.2 + offset * 0.22),
      ]);
      curves.push(curve);
      const geometry = new THREE.TubeGeometry(curve, 96, 0.012 + (index % 2) * 0.006, 8, false);
      const material = new THREE.MeshBasicMaterial({
        color: colors[index % colors.length],
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const tube = new THREE.Mesh(geometry, material);
      tubes.push(tube);
      group.add(tube);
    }

    const panels: THREE.Mesh[] = [];
    const panelOutlines: THREE.LineSegments[] = [];
    const panelGeometry = new THREE.PlaneGeometry(0.72, 0.98);
    const outlineGeometry = new THREE.EdgesGeometry(panelGeometry);
    for (let index = 0; index < 24; index++) {
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        metalness: 0.2,
        roughness: 0.18,
        emissive: panelColors[index % panelColors.length],
        emissiveIntensity: 0.22,
      });
      const panel = new THREE.Mesh(panelGeometry, material);
      const curve = curves[index % curves.length];
      const point = curve.getPoint((index % 12) / 12);
      panel.position.copy(point);
      panel.position.y += Math.sin(index * 1.7) * 0.55;
      panel.position.z += Math.cos(index * 0.9) * 0.55;
      panel.rotation.set(0.18 + index * 0.08, -0.7 + index * 0.13, 0.12 + index * 0.07);
      panel.scale.setScalar(0.72 + (index % 5) * 0.08);
      panels.push(panel);
      group.add(panel);

      const outlineMaterial = new THREE.LineBasicMaterial({
        color: panelColors[index % panelColors.length],
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
      });
      const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
      outline.position.copy(panel.position);
      outline.rotation.copy(panel.rotation);
      outline.scale.copy(panel.scale);
      panelOutlines.push(outline);
      group.add(outline);
    }

    const particleCount = 360;
    const positions = new Float32Array(particleCount * 3);
    const particleGeometry = new THREE.BufferGeometry();
    for (let index = 0; index < particleCount; index++) {
      positions[index * 3] = (Math.random() - 0.5) * 12;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 4.6;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 5.4;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x9ff7ff,
      size: 0.025,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    const haloGeometry = new THREE.TorusGeometry(2.6, 0.008, 8, 160);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halos = [0, 1, 2].map((item) => {
      const halo = new THREE.Mesh(haloGeometry, haloMaterial.clone());
      halo.rotation.set(Math.PI / 2 + item * 0.28, item * 0.42, item * 0.9);
      halo.scale.setScalar(1 + item * 0.28);
      group.add(halo);
      return halo;
    });

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
      frame += 0.011;
      group.rotation.y = Math.sin(frame * 0.32) * 0.18;
      group.rotation.x = Math.sin(frame * 0.5) * 0.08;
      group.position.y = Math.sin(frame * 0.8) * 0.08;

      tubes.forEach((tube, index) => {
        tube.rotation.z = Math.sin(frame * 0.6 + index) * 0.08;
        (tube.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(frame * 1.4 + index) * 0.16;
      });
      panels.forEach((panel, index) => {
        const drift = Math.sin(frame * 1.3 + index * 0.61) * 0.006;
        panel.position.y += drift;
        panel.rotation.x += 0.002 + (index % 3) * 0.0008;
        panel.rotation.y += 0.003 + (index % 4) * 0.0007;
        const pulse = 0.72 + (index % 5) * 0.08 + Math.sin(frame * 1.5 + index) * 0.035;
        panel.scale.setScalar(pulse);
        const outline = panelOutlines[index];
        outline.position.copy(panel.position);
        outline.rotation.copy(panel.rotation);
        outline.scale.copy(panel.scale);
      });
      halos.forEach((halo, index) => {
        halo.rotation.z += 0.0028 + index * 0.001;
        halo.rotation.y += 0.0016 + index * 0.0008;
        (halo.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(frame * 1.1 + index) * 0.08;
      });
      particles.rotation.y -= 0.0018;
      particles.rotation.x = Math.sin(frame * 0.45) * 0.08;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      tubes.forEach((tube) => {
        tube.geometry.dispose();
        (tube.material as THREE.Material).dispose();
      });
      panelGeometry.dispose();
      outlineGeometry.dispose();
      panels.forEach((panel) => {
        (panel.material as THREE.Material).dispose();
      });
      panelOutlines.forEach((outline) => {
        (outline.material as THREE.Material).dispose();
      });
      particleGeometry.dispose();
      particleMaterial.dispose();
      haloGeometry.dispose();
      halos.forEach((halo) => {
        (halo.material as THREE.Material).dispose();
      });
      host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />;
}
