import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

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
    renderer.setClearColor(0x000000);

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
      const inwardDirections = new Array(particleCount / 2).fill(true); // For inward particles
      const outwardDirections = new Array(particleCount / 2).fill(false); // For outward particles

      // Initialize particle positions and speeds
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

        speeds[i * 3] = Math.random() * 0.001 + 0.0003;
        speeds[i * 3 + 1] = Math.random() * 0.001 + 0.0003;
        speeds[i * 3 + 2] = Math.random() * 0.001 + 0.0003;
      }

      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );

      const particleMaterial = new THREE.PointsMaterial({
        color: 0x00aaff,
        size: 0.2,
      });

      const particleSystem = new THREE.Points(
        particleGeometry,
        particleMaterial
      );
      scene.add(particleSystem);

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.4,
        0.4,
        0.3
      );
      composer.addPass(bloomPass);

      const mouse = new THREE.Vector2();
      const mousePos = new THREE.Vector3();
      const mouseForce = 5;

      window.addEventListener("mousemove", (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        mousePos.copy(camera.position).add(dir.multiplyScalar(distance));
      });

      function animate() {
        requestAnimationFrame(animate);

        const positionsArray = particleGeometry.attributes.position.array;

        // Handle inward-moving particles
        for (let i = 0; i < particleCount / 2; i++) {
          const particlePos = new THREE.Vector3(
            positionsArray[i * 3],
            positionsArray[i * 3 + 1],
            positionsArray[i * 3 + 2]
          );

          const distanceFromCenter = Math.sqrt(
            positionsArray[i * 3] ** 2 +
              positionsArray[i * 3 + 1] ** 2 +
              positionsArray[i * 3 + 2] ** 2
          );

          if (inwardDirections[i]) {
            positionsArray[i * 3] -= positionsArray[i * 3] * speeds[i * 3];
            positionsArray[i * 3 + 1] -=
              positionsArray[i * 3 + 1] * speeds[i * 3 + 1];
            positionsArray[i * 3 + 2] -=
              positionsArray[i * 3 + 2] * speeds[i * 3 + 2];

            if (distanceFromCenter < 10) {
              inwardDirections[i] = false;
            }
          } else {
            positionsArray[i * 3] += positionsArray[i * 3] * speeds[i * 3];
            positionsArray[i * 3 + 1] +=
              positionsArray[i * 3 + 1] * speeds[i * 3 + 1];
            positionsArray[i * 3 + 2] +=
              positionsArray[i * 3 + 2] * speeds[i * 3 + 2];

            if (distanceFromCenter > 100) {
              inwardDirections[i] = true;
            }
          }
        }

        // Handle outward-moving particles simultaneously
        for (let i = particleCount / 2; i < particleCount; i++) {
          const particlePos = new THREE.Vector3(
            positionsArray[i * 3],
            positionsArray[i * 3 + 1],
            positionsArray[i * 3 + 2]
          );

          const distanceFromCenter = Math.sqrt(
            positionsArray[i * 3] ** 2 +
              positionsArray[i * 3 + 1] ** 2 +
              positionsArray[i * 3 + 2] ** 2
          );

          if (!outwardDirections[i - particleCount / 2]) {
            positionsArray[i * 3] += positionsArray[i * 3] * speeds[i * 3];
            positionsArray[i * 3 + 1] +=
              positionsArray[i * 3 + 1] * speeds[i * 3 + 1];
            positionsArray[i * 3 + 2] +=
              positionsArray[i * 3 + 2] * speeds[i * 3 + 2];

            if (distanceFromCenter > 100) {
              outwardDirections[i - particleCount / 2] = true;
            }
          } else {
            positionsArray[i * 3] -= positionsArray[i * 3] * speeds[i * 3];
            positionsArray[i * 3 + 1] -=
              positionsArray[i * 3 + 1] * speeds[i * 3 + 1];
            positionsArray[i * 3 + 2] -=
              positionsArray[i * 3 + 2] * speeds[i * 3 + 2];

            if (distanceFromCenter < 10) {
              outwardDirections[i - particleCount / 2] = false;
            }
          }
        }

        particleGeometry.attributes.position.needsUpdate = true;
        composer.render();
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
