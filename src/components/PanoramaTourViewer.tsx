import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Compass,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { HeritageSite, PanoramaHotspot, PanoramaViewpoint } from '../data/heritageSites';

interface PanoramaTourViewerProps {
  site: HeritageSite;
  activeHotspotId?: string | null;
  onSelectHotspot?: (hotspot: PanoramaHotspot | null) => void;
  onListenChapter?: (chapterIndex: number) => void;
}

interface ProjectedHotspot {
  hotspot: PanoramaHotspot;
  x: number;
  y: number;
  visible: boolean;
}

const _vec3 = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function sampleRowAverageColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  rows: number,
  fallback: string
): string {
  try {
    const data = ctx.getImageData(x, y, w, rows).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 16) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    if (!count) return fallback;
    return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
  } catch {
    return fallback;
  }
}

function applySubtleUnsharpMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  startY: number,
  bandHeight: number,
  strength = 0.28
) {
  try {
    const imgData = ctx.getImageData(0, startY, width, bandHeight);
    const src = imgData.data;
    const copy = new Uint8ClampedArray(src);
    const stride = width * 4;

    for (let y = 1; y < bandHeight - 1; y++) {
      const rowOffset = y * stride;
      for (let x = 1; x < width - 1; x++) {
        const idx = rowOffset + x * 4;
        for (let c = 0; c < 3; c++) {
          const i = idx + c;
          const center = copy[i];
          const avg =
            (copy[i - 4] +
              copy[i + 4] +
              copy[i - stride] +
              copy[i + stride]) *
            0.25;
          const sharpened = center + (center - avg) * strength;
          src[i] = sharpened < 0 ? 0 : sharpened > 255 ? 255 : sharpened;
        }
      }
    }
    ctx.putImageData(imgData, 0, startY);
  } catch {
    // Skip safely if tainted canvas ever occurs
  }
}

function buildSeamlessEquirectangularTexture(
  img: HTMLImageElement,
  tint: PanoramaViewpoint['atmosphereTint'],
  maxAnisotropy: number,
  maxTextureSize = 4096
): THREE.CanvasTexture {
  const width = maxTextureSize >= 4096 ? 4096 : 2048;
  const height = width / 2;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const halfWidth = width / 2;
    const srcAspect =
      img.naturalWidth && img.naturalHeight
        ? img.naturalWidth / img.naturalHeight
        : 16 / 9;
    const bandHeight = Math.min(
      Math.round(height * 0.78),
      Math.max(Math.round(height * 0.56), Math.round(halfWidth / srcAspect))
    );
    const bandTop = Math.round((height - bandHeight) / 2);

    // Draw front half (0..180 deg) and mirrored rear half (180..360 deg) first so we can sample true horizon edges
    ctx.drawImage(img, 0, bandTop, halfWidth, bandHeight);
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, bandTop, halfWidth, bandHeight);
    ctx.restore();

    // Sample true top sky & bottom stone colors directly from photograph for seamless horizon continuity
    const topEdgeColor = sampleRowAverageColor(
      ctx,
      0,
      bandTop + 4,
      halfWidth,
      3,
      tint === 'dawn' ? '#9EB3C4' : '#8BA4BA'
    );
    const bottomEdgeColor = sampleRowAverageColor(
      ctx,
      0,
      bandTop + bandHeight - 6,
      halfWidth,
      3,
      '#6E5F52'
    );

    // Apply subtle optical sharpening exclusively to the photographic panorama band
    applySubtleUnsharpMask(ctx, width, bandTop, bandHeight, 0.28);

    // Fill sky zenith seamlessly from sampled upper photo tone
    const skyGrad = ctx.createLinearGradient(0, 0, 0, bandTop + 12);
    skyGrad.addColorStop(
      0,
      tint === 'dawn' ? '#3B5674' : tint === 'courtyard' ? '#446180' : '#325173'
    );
    skyGrad.addColorStop(1, topEdgeColor);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, bandTop + 6);

    // Fill ground nadir seamlessly from sampled lower photo tone
    const groundTop = bandTop + bandHeight - 6;
    const groundGrad = ctx.createLinearGradient(0, groundTop, 0, height);
    groundGrad.addColorStop(0, bottomEdgeColor);
    groundGrad.addColorStop(1, '#332A23');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundTop, width, height - groundTop);

    // Minimal ultra-clean edge blend (only 28px at 4096w) preserving upper spires & paving detail
    const featherPx = Math.round(height * 0.025);
    const topFeather = ctx.createLinearGradient(0, bandTop, 0, bandTop + featherPx);
    topFeather.addColorStop(0, topEdgeColor);
    topFeather.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topFeather;
    ctx.fillRect(0, bandTop, width, featherPx);

    const bottomFeather = ctx.createLinearGradient(
      0,
      bandTop + bandHeight - featherPx,
      0,
      bandTop + bandHeight
    );
    bottomFeather.addColorStop(0, 'rgba(0,0,0,0)');
    bottomFeather.addColorStop(1, bottomEdgeColor);
    ctx.fillStyle = bottomFeather;
    ctx.fillRect(0, bandTop + bandHeight - featherPx, width, featherPx);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(16, maxAnisotropy);
  texture.needsUpdate = true;
  return texture;
}

