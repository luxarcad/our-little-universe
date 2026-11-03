
import { useEffect, useRef } from "react";
import * as THREE from "three";

import {
  generateShape,
  generateText,
} from "../utils/shapes";

const PALETTES = {
  love: ["#ff87bd", "#fff1df"],
  sun: ["#ffbc71", "#fff4c6"],
  moon: ["#b9b8ff", "#f1eeff"],
  star: ["#80d7ff", "#fff5d7"],
  flower: ["#e9b6ff", "#ffffff"],
};

const TEXTS = {
  sun: "MI SOL",
  moon: "MI LUNA",
  star: "MI ESTRELLA",
};

const vertexShader = `
  attribute float aSize;
  attribute vec3 color;

  uniform float uPulse;

  varying vec3 vColor;

  void main() {
    vColor = color;

    vec4 viewPosition =
      modelViewMatrix * vec4(position, 1.0);

    gl_PointSize = min(
      18.0,
      aSize *
      (52.0 / max(1.0, -viewPosition.z)) *
      (1.0 + uPulse * 0.65)
    );

    gl_Position =
      projectionMatrix * viewPosition;
  }
`;

const fragmentShader = `
  precision highp float;

  varying vec3 vColor;

  uniform float uPulse;

  void main() {
    vec2 p = gl_PointCoord - vec2(0.5);

    float distanceToCenter = length(p);

    float glow = exp(
      -14.0 * distanceToCenter * distanceToCenter
    );

    float edge = 1.0 - smoothstep(
      0.28,
      0.5,
      distanceToCenter
    );

    float alpha = glow * edge * 0.9;

    vec3 finalColor =
      vColor * (1.0 + uPulse * 0.4);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

function getTargets(scene, count) {
  if (scene.endsWith("-text")) {
    const type = scene.replace("-text", "");

    return generateText(TEXTS[type], count);
  }

  return generateShape(scene, count);
}

export default function ParticleUniverse({
  scene,
  readAudio,
}) {
  const containerRef = useRef(null);
  const runtimeRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 700;
    const count = isMobile ? 1800 : 3400;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.75)
    );

    renderer.setClearColor(0x000000, 0);

    container.appendChild(renderer.domElement);

    const threeScene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      42,
      1,
      0.1,
      100
    );

    camera.position.z = 22;

    // ----------------------------------------
    // Partículas principales
    // ----------------------------------------

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const j = i * 3;

      positions[j] = (Math.random() - 0.5) * 24;
      positions[j + 1] = (Math.random() - 0.5) * 14;
      positions[j + 2] = (Math.random() - 0.5) * 8;

      sizes[i] = 1.1 + Math.random() * 1.6;
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );

    geometry.setAttribute(
      "aSize",
      new THREE.BufferAttribute(sizes, 1)
    );

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPulse: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(
      geometry,
      material
    );

    threeScene.add(particles);

    // ----------------------------------------
    // Campo de estrellas secundario
    // ----------------------------------------

    const starCount = isMobile ? 450 : 950;
    const starPositions = new Float32Array(
      starCount * 3
    );

    for (let i = 0; i < starCount; i++) {
      const j = i * 3;

      starPositions[j] = (Math.random() - 0.5) * 45;
      starPositions[j + 1] = (Math.random() - 0.5) * 30;
      starPositions[j + 2] = -10 - Math.random() * 8;
    }

    const starGeometry = new THREE.BufferGeometry();

    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      color: 0xc6c9ff,
      size: 0.065,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const stars = new THREE.Points(
      starGeometry,
      starMaterial
    );

    threeScene.add(stars);

    // ----------------------------------------
    // Estado del motor
    // ----------------------------------------

    const pointer = {
      x: 0,
      y: 0,
      active: false,
      burst: 0,
    };

    let scale = 1;
    let animationId;

    const runtime = {
      count,
      targets: getTargets(scene, count),

      setScene(nextScene) {
        this.targets = getTargets(nextScene, count);

        const key = nextScene.replace("-text", "");
        const palette = PALETTES[key] || PALETTES.love;

        const firstColor = new THREE.Color(palette[0]);
        const secondColor = new THREE.Color(palette[1]);
        const mixed = new THREE.Color();

        for (let i = 0; i < count; i++) {
          mixed.copy(firstColor).lerp(
            secondColor,
            Math.random()
          );

          const j = i * 3;

          colors[j] = mixed.r;
          colors[j + 1] = mixed.g;
          colors[j + 2] = mixed.b;
        }

        geometry.attributes.color.needsUpdate = true;
      },
    };

    runtimeRef.current = runtime;
    runtime.setScene(scene);

    // ----------------------------------------
    // Responsividad
    // ----------------------------------------

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (!width || !height) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);

      // Las palabras deben entrar en móviles.
      scale = Math.min(
        1,
        Math.max(0.42, width / 840)
      );

      particles.scale.setScalar(scale);
    };

    resize();
    window.addEventListener("resize", resize);

    // ----------------------------------------
    // Interacción con mouse y tacto
    // ----------------------------------------

    const onPointerMove = (event) => {
      const rect = container.getBoundingClientRect();

      const nx =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

      const ny =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

      pointer.active =
        nx >= -1 && nx <= 1 &&
        ny >= -1 && ny <= 1;

      const visibleHeight =
        2 *
        Math.tan((camera.fov * Math.PI) / 360) *
        camera.position.z;

      pointer.x =
        (nx * visibleHeight * camera.aspect / 2) / scale;

      pointer.y =
        (ny * visibleHeight / 2) / scale;
    };

    const onPointerDown = (event) => {
      if (event.target !== renderer.domElement) return;

      onPointerMove(event);
      pointer.burst = 1;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    window.addEventListener(
      "pointermove",
      onPointerMove,
      { passive: true }
    );

    window.addEventListener(
      "pointerdown",
      onPointerDown,
      { passive: true }
    );

    window.addEventListener("blur", onPointerLeave);

    // ----------------------------------------
    // Animación
    // ----------------------------------------

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (document.hidden) return;

      const time = performance.now() * 0.001;

      const { level, bass } = readAudio();

      const pulse = Math.min(
        1.5,
        bass * 1.7 + level * 0.5
      );

      material.uniforms.uPulse.value = pulse;

      const target = runtime.targets;

      const breath = reducedMotion
        ? 1
        : 1 + Math.sin(time * 0.9) * 0.025 +
          bass * 0.08;

      const radius = 2.6;

      for (let i = 0; i < count; i++) {
        const j = i * 3;

        let tx = target[j] * breath;
        let ty = target[j + 1] * breath;
        let tz = target[j + 2];

        if (pointer.active && !reducedMotion) {
          const dx = tx - pointer.x;
          const dy = ty - pointer.y;

          const distance = Math.hypot(dx, dy);

          if (distance > 0.001 && distance < radius) {
            const strength =
              (1 - distance / radius) * 1.5;

            tx += (dx / distance) * strength;
            ty += (dy / distance) * strength;
          }
        }

        if (!reducedMotion) {
          tx += Math.sin(time + i * 0.37) * 0.012;
          ty += Math.cos(time * 0.7 + i) * 0.012;

          const expansion =
            pointer.burst * 0.45 + bass * 0.12;

          tx += target[j] * expansion;
          ty += target[j + 1] * expansion;
        }

        const ease = reducedMotion ? 0.16 : 0.052;

        positions[j] += (tx - positions[j]) * ease;
        positions[j + 1] += (ty - positions[j + 1]) * ease;
        positions[j + 2] += (tz - positions[j + 2]) * ease;
      }

      geometry.attributes.position.needsUpdate = true;

      pointer.burst *= 0.91;

      if (!reducedMotion) {
        particles.rotation.y =
          Math.sin(time * 0.22) * 0.045;

        particles.rotation.x =
          Math.cos(time * 0.17) * 0.025;

        stars.rotation.z = time * 0.0006;
      }

      renderer.render(threeScene, camera);
    };

    animate();

    // ----------------------------------------
    // Limpieza para React
    // ----------------------------------------

    return () => {
      cancelAnimationFrame(animationId);

      window.removeEventListener("resize", resize);
      window.removeEventListener(
        "pointermove",
        onPointerMove
      );
      window.removeEventListener(
        "pointerdown",
        onPointerDown
      );
      window.removeEventListener(
        "blur",
        onPointerLeave
      );

      geometry.dispose();
      material.dispose();

      starGeometry.dispose();
      starMaterial.dispose();

      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      runtimeRef.current = null;
    };
  }, [readAudio]);

  // Cambia la figura sin recrear el canvas WebGL.
  useEffect(() => {
    runtimeRef.current?.setScene(scene);
  }, [scene]);

  return (
    <div
      className="particle-universe"
      ref={containerRef}
      aria-hidden="true"
    />
  );
}
