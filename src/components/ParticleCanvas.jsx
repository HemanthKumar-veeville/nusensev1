import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
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
      textMesh.position.sub(textCenter);

      scene.add(textMesh);

      const particleCount = 10000;
      const positions = new Float32Array(particleCount * 3);
      const speeds = new Float32Array(particleCount * 3);
      const directions = new Array(particleCount).fill(true);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

        speeds[i * 3] = Math.random() * 0.005 + 0.001; // Further reduced speed
        speeds[i * 3 + 1] = Math.random() * 0.005 + 0.001; // Further reduced speed
        speeds[i * 3 + 2] = Math.random() * 0.005 + 0.001; // Further reduced speed
      }

      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );

      const particleMaterial = new THREE.PointsMaterial({
        color: 0x00aaff,
        size: 0.2, // Reduced particle size
      });

      const particleSystem = new THREE.Points(
        particleGeometry,
        particleMaterial
      );
      scene.add(particleSystem);

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
            positionsArray[i * 3] -= positionsArray[i * 3] * speeds[i * 3];
            positionsArray[i * 3 + 1] -=
              positionsArray[i * 3 + 1] * speeds[i * 3 + 1];
            positionsArray[i * 3 + 2] -=
              positionsArray[i * 3 + 2] * speeds[i * 3 + 2];

            if (distanceFromCenter < 10) {
              directions[i] = false;
            }
          } else {
            positionsArray[i * 3] += positionsArray[i * 3] * speeds[i * 3];
            positionsArray[i * 3 + 1] +=
              positionsArray[i * 3 + 1] * speeds[i * 3 + 1];
            positionsArray[i * 3 + 2] +=
              positionsArray[i * 3 + 2] * speeds[i * 3 + 2];

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