function sphericalDegToWorld(yawDeg: number, pitchDeg: number, radius = 420, out = new THREE.Vector3()): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - pitchDeg);
  const theta = THREE.MathUtils.degToRad(yawDeg);
  out.x = radius * Math.sin(phi) * Math.sin(theta);
  out.y = radius * Math.cos(phi);
  out.z = -radius * Math.sin(phi) * Math.cos(theta);
  return out;
}

export const PanoramaTourViewer: React.FC<PanoramaTourViewerProps> = ({
  site,
  activeHotspotId,
  onSelectHotspot,
  onListenChapter,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedViewpointId, setSelectedViewpointId] = useState<string>(site.viewpoints[0]?.id ?? '');
  const [selectedHotspot, setSelectedHotspot] = useState<PanoramaHotspot | null>(null);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [headingDeg, setHeadingDeg] = useState<number>(0);
  const [fovDisplay, setFovDisplay] = useState<number>(
    Math.min(site.viewpoints[0]?.defaultFov ?? 58, 58)
  );
  const [textureReady, setTextureReady] = useState<boolean>(false);
  const [webglFailed, setWebglFailed] = useState<boolean>(false);
  const [projectedHotspots, setProjectedHotspots] = useState<ProjectedHotspot[]>([]);

  // Mutable camera target & current orientation stored in refs so UI state updates never reset WebGL
  const initialFov = Math.min(site.viewpoints[0]?.defaultFov ?? 58, 58);
  const cameraStateRef = useRef({
    yaw: site.viewpoints[0]?.initialYaw ?? 0,
    pitch: THREE.MathUtils.clamp(site.viewpoints[0]?.initialPitch ?? 2, -24, 28),
    fov: initialFov,
    targetYaw: site.viewpoints[0]?.initialYaw ?? 0,
    targetPitch: THREE.MathUtils.clamp(site.viewpoints[0]?.initialPitch ?? 2, -24, 28),
    targetFov: initialFov,
    isDragging: false,
    lastPointerX: 0,
    lastPointerY: 0,
  });

  const autoRotateRef = useRef(isAutoRotate);
  autoRotateRef.current = isAutoRotate;

  const activeViewpointRef = useRef<PanoramaViewpoint>(site.viewpoints[0]);
  const currentViewpoint =
    site.viewpoints.find((vp) => vp.id === selectedViewpointId) || site.viewpoints[0];
  activeViewpointRef.current = currentViewpoint;

  const siteRef = useRef(site);
  siteRef.current = site;

  const requestRenderRef = useRef<(() => void) | null>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const maxAnisotropyRef = useRef<number>(8);
  const maxTextureSizeRef = useRef<number>(4096);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  // Sync external hotspot selection
  useEffect(() => {
    if (!activeHotspotId) return;
    const found = site.hotspots.find((h) => h.id === activeHotspotId);
    if (found) {
      setSelectedViewpointId(found.viewpointId);
      setSelectedHotspot(found);
      cameraStateRef.current.targetYaw = found.yaw;
      cameraStateRef.current.targetPitch = THREE.MathUtils.clamp(found.pitch, -24, 28);
      cameraStateRef.current.targetFov = 46;
      requestRenderRef.current?.();
    }
  }, [activeHotspotId, site]);

  // Reset viewpoint when site changes
  useEffect(() => {
    const first = site.viewpoints[0];
    if (!first) return;
    const nextFov = Math.min(first.defaultFov, 58);
    const nextPitch = THREE.MathUtils.clamp(first.initialPitch, -24, 28);
    setSelectedViewpointId(first.id);
    setSelectedHotspot(null);
    cameraStateRef.current.yaw = first.initialYaw;
    cameraStateRef.current.pitch = nextPitch;
    cameraStateRef.current.fov = nextFov;
    cameraStateRef.current.targetYaw = first.initialYaw;
    cameraStateRef.current.targetPitch = nextPitch;
    cameraStateRef.current.targetFov = nextFov;
    setFovDisplay(nextFov);
  }, [site]);

  // Initialize Three.js panorama sphere once per site image / mount
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    const dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(isSoftwareGl ? Math.min(dpr, 1.5) : Math.min(dpr, 2));
    renderer.setSize(mount.clientWidth || 960, mount.clientHeight || 540);
    maxAnisotropyRef.current = renderer.capabilities.getMaxAnisotropy();
    maxTextureSizeRef.current = renderer.capabilities.maxTextureSize || 4096;

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#2B2622');

    const camera = new THREE.PerspectiveCamera(
      cameraStateRef.current.fov,
      (mount.clientWidth || 960) / (mount.clientHeight || 540),
      0.1,
      1200
    );
    camera.position.set(0, 0, 0);

    // High-tessellation inverted panorama sphere for precision architectural lines
    const geometry = new THREE.SphereGeometry(500, 128, 72);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    materialRef.current = material;

    const sphere = new THREE.Mesh(geometry, material);
    // Align center of front image (u=0.25) with yaw=0 (-Z)
    sphere.rotation.y = Math.PI / 2;
    scene.add(sphere);

    let disposed = false;
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    const updateHotspotProjections = () => {
      const width = mount.clientWidth || 960;
      const height = mount.clientHeight || 540;
      const vpId = activeViewpointRef.current?.id;
      const relevant = siteRef.current.hotspots.filter((h) => h.viewpointId === vpId);

      const projected: ProjectedHotspot[] = relevant.map((hs) => {
        sphericalDegToWorld(hs.yaw, hs.pitch, 420, _vec3);
        _vec3.project(camera);
        const visible = _vec3.z < 1 && _vec3.x >= -0.94 && _vec3.x <= 0.94 && _vec3.y >= -0.88 && _vec3.y <= 0.88;
        return {
          hotspot: hs,
          x: ((_vec3.x + 1) / 2) * width,
          y: ((-_vec3.y + 1) / 2) * height,
          visible,
        };
      });
      setProjectedHotspots(projected);
    };

    const afterDraw = (cb: () => void) => {
      try {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (gl && typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (disposed) return;
            const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
            if (state === gl.UNSIGNALED) {
              frameId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              frameId = window.setTimeout(cb, 80);
            }
          };
          frameId = window.setTimeout(poll, 5);
          return;
        }
      } catch {
        // Fallback when fenceSync unavailable
      }
      frameId = window.setTimeout(cb, 80);
    };

    const drawFrame = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;

      const state = cameraStateRef.current;

      if (autoRotateRef.current && !state.isDragging && !isSoftwareGl && !prefersReducedMotion) {
        state.targetYaw += dt * 7.5;
      }

      const lambda = isSoftwareGl || prefersReducedMotion ? 28 : 10;
      state.yaw = THREE.MathUtils.damp(state.yaw, state.targetYaw, lambda, dt);
      state.pitch = THREE.MathUtils.damp(state.pitch, state.targetPitch, lambda, dt);
      state.fov = THREE.MathUtils.damp(state.fov, state.targetFov, lambda, dt);

      if (Math.abs(camera.fov - state.fov) > 0.05) {
        camera.fov = state.fov;
        camera.updateProjectionMatrix();
      }

      sphericalDegToWorld(state.yaw, state.pitch, 100, _vec3);
      camera.lookAt(_vec3);
      camera.updateMatrixWorld();

      renderer.render(scene, camera);
      updateHotspotProjections();

      const normHeading = (((Math.round(state.yaw) % 360) + 360) % 360);
      setHeadingDeg(normHeading);
      setFovDisplay(Math.round(state.fov));

      const stillSettling =
        Math.abs(state.yaw - state.targetYaw) > 0.08 ||
        Math.abs(state.pitch - state.targetPitch) > 0.08 ||
        Math.abs(state.fov - state.targetFov) > 0.08 ||
        (autoRotateRef.current && !isSoftwareGl && !prefersReducedMotion);

      if (stillSettling) {
        renderDirty = true;
      }
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        drawFrame();
        const done = () => {
          renderBusy = false;
          if (renderDirty && !disposed) {
            requestRender();
          }
        };
        if (isSoftwareGl) {
          afterDraw(done);
        } else {
          done();
        }
      });
    };

    requestRenderRef.current = requestRender;

    // Load panoramic artwork into seamless canvas texture
    setTextureReady(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (disposed) return;
      loadedImageRef.current = img;
      const oldTex = material.map;
      material.map = buildSeamlessEquirectangularTexture(
        img,
        activeViewpointRef.current?.atmosphereTint ?? 'golden',
        maxAnisotropyRef.current,
        maxTextureSizeRef.current
      );
      material.needsUpdate = true;
      if (oldTex) oldTex.dispose();
      setTextureReady(true);
      requestRender();
    };
    img.onerror = () => {
      if (!disposed) setWebglFailed(true);
    };
    img.src = site.panoramaImage;

    const handleResize = () => {
      if (!mount || disposed) return;
      const w = mount.clientWidth || 960;
      const h = mount.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    const onContextRestored = () => {
      setWebglFailed(false);
      requestRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      if (material.map) material.map.dispose();
      material.dispose();
      geometry.dispose();
      renderer.dispose();
      requestRenderRef.current = null;
      materialRef.current = null;
    };
  }, [site.id, site.panoramaImage]);

  // Update texture atmosphere tint when switching viewpoints
  useEffect(() => {
    const img = loadedImageRef.current;
    const mat = materialRef.current;
    if (!img || !mat || !currentViewpoint) return;

    const oldTex = mat.map;
    mat.map = buildSeamlessEquirectangularTexture(
      img,
      currentViewpoint.atmosphereTint,
      maxAnisotropyRef.current,
      maxTextureSizeRef.current
    );
    mat.needsUpdate = true;
    if (oldTex) oldTex.dispose();
    requestRenderRef.current?.();
  }, [selectedViewpointId, currentViewpoint]);

  // Keyboard shortcuts: Arrow keys to pan, +/- to zoom, H to toggle Zen controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      if (e.key === 'h' || e.key === 'H') {
        setControlsVisible((v) => !v);
      } else if (e.key === 'ArrowLeft') {
        cameraStateRef.current.targetYaw -= 8;
        requestRenderRef.current?.();
      } else if (e.key === 'ArrowRight') {
        cameraStateRef.current.targetYaw += 8;
        requestRenderRef.current?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleSelectViewpoint = useCallback((vp: PanoramaViewpoint) => {
    setSelectedViewpointId(vp.id);
    setSelectedHotspot(null);
    onSelectHotspot?.(null);
    cameraStateRef.current.targetYaw = vp.initialYaw;
    cameraStateRef.current.targetPitch = THREE.MathUtils.clamp(vp.initialPitch, -24, 28);
    cameraStateRef.current.targetFov = Math.min(vp.defaultFov, 58);
    requestRenderRef.current?.();
  }, [onSelectHotspot]);

  const handleHotspotClick = useCallback((hs: PanoramaHotspot) => {
    setIsAutoRotate(false);
    setSelectedHotspot(hs);
    onSelectHotspot?.(hs);
    cameraStateRef.current.targetYaw = hs.yaw;
    cameraStateRef.current.targetPitch = THREE.MathUtils.clamp(hs.pitch, -24, 28);
    cameraStateRef.current.targetFov = 46;
    requestRenderRef.current?.();
  }, [onSelectHotspot]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    cameraStateRef.current.isDragging = true;
    cameraStateRef.current.lastPointerX = e.clientX;
    cameraStateRef.current.lastPointerY = e.clientY;
    setIsAutoRotate(false);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cameraStateRef.current.isDragging) return;
    const dx = e.clientX - cameraStateRef.current.lastPointerX;
    const dy = e.clientY - cameraStateRef.current.lastPointerY;
    cameraStateRef.current.lastPointerX = e.clientX;
    cameraStateRef.current.lastPointerY = e.clientY;

    const sensitivity = cameraStateRef.current.fov / 340;
    cameraStateRef.current.targetYaw -= dx * sensitivity;
    cameraStateRef.current.targetPitch = THREE.MathUtils.clamp(
      cameraStateRef.current.targetPitch + dy * sensitivity,
      -24,
      28
    );
    requestRenderRef.current?.();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cameraStateRef.current.isDragging) return;
    cameraStateRef.current.isDragging = false;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    cameraStateRef.current.targetFov = THREE.MathUtils.clamp(
      cameraStateRef.current.targetFov + e.deltaY * 0.04,
      32,
      74
    );
    requestRenderRef.current?.();
  };

  const adjustZoom = (delta: number) => {
    cameraStateRef.current.targetFov = THREE.MathUtils.clamp(
      cameraStateRef.current.targetFov + delta,
      32,
      74
    );
    requestRenderRef.current?.();
  };

  const resetCamera = () => {
    const vp = currentViewpoint;
    if (!vp) return;
    setSelectedHotspot(null);
    onSelectHotspot?.(null);
    cameraStateRef.current.targetYaw = vp.initialYaw;
    cameraStateRef.current.targetPitch = THREE.MathUtils.clamp(vp.initialPitch, -24, 28);
    cameraStateRef.current.targetFov = Math.min(vp.defaultFov, 58);
    requestRenderRef.current?.();
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen denial in restricted iframes
    }
  };

  const cardinalLabel = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
    return dirs[idx];
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-lg border border-stone-300 bg-[#1C1917] select-none ${
        isFullscreen ? 'h-screen rounded-none border-0' : 'h-[480px] lg:h-[580px]'
      }`}
    >
      {/* Dedicated WebGL Mount Container */}
      {!webglFailed ? (
        <div
          ref={mountRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className="h-full w-full cursor-grab active:cursor-grabbing touch-none"
          aria-label={`Interactive 360 degree panorama of ${site.name}`}
        />
      ) : (
        <div className="relative h-full w-full">
          <img
            src={site.panoramaImage}
            alt={site.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover contrast-[1.04] saturate-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        </div>
      )}

      {/* Subtle Loading Overlay */}
      {!textureReady && !webglFailed && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#1C1917]/80">
          <p className="text-sm font-medium tracking-wide text-stone-200">
            Calibrating 360° Horizon Projection…
          </p>
        </div>
      )}

      {/* Top Minimal Viewpoint Caption (unobtrusive, no backdrop-blur over WebGL) */}
      <div className="pointer-events-none absolute left-4 top-4 right-4 z-10 flex items-start justify-between gap-4">
        <div className="pointer-events-auto max-w-md rounded-md bg-[#1C1917]/88 px-3.5 py-2.5 text-stone-100 border border-white/15">
          <p className="text-xs font-medium tracking-wide text-amber-200/90">
            {currentViewpoint?.title}
          </p>
          <p className="mt-0.5 text-xs text-stone-300 line-clamp-1">
            {currentViewpoint?.subtitle}
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setControlsVisible((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1C1917]/88 px-3 py-2 text-xs font-medium text-stone-100 border border-white/15 hover:bg-[#292524] transition-colors whitespace-nowrap shrink-0"
            title="Toggle controls (H)"
          >
            {controlsVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{controlsVisible ? 'Hide Controls' : 'Show Controls'}</span>
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center justify-center rounded-md bg-[#1C1917]/88 p-2 text-stone-100 border border-white/15 hover:bg-[#292524] transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Projected 3D Spatial Hotspots */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {projectedHotspots.map(({ hotspot, x, y, visible }) => {
          if (!visible) return null;
          const isSelected = selectedHotspot?.id === hotspot.id;
          return (
            <button
              key={hotspot.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleHotspotClick(hotspot);
              }}
              style={{
                transform: `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -50%)`,
              }}
              className={`pointer-events-auto absolute left-0 top-0 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-transform duration-150 hover:scale-105 ${
                isSelected
                  ? 'bg-[#9A3412] text-white border border-amber-200/70 shadow-lg'
                  : 'bg-[#1C1917]/90 text-stone-100 border border-white/25 hover:bg-[#9A3412]'
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/15 font-mono text-[11px] font-semibold tabular-nums">
                +
              </span>
              <span className="text-xs font-medium whitespace-nowrap max-w-[180px] truncate">
                {hotspot.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Hotspot Detail Drawer (Compact bottom-left card when active) */}
      {selectedHotspot && (
        <div
          className={`absolute left-4 z-20 w-[min(360px,calc(100%-2rem))] rounded-md bg-[#F8F5F0] p-4 text-[#1C1917] border border-stone-300 shadow-lg transition-all ${
            controlsVisible ? 'bottom-20' : 'bottom-4'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium text-[#9A3412]">
                {selectedHotspot.category} · {selectedHotspot.period}
              </p>
              <h4 className="mt-0.5 font-serif text-xl font-semibold leading-snug text-[#1C1917]">
                {selectedHotspot.title}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedHotspot(null);
                onSelectHotspot?.(null);
              }}
              className="rounded p-1 text-stone-500 hover:bg-stone-200 hover:text-stone-900"
              aria-label="Close hotspot details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-stone-700">
            {selectedHotspot.description}
          </p>
          <p className="mt-2 border-t border-stone-200 pt-2 text-[11px] text-stone-600">
            <span className="font-semibold text-stone-800">Craft Note:</span>{' '}
            {selectedHotspot.architecturalNote}
          </p>
          {onListenChapter && (
            <button
              type="button"
              onClick={() => onListenChapter(selectedHotspot.audioChapterIndex)}
              className="mt-3 inline-flex items-center gap-1.5 rounded bg-[#9A3412] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#7C2D12] transition-colors whitespace-nowrap"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Play Related Audio Chapter</span>
            </button>
          )}
        </div>
      )}

      {/* Collapsible Unified Bottom Control Dock */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3 transition-transform duration-200 ${
          controlsVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        }`}
      >
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#1C1917]/92 px-3 py-2 text-stone-100 border border-white/15 max-w-[940px] w-full">
          {/* Viewpoint Switcher */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {site.viewpoints.map((vp, idx) => {
              const active = vp.id === currentViewpoint?.id;
              return (
                <button
                  key={vp.id}
                  type="button"
                  onClick={() => handleSelectViewpoint(vp)}
                  className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#9A3412] text-white'
                      : 'text-stone-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}. {vp.title.split(' ')[0]} {vp.title.split(' ')[1] || ''}
                </button>
              );
            })}
          </div>

          {/* Camera Tools & Compass Readout */}
          <div className="flex items-center gap-1.5 border-l border-white/15 pl-2.5 shrink-0">
            <div
              className="hidden sm:flex items-center gap-1.5 px-2 text-xs font-mono text-stone-300 tabular-nums"
              title="Compass bearing and field of view"
            >
              <Compass className="h-3.5 w-3.5 text-amber-300" />
              <span>
                {headingDeg}° {cardinalLabel(headingDeg)}
              </span>
              <span className="text-stone-500">·</span>
              <span>{fovDisplay}°</span>
            </div>

            <button
              type="button"
              onClick={() => adjustZoom(-8)}
              className="rounded p-1.5 text-stone-200 hover:bg-white/10 transition-colors"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => adjustZoom(8)}
              className="rounded p-1.5 text-stone-200 hover:bg-white/10 transition-colors"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAutoRotate((r) => !r);
                requestRenderRef.current?.();
              }}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                isAutoRotate
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-400/40'
                  : 'text-stone-200 hover:bg-white/10'
              }`}
              title="Toggle slow 360 pan"
            >
              {isAutoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isAutoRotate ? 'Pause Pan' : 'Auto Pan'}</span>
            </button>
            <button
              type="button"
              onClick={resetCamera}
              className="rounded p-1.5 text-stone-200 hover:bg-white/10 transition-colors"
              aria-label="Reset camera view"
              title="Reset camera view"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
