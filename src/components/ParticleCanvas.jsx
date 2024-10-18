import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Scene, camera, and renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera.position.z = 50;

    // Load font and create the "nusense" text mesh
    const loader = new FontLoader();
    loader.load("/fonts/Harabara_Regular.json", (font) => {
      const textGeometry = new TextGeometry("nusense", {
        font: font,
        size: 12,
        height: 1,
      });
      const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);

      textGeometry.computeBoundingBox();
      const textCenter = new THREE.Vector3();
      textGeometry.boundingBox.getCenter(textCenter);
      textMesh.position.sub(textCenter); // Center the text

      scene.add(textMesh); // Text stays visible

      // Particle setup
      const particleCount = 10000; // Adjust for performance
      const positions = new Float32Array(particleCount * 3);
      const speeds = new Float32Array(particleCount * 3);
      const directions = new Array(particleCount).fill(true); // Track movement direction

      // Initialize particles
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

        speeds[i * 3] = Math.random() * 0.02 + 0.01;
        speeds[i * 3 + 1] = Math.random() * 0.02 + 0.01;
        speeds[i * 3 + 2] = Math.random() * 0.02 + 0.01;
      }

      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );

      const particleMaterial = new THREE.PointsMaterial({
        color: 0x00aaff,
        size: 0.4,
      });

      const particleSystem = new THREE.Points(
        particleGeometry,
        particleMaterial
      );
      scene.add(particleSystem);

      // Animate particles
      function animate() {
        requestAnimationFrame(animate);

        const positionsArray = particleGeometry.attributes.position.array;

        for (let i = 0; i < particleCount; i++) {
          const distanceFromCenter = Math.sqrt(
            positionsArray[i * 3] ** 2 +
              positionsArray[i * 3 + 1] ** 2 +
              positionsArray[i * 3 + 2] ** 2
          );

          if (directions[i]) {
            // Move particles inward
            positionsArray[i * 3] -= positionsArray[i * 3] * speeds[i * 3];
            positionsArray[i * 3 + 1] -=
              positionsArray[i * 3 + 1] * speeds[i * 3 + 1];
            positionsArray[i * 3 + 2] -=
              positionsArray[i * 3 + 2] * speeds[i * 3 + 2];

            // Switch direction if particle is close to the center
            if (distanceFromCenter < 10) {
              directions[i] = false;
            }
          } else {
            // Move particles outward
            positionsArray[i * 3] += positionsArray[i * 3] * speeds[i * 3];
            positionsArray[i * 3 + 1] +=
              positionsArray[i * 3 + 1] * speeds[i * 3 + 1];
            positionsArray[i * 3 + 2] +=
              positionsArray[i * 3 + 2] * speeds[i * 3 + 2];

            // Switch direction if particle reaches outward distance
            if (distanceFromCenter > 100) {
              directions[i] = true;
            }
          }
        }

        particleGeometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
      }

      animate();
    });

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed top-0 left-0 w-screen h-screen" />
  );
};

export default ParticleCanvas;
