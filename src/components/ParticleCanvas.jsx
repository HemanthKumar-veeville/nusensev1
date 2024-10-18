import React, { useEffect, useRef } from "react";
import * as THREE from "three";

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

    const particleCount = 10000;
    const halfParticleCount = particleCount / 2;
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount * 3);
    const directions = new Float32Array(particleCount);
    const stopRadius = 1;
    const boundaryRadius = 40;

    // Initial random particle positions (spread across the screen)
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * boundaryRadius;
      const y = (Math.random() - 0.5) * boundaryRadius;
      const z = (Math.random() - 0.5) * boundaryRadius;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      speeds[i * 3] = Math.random() * 0.005 + 0.0005;
      speeds[i * 3 + 1] = Math.random() * 0.005 + 0.0005;
      speeds[i * 3 + 2] = Math.random() * 0.005 + 0.0005;

      directions[i] = i < halfParticleCount ? 1 : -1;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        void main() {
          gl_PointSize = 1.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        void main() {
          gl_FragColor = vec4(0.1, 0.3, 1.0, 1.0);
        }
      `,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    camera.position.z = 30;

    // Start particles movement after a delay
    setTimeout(() => {
      function animate() {
        requestAnimationFrame(animate);

        const positionsArray = particleGeometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          const x = positionsArray[i * 3];
          const y = positionsArray[i * 3 + 1];
          const z = positionsArray[i * 3 + 2];

          // Inward movement with stop at the center
          if (directions[i] === 1) {
            if (Math.sqrt(x * x + y * y + z * z) > stopRadius) {
              positionsArray[i * 3] += (0 - x) * speeds[i * 3];
              positionsArray[i * 3 + 1] += (0 - y) * speeds[i * 3 + 1];
              positionsArray[i * 3 + 2] += (0 - z) * speeds[i * 3 + 2];
            } else {
              directions[i] = -1;
            }
          }

          // Outward movement with reversal at the boundary
          if (directions[i] === -1) {
            positionsArray[i * 3] += x * speeds[i * 3];
            positionsArray[i * 3 + 1] += y * speeds[i * 3 + 1];
            positionsArray[i * 3 + 2] += z * speeds[i * 3 + 2];

            if (Math.sqrt(x * x + y * y + z * z) > boundaryRadius) {
              directions[i] = 1;
            }
          }
        }

        particleGeometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
      }

      animate();
    }, 2000); // 2 second delay before movement starts

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
