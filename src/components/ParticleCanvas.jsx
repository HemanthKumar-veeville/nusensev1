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
    renderer.setClearColor(0x000000); // Black background

    camera.position.z = 50;

    const gradientCanvas = document.createElement("canvas");
    const gradientContext = gradientCanvas.getContext("2d");
    gradientCanvas.width = window.innerWidth;
    gradientCanvas.height = window.innerHeight;
    const gradient = gradientContext.createLinearGradient(
      0,
      0,
      gradientCanvas.width,
      gradientCanvas.height
    );
    gradient.addColorStop(0, "#141E30");
    gradient.addColorStop(1, "#243B55");
    gradientContext.fillStyle = gradient;
    gradientContext.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);
    const backgroundTexture = new THREE.CanvasTexture(gradientCanvas);
    const backgroundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ map: backgroundTexture })
    );
    backgroundPlane.material.depthTest = false;
    backgroundPlane.material.depthWrite = false;
    backgroundPlane.renderOrder = -1;
    scene.add(backgroundPlane);

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

        speeds[i * 3] = Math.random() * 0.005 + 0.001;
        speeds[i * 3 + 1] = Math.random() * 0.005 + 0.001;
        speeds[i * 3 + 2] = Math.random() * 0.005 + 0.001;
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

      // Adjust bloom settings for subtle glow
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.8,
        0.4,
        0.3
      ); // Reduced bloom intensity
      composer.addPass(bloomPass);

      const mouse = new THREE.Vector2();
      window.addEventListener("mousemove", (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      });

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
