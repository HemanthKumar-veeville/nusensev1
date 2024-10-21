import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  const mousePos = useRef(new THREE.Vector3(0, 0, 0)); // Initialize with (0,0,0)
  const isMouseMoving = useRef(false);
  const dampingFactor = 0.93; // More fluid damping
  const attractionForce = 0.0045; // Increased attraction for smoother flow

  // Function to update mouse position
  const updateMousePosition = useCallback((event, camera) => {
    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const mouseX = (clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(clientY / window.innerHeight) * 2 + 1;

    const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
    vector.unproject(camera);

    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    mousePos.current.copy(camera.position).add(dir.multiplyScalar(distance));

    isMouseMoving.current = true;
  }, []);

  useEffect(() => {
    // Scene Setup
    const scene = new THREE.Scene();

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);

    // Font Loader and Text Setup
    const loader = new FontLoader();

    const calculateTextSize = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth <= 640) {
        return 6; // Small screens (e.g., mobile)
      } else if (screenWidth <= 1024) {
        return 8; // Medium screens (e.g., tablet)
      } else {
        return 12; // Large screens (e.g., desktop)
      }
    };

    loader.load(
      "/fonts/Harabara_Regular.json",
      (font) => {
        const textGeometry = new TextGeometry("nusense", {
          font: font,
          size: calculateTextSize(), // Responsive text size
          height: 1,
          bevelEnabled: false,
        });
        textGeometry.computeBoundingBox();
        const textCenter = new THREE.Vector3();
        textGeometry.boundingBox.getCenter(textCenter);
        textGeometry.translate(-textCenter.x, -textCenter.y, -textCenter.z + 1); // Center the text and move it forward

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        scene.add(textMesh);
      },
      undefined,
      (error) => {
        console.error("An error occurred while loading the font:", error);
      }
    );

    // Particle System Setup
    const initialParticleCount = 8000;
    const positions = new Float32Array(initialParticleCount * 3);
    const particleColors = new Float32Array(initialParticleCount * 3);
    const velocities = new Float32Array(initialParticleCount * 3);

    const generateNewParticle = (i) => {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      velocities[i * 3] = (Math.random() - 0.5) * 0.02; // Slight random movement
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      particleColors[i * 3] = 0.0;
      particleColors[i * 3 + 1] = 0.0;
      particleColors[i * 3 + 2] = 1.0;
    };

    for (let i = 0; i < initialParticleCount; i++) {
      generateNewParticle(i);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(particleColors, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Post-processing Setup
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.6, // Strength for glow
      1.0, // Radius
      0.4 // Threshold for glowing effect
    );
    composer.addPass(bloomPass);

    // Animation Loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const positionsArray = particleGeometry.attributes.position.array;
      const colorsArray = particleGeometry.attributes.color.array;

      for (let i = 0; i < initialParticleCount; i++) {
        // Current position
        const px = positionsArray[i * 3];
        const py = positionsArray[i * 3 + 1];
        const pz = positionsArray[i * 3 + 2];

        const particlePos = new THREE.Vector3(px, py, pz);

        // Move toward mouse position with smoother attraction
        const direction = new THREE.Vector3()
          .copy(mousePos.current)
          .sub(particlePos)
          .normalize();

        const distance = particlePos.distanceTo(mousePos.current);
        const minDistance = 5.0; // Minimum distance to prevent particles from getting too close

        if (distance > minDistance) {
          velocities[i * 3] += direction.x * attractionForce;
          velocities[i * 3 + 1] += direction.y * attractionForce;
          velocities[i * 3 + 2] += direction.z * attractionForce;
        }

        // Update positions based on velocities
        positionsArray[i * 3] += velocities[i * 3];
        positionsArray[i * 3 + 1] += velocities[i * 3 + 1];
        positionsArray[i * 3 + 2] += velocities[i * 3 + 2];

        // Apply smoother damping to velocities for fluid motion
        velocities[i * 3] *= dampingFactor;
        velocities[i * 3 + 1] *= dampingFactor;
        velocities[i * 3 + 2] *= dampingFactor;

        // Boundary checks to keep particles within screen bounds
        const screenBounds = 50; // Adjust based on your scene size
        positionsArray[i * 3] = THREE.MathUtils.clamp(
          positionsArray[i * 3],
          -screenBounds,
          screenBounds
        );
        positionsArray[i * 3 + 1] = THREE.MathUtils.clamp(
          positionsArray[i * 3 + 1],
          -screenBounds,
          screenBounds
        );
        positionsArray[i * 3 + 2] = THREE.MathUtils.clamp(
          positionsArray[i * 3 + 2],
          -screenBounds,
          screenBounds
        );

        // Update color based on distance from mouse
        const updatedDistance = particlePos.distanceTo(mousePos.current);
        colorsArray[i * 3] = 0.1;
        colorsArray[i * 3 + 1] = 0.1;
        colorsArray[i * 3 + 2] = THREE.MathUtils.clamp(
          1.0 - updatedDistance * 0.015,
          0,
          1
        );

        // Regenerate particle if it's too close to the mouse
        const currentDistance = particlePos.distanceTo(mousePos.current);
        if (currentDistance < 5.0) {
          generateNewParticle(i);
        }
      }

      // Flag attributes as needing update
      particleGeometry.attributes.position.needsUpdate = true;
      particleGeometry.attributes.color.needsUpdate = true;

      // Render the scene with post-processing
      composer.render();
    };

    animate();

    // Event Handlers
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      composer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleMouseMove = (event) => {
      updateMousePosition(event, camera);
    };

    const handleTouchMove = (event) => {
      updateMousePosition(event, camera);
    };

    // Add Event Listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);

    // Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      // Dispose Three.js resources
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, [updateMousePosition]);

  return (
    <canvas ref={canvasRef} className="fixed top-0 left-0 w-screen h-screen" />
  );
};

export default ParticleCanvas;
