import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const TEXTURE_URL = '/assets/bg/mars_globe.jpg';
const MAX_TILT = 0.38;
const LERP = 0.06;
const IDLE_SPIN = 0.00055;
const LOOK_YAW = 0.55;
const LOOK_PITCH = 0.28;
const DRAG_YAW = 0.0055;
const DRAG_PITCH = 0.004;

type MarsGlobeProps = {
  className?: string;
  reduceMotion?: boolean;
};

/**
 * Interactive Three.js Mars sphere for the title menu (left hero).
 * Mouse look + drag/touch rotate with smooth lerp; idle spin when idle.
 */
export function MarsGlobe({
  className = '',
  reduceMotion = false,
}: MarsGlobeProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    // Pull camera back so the full opaque sphere fits with a little rim padding.
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.02, 3.55);

    function useStaticGlobe() {
      host!.classList.add('title-mars--fallback');
      return () => host!.classList.remove('title-mars--fallback');
    }
    if (
      typeof WebGLRenderingContext === 'undefined' &&
      typeof WebGL2RenderingContext === 'undefined'
    )
      return useStaticGlobe();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return useStaticGlobe();
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    // Soft star field behind Mars.
    const starCount = 420;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const r = 8 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi) - 6;
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xdce9ff,
      size: 0.035,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // Key light from the right (menu side) — lit limb, shadowed left.
    const ambient = new THREE.AmbientLight(0x5a4034, 0.42);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffe6cc, 1.85);
    key.position.set(3.6, 1.4, 2.2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x4a6aaa, 0.22);
    fill.position.set(-3.2, -0.6, -1.2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff8a45, 0.4);
    rim.position.set(-2.4, 0.5, -2.6);
    scene.add(rim);

    const marsGeo = new THREE.SphereGeometry(1, 64, 64);
    const marsMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.04,
      transparent: false,
      opacity: 1,
      depthWrite: true,
    });
    const mars = new THREE.Mesh(marsGeo, marsMat);
    mars.renderOrder = 0;
    root.add(mars);

    // Atmosphere only on a thin shell — never fades the solid Mars surface.
    const atmoGeo = new THREE.SphereGeometry(1.05, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xff7a35),
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    atmosphere.renderOrder = 1;
    root.add(atmosphere);

    const glowGeo = new THREE.SphereGeometry(1.1, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xff8a40),
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.renderOrder = 2;
    root.add(glow);

    const loader = new THREE.TextureLoader();
    let texture: THREE.Texture | null = null;
    loader.load(
      TEXTURE_URL,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        marsMat.map = tex;
        marsMat.needsUpdate = true;
        texture = tex;
      },
      undefined,
      () => {
        marsMat.color.set(0xc45a2a);
      },
    );

    // Centered in the left slot; slight yaw so the lit face reads toward the menu.
    root.rotation.y = 0.25;
    root.rotation.x = 0.06;
    root.position.set(0, 0, 0);

    const target = { yaw: root.rotation.y, pitch: root.rotation.x };
    const look = { x: 0, y: 0 };
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let idle = true;
    let raf = 0;
    let disposed = false;

    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();

    const pointerNorm = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((clientY - rect.top) / rect.height) * 2 - 1;
      return {
        x: Math.max(-1, Math.min(1, nx)),
        y: Math.max(-1, Math.min(1, ny)),
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (reduceMotion) return;
      const n = pointerNorm(e.clientX, e.clientY);
      look.x = n.x;
      look.y = n.y;

      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        target.yaw += dx * DRAG_YAW;
        target.pitch = Math.max(
          -MAX_TILT,
          Math.min(MAX_TILT, target.pitch + dy * DRAG_PITCH),
        );
        idle = false;
      } else {
        target.yaw = 0.25 + look.x * LOOK_YAW;
        target.pitch = Math.max(
          -MAX_TILT,
          Math.min(MAX_TILT, 0.06 + look.y * LOOK_PITCH),
        );
        idle = false;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (reduceMotion) return;
      dragging = true;
      idle = false;
      lastX = e.clientX;
      lastY = e.clientY;
      host.setPointerCapture(e.pointerId);
    };

    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      try {
        host.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      window.setTimeout(() => {
        if (!dragging) idle = true;
      }, 900);
    };

    const onPointerLeave = () => {
      if (!dragging) {
        look.x = 0;
        look.y = 0;
        idle = true;
      }
    };

    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('pointerup', onPointerUp);
    host.addEventListener('pointercancel', onPointerUp);
    host.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', resize);

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => resize())
        : null;
    ro?.observe(host);

    const tick = () => {
      if (disposed) return;
      raf = window.requestAnimationFrame(tick);

      if (!reduceMotion) {
        if (idle && !dragging) {
          target.yaw += IDLE_SPIN;
          target.pitch += (0.06 - target.pitch) * 0.01;
        }
        root.rotation.y += (target.yaw - root.rotation.y) * LERP;
        root.rotation.x += (target.pitch - root.rotation.x) * LERP;
        stars.rotation.y += 0.00015;
      }

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      ro?.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointerup', onPointerUp);
      host.removeEventListener('pointercancel', onPointerUp);
      host.removeEventListener('pointerleave', onPointerLeave);

      marsGeo.dispose();
      atmoGeo.dispose();
      glowGeo.dispose();
      starsGeo.dispose();
      marsMat.dispose();
      atmoMat.dispose();
      glowMat.dispose();
      starsMat.dispose();
      texture?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [reduceMotion]);

  return (
    <div
      ref={hostRef}
      className={`title-mars ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
