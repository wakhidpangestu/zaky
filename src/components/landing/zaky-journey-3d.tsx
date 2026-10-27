'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Building2,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  Network,
  Search,
  ChevronRight,
  Coins,
  ShieldCheck,
  FileCheck2,
  Award,
  Layers,
  MapPin,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  DoorOpen,
  DoorClosed,
} from 'lucide-react';
import Link from 'next/link';
import HeroFallback from '@/components/landing/hero-fallback';
import JourneyStepsStatic from '@/components/landing/journey-steps-static';
import { STATIONS } from '@/components/landing/stations-data';
import type { JourneyStation } from '@/components/landing/stations-data';

export { STATIONS };
export type { JourneyStation };

// Register GSAP ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}


interface AnimatedRoomDoor {
  xPos: number;
  leftLeaf: THREE.Group;
  rightLeaf: THREE.Group;
  sensorMesh?: THREE.Mesh;
}

interface ResponsiveCameraSettings {
  aspect: number;
  fov: number;
  heroPosMult: number;
  interiorZOffset: number;
  targetLookAtYOffset: number;
  isMobile: boolean;
  isTablet: boolean;
}

function computeCameraSettings(w: number, h: number): ResponsiveCameraSettings {
  const aspect = w / Math.max(1, h);
  const isMobile = w < 768;
  const isTablet = w >= 768 && w < 1024;

  if (aspect < 0.6) {
    // Tall portrait phone (e.g. iPhone 14/15/16, aspect ~0.46)
    return {
      aspect,
      fov: 48,
      heroPosMult: 1.25,
      interiorZOffset: 6.0,
      targetLookAtYOffset: -2.0,
      isMobile,
      isTablet,
    };
  } else if (aspect < 0.85) {
    // Normal phone portrait & small vertical tablet (aspect 0.6 - 0.85)
    return {
      aspect,
      fov: 44,
      heroPosMult: 1.15,
      interiorZOffset: 4.5,
      targetLookAtYOffset: -1.5,
      isMobile,
      isTablet,
    };
  } else if (aspect < 1.15) {
    // Square / tablet portrait (iPad portrait 768x1024, aspect 0.75)
    return {
      aspect,
      fov: 38,
      heroPosMult: 1.08,
      interiorZOffset: 2.5,
      targetLookAtYOffset: -0.8,
      isMobile,
      isTablet,
    };
  } else if (aspect < 1.45) {
    // Small laptop / tablet landscape
    return {
      aspect,
      fov: 36,
      heroPosMult: 1.02,
      interiorZOffset: 1.0,
      targetLookAtYOffset: -0.3,
      isMobile,
      isTablet,
    };
  } else {
    // Desktop wide / fullscreen (aspect >= 1.45: 16:10, 16:9, ultrawide)
    // Zoomed-out cinematic view showing full grand architecture
    return {
      aspect,
      fov: 35,
      heroPosMult: 1.0,
      interiorZOffset: 0,
      targetLookAtYOffset: 0,
      isMobile,
      isTablet,
    };
  }
}

interface ZakyJourney3DProps {
  onOpenAkadModal?: () => void;
}

export default function ZakyJourney3D({ onOpenAkadModal }: ZakyJourney3DProps) {
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const pinSectionRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const hudCardRef = useRef<HTMLDivElement>(null);
  const topBadgeRef = useRef<HTMLDivElement>(null);
  const scrollTriggerInstanceRef = useRef<ScrollTrigger | null>(null);

  const [activeStep, setActiveStep] = useState<number>(0);
  const [searchKode, setSearchKode] = useState<string>('ZKHTNU9L6XKD');
  const [quickError, setQuickError] = useState<string>('');
  const [isFrontDoorOpen, setIsFrontDoorOpen] = useState<boolean>(false);
  // Penilaian kemampuan perangkat, sekali saat komponen dipasang
  // (komponen ini client-only via next/dynamic ssr:false).
  // - webglAvailable: apakah konteks WebGL2 dapat dibuat.
  // - reducedMotion: preferensi gerak dikurangi dari sistem pengguna.
  const [webglAvailable] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const probe = document.createElement('canvas');
      return !!probe.getContext('webgl2');
    } catch {
      return false;
    }
  });
  const [reducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  // Override pengguna dari kartu pemberitahuan mode statis: paksa coba tur 3D.
  const [force3D, setForce3D] = useState<boolean>(false);
  // Pembuatan renderer gagal saat runtime: kembali ke mode statis secara aman.
  const [renderFailed, setRenderFailed] = useState<boolean>(false);
  // Mode tenang: tur 3D tetap tampil untuk pengguna gerak-dikurangi,
  // dengan gerak kamera yang jauh lebih halus dan animasi elemen dimatikan.
  const calmMode = reducedMotion && !force3D;
  // Mode statis keras HANYA bila tur 3D benar-benar tidak dapat dijalankan
  // (WebGL2 tidak tersedia dan pengguna tidak memaksa, atau renderer gagal).
  const staticMode = renderFailed || (!webglAvailable && !force3D);
  const calmModeRef = useRef<boolean>(calmMode);
  calmModeRef.current = calmMode;
  const [progressPct, setProgressPct] = useState<number>(0);
  const journeyVisibleRef = useRef<boolean>(true);
  const progressPctRef = useRef<number>(0);
  const glowPathMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const [isMobileExpanded, setIsMobileExpanded] = useState<boolean>(false);

  const cameraSettingsRef = useRef<ResponsiveCameraSettings>({
    aspect: 16 / 9,
    fov: 34,
    heroPosMult: 1.0,
    interiorZOffset: 0,
    targetLookAtYOffset: 0,
    isMobile: false,
    isTablet: false,
  });

  // Auto-collapse mobile drawer on step change so user can watch the 3D scene smoothly
  useEffect(() => {
    setIsMobileExpanded(false);
  }, [activeStep]);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  // True bila WebGL berjalan di perender perangkat lunak (SwiftShader/llvmpipe):
  // scene diperlakukan seperti mode tenang (tanpa animasi ambient terus-menerus)
  // dan render berhenti saat adegan diam, agar CPU tidak jenuh.
  const softwareGlRef = useRef<boolean>(false);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const fullBuildingGroupRef = useRef<THREE.Group | null>(null);

  // Animated Door References
  const frontSlideLeftRef = useRef<THREE.Mesh | null>(null);
  const frontSlideRightRef = useRef<THREE.Mesh | null>(null);
  const frontSensorLedRef = useRef<THREE.Mesh | null>(null);
  const roomDoorsRef = useRef<AnimatedRoomDoor[]>([]);

  const charPartsRef = useRef<{
    torso: THREE.Group;
    head: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
  } | null>(null);
  const cryptoCubesRef = useRef<THREE.Group | null>(null);
  const federationGlobeRef = useRef<THREE.Group | null>(null);
  const interiorRoomsGroupRef = useRef<THREE.Group | null>(null);

  // Smooth lerp coordinates
  const currentProgressRef = useRef<number>(0);
  // Default camera angle in Hero: majestic zoomed-out isometric perspective viewing the full building and compound
  const targetCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(27.5, 21.0, 37.0));
  const targetCameraLookAt = useRef<THREE.Vector3>(new THREE.Vector3(3.0, 8.2, 0));
  const currentCameraLookAt = useRef<THREE.Vector3>(new THREE.Vector3(3.0, 8.2, 0));
  // Default character starts on entrance driveway directly aligned with entrance portal
  const targetCharPos = useRef<THREE.Vector3>(new THREE.Vector3(2.7, 0.25, 11.5));
  const entranceCurveRef = useRef<THREE.CatmullRomCurve3>(
    new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(2.7, 0.25, 11.5),
        new THREE.Vector3(2.7, 0.25, 6.5),
        new THREE.Vector3(2.7, 0.25, 4.2),
        new THREE.Vector3(3.8, 0.25, 2.8),
        new THREE.Vector3(11.0, 0.25, 2.8),
        new THREE.Vector3(22.0, 0.25, 2.8),
      ],
      false,
      'catmullrom',
      0.15
    )
  );
  const walkDistanceRef = useRef<number>(0);

  const handleJumpToStep = useCallback((stepIndex: number) => {
    const clamped = Math.max(0, Math.min(6, stepIndex));
    setActiveStep(clamped);

    if (scrollTriggerInstanceRef.current) {
      const st = scrollTriggerInstanceRef.current;
      const progress = clamped === 0 ? 0.0 : 0.12 + ((clamped - 1) / 5) * (0.94 - 0.12);
      const targetScroll = st.start + progress * (st.end - st.start);
      // Pengguna gerak-dikurangi: lompat langsung tanpa animasi gulir.
      window.scrollTo({ top: targetScroll, behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [reducedMotion]);

  // Lewati seluruh tur: gulir ke akhir trek journey (pola referensi: tombol Lewati)
  const handleSkipJourney = useCallback(() => {
    const track = scrollTrackRef.current;
    if (!track) return;
    const trackBottom = track.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({
      top: Math.max(0, trackBottom - window.innerHeight + 4),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [reducedMotion]);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchKode.trim().toUpperCase();
    if (!clean) {
      setQuickError('Masukkan 12 digit kode unik.');
      return;
    }
    window.location.href = `/verifikasi/${clean}`;
  };

  // -------------------------------------------------------------
  // THREE.JS SCENE SETUP & DETAILED 3D MODELING
  // -------------------------------------------------------------
  useEffect(() => {
    if (staticMode) return;
    if (!canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf5f1e6);
    scene.fog = new THREE.FogExp2(0xf5f1e6, 0.007);

    // 2. Camera: Isometric 3D angle with responsive FOV, distance, and visual framing
    const initialSettings = computeCameraSettings(width, height);
    cameraSettingsRef.current = initialSettings;

    const camera = new THREE.PerspectiveCamera(initialSettings.fov, initialSettings.aspect, 0.1, 1000);
    cameraRef.current = camera;

    const initPosX = 27.5 * initialSettings.heroPosMult;
    const initPosY = 21.0 * initialSettings.heroPosMult;
    const initPosZ = 37.0 * initialSettings.heroPosMult;
    const initLookAtY = 8.2 + initialSettings.targetLookAtYOffset;

    camera.position.set(initPosX, initPosY, initPosZ);
    camera.lookAt(3.0, initLookAtY, 0);
    targetCameraPos.current.set(initPosX, initPosY, initPosZ);
    targetCameraLookAt.current.set(3.0, initLookAtY, 0);
    currentCameraLookAt.current.set(3.0, initLookAtY, 0);

    // 3. Renderer - tanpa bayangan; kegagalan WebGL dialihkan ke mode statis.
    // Perender perangkat lunak (SwiftShader/llvmpipe) dideteksi lebih dulu
    // lewat konteks proba sekali pakai: pada perangkat lunak, antialias
    // dimatikan dan adegan berjalan dalam mode hemat (lihat animate()).
    try {
      const proba = document.createElement('canvas').getContext('webgl2') ??
        document.createElement('canvas').getContext('webgl');
      if (proba) {
        const dbg = proba.getExtension('WEBGL_debug_renderer_info');
        const namaRenderer = dbg
          ? String(proba.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
          : '';
        softwareGlRef.current = /swiftshader|llvmpipe|software|basic render/i.test(namaRenderer);
      }
    } catch {
      softwareGlRef.current = false;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !softwareGlRef.current,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setRenderFailed(true);
      return;
    }
    rendererRef.current = renderer;

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, softwareGlRef.current ? 1 : window.innerWidth < 768 ? 1.5 : 1.75)
    );
    renderer.shadowMap.enabled = false; // NO SHADOWS
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // Enforce true 100% full-bleed sizing on canvas DOM element to prevent white blank gaps
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Jeda render saat scene di luar layar (menghemat CPU/baterai)
    let journeyVisObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      journeyVisObserver = new IntersectionObserver(
        (entries) => {
          journeyVisibleRef.current = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.02 }
      );
      journeyVisObserver.observe(container);
    }

    // 4. Lighting: Soft neomorphic ambient + soft sunlight (NO SHADOWS, NO GLOW)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe8f0ec, 0xd0e0d6, 0.5);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbf2, 1.35);
    sunLight.position.set(30, 42, 26);
    scene.add(sunLight);

    // Warm foyer light inside the main entrance tunnel
    const foyerLight = new THREE.PointLight(0xf59e0b, 1.8, 16);
    foyerLight.position.set(4.5, 2.8, 4.0);
    scene.add(foyerLight);

    // Room accent lights
    const accentColors = [0xc8962e, 0x0f5c4d, 0x10b981, 0x38bdf8, 0x10b981, 0x38bdf8];
    [22, 44, 66, 88, 110, 132].forEach((xPos, idx) => {
      const pLight = new THREE.PointLight(accentColors[idx], 1.4, 22);
      pLight.position.set(xPos, 5.5, 2.0);
      scene.add(pLight);
    });

    // -----------------------------------------------------------
    // MATERIALS PALETTE (NEOMORPHISM SOFT MATTE FINISHES, NO GLOW)
    // -----------------------------------------------------------
    const pureWhiteFacadeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0.0,
    });
    const whiteStepMat = new THREE.MeshStandardMaterial({
      color: 0xf4f7f5,
      roughness: 0.6,
      metalness: 0.0,
    });
    const darkEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x0a3d33,
      roughness: 0.5,
      metalness: 0.05,
    });
    const brandEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x0f5c4d,
      roughness: 0.45,
      metalness: 0.05,
    });
    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xc8962e,
      roughness: 0.35,
      metalness: 0.3,
    });
    const windowGlassMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.1,
    });
    const entranceDoorGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0f5c4d,
      roughness: 0.35,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const screenGlowMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.6,
    });
    const glowPathMat = new THREE.MeshStandardMaterial({
      color: 0xc8962e,
      emissive: 0xc8962e,
      emissiveIntensity: 0.55,
      roughness: 0.45,
    });
    glowPathMatRef.current = glowPathMat;
    const warmWoodMat = new THREE.MeshStandardMaterial({
      color: 0x8a624a,
      roughness: 0.6,
    });
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
    });
    const darkSuitMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
    });
    const skinToneMat = new THREE.MeshStandardMaterial({
      color: 0xe8b898,
      roughness: 0.55,
    });

    // Detailed Tree Materials (Architectural Layered Foliage & Date Palms)
    const treeBarkMat = new THREE.MeshStandardMaterial({ color: 0x4e3629, roughness: 0.85 });
    const foliageDeepMat = new THREE.MeshStandardMaterial({ color: 0x0f5132, roughness: 0.75, flatShading: true });
    const foliageLushMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, flatShading: true });
    const foliageLightMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65, flatShading: true });
    const foliageHighlightMat = new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.6, flatShading: true });
    const potSoilMat = new THREE.MeshStandardMaterial({ color: 0x241812, roughness: 0.9 });
    const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.8 });
    const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.65, flatShading: true });
    const datesFruitMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4 });

    // Realistic Character Facial & Uniform Materials
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
    const specularEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyebrowMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const noseShadeMat = new THREE.MeshStandardMaterial({ color: 0xd99875, roughness: 0.6 });
    const lipSmileMat = new THREE.MeshStandardMaterial({ color: 0xb95d52, roughness: 0.45 });
    const blushCheekMat = new THREE.MeshStandardMaterial({ color: 0xf49d82, roughness: 0.7 });
    const songkokVelvetMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.95 });
    const songkokGoldTrimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.5 });
    const shoeLeatherMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.1 });
    const idBadgeMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.4 });
    const hijabMat = new THREE.MeshStandardMaterial({ color: 0x0f5c4d, roughness: 0.65 });

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // -----------------------------------------------------------
    // CONTINUOUS PLAZA, FLOOR, AND VAST EXPANSIVE GROUND
    // Extends far past all camera bounds in fullscreen to completely eliminate any blank white gaps
    // -----------------------------------------------------------
    const vastGround = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 240),
      new THREE.MeshStandardMaterial({ color: 0xedf3f0, roughness: 0.75 })
    );
    vastGround.rotation.x = -Math.PI / 2;
    vastGround.position.set(65, -0.42, 30);
    vastGround.receiveShadow = true;
    worldGroup.add(vastGround);

    const longPlaza = new THREE.Mesh(
      new THREE.BoxGeometry(240, 0.8, 75),
      new THREE.MeshStandardMaterial({ color: 0xedf3f0, roughness: 0.7 })
    );
    longPlaza.position.set(65, -0.4, 15);
    longPlaza.receiveShadow = true;
    worldGroup.add(longPlaza);

    const longFloor = new THREE.Mesh(
      new THREE.BoxGeometry(184, 0.25, 18),
      pureWhiteFacadeMat
    );
    longFloor.position.set(65, 0.12, 0);
    longFloor.receiveShadow = true;
    worldGroup.add(longFloor);

    // Continuous glowing green journey path
    const continuousPath = new THREE.Mesh(
      new THREE.BoxGeometry(165, 0.05, 0.5),
      glowPathMat
    );
    continuousPath.position.set(66, 0.26, 2.8);
    worldGroup.add(continuousPath);

    // Continuous back wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(184, 9.5, 0.6),
      pureWhiteFacadeMat
    );
    backWall.position.set(65, 4.85, -8.5);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    worldGroup.add(backWall);

    const backAccentBand = new THREE.Mesh(
      new THREE.BoxGeometry(184, 0.6, 0.7),
      goldAccentMat
    );
    backAccentBand.position.set(65, 8.8, -8.48);
    worldGroup.add(backAccentBand);

    // -----------------------------------------------------------
    // DYNAMIC AUTOMATIC DOORS FOR EVERY SINGLE ROOM (PINTU OTOMATIS)
    // -----------------------------------------------------------
    roomDoorsRef.current = [];

    const roomDoorTitles = [
      'PINTU 1: LOBI PENERIMAAN',
      'PINTU 2: VALIDASI ASNAF',
      'PINTU 3: OTORISASI 4-MATA',
      'PINTU 4: PENYALURAN & SAKSI',
      'PINTU 5: DATA CENTER KRIPTO',
      'PINTU 6: PAPAN SILANG',
    ];

    const createArchwayDoor = (xPos: number, doorTitle: string): { portalGroup: THREE.Group; doorData: AnimatedRoomDoor } => {
      const portal = new THREE.Group();
      portal.position.set(xPos, 0, 0);

      // White marble partition walls on either side of the doorway
      const wallBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8.5, 6.5), pureWhiteFacadeMat);
      wallBack.position.set(0, 4.35, -4.5);
      wallBack.castShadow = true;
      wallBack.receiveShadow = true;

      const wallFront = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8.5, 4.2), pureWhiteFacadeMat);
      wallFront.position.set(0, 4.35, 5.8);
      wallFront.castShadow = true;
      wallFront.receiveShadow = true;

      // Arched lintel over the doorway (Z = 1.0 to 4.6)
      const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.2, 5.2), pureWhiteFacadeMat);
      doorLintel.position.set(0, 6.8, 2.8);
      doorLintel.castShadow = true;

      // Gold Islamic Arch Lintel Trim
      const archTrim = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 5.4), goldAccentMat);
      archTrim.position.set(0, 5.1, 2.8);

      // PHYSICAL GOLD DOOR FRAME (Kusen Pintu)
      const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 4.0), goldAccentMat);
      frameTop.position.set(0, 4.9, 2.8);
      const framePostL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.8, 0.2), goldAccentMat);
      framePostL.position.set(0, 2.5, 0.9);
      const framePostR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.8, 0.2), goldAccentMat);
      framePostR.position.set(0, 2.5, 4.7);

      // AUTOMATIC SENSOR LED BAR ABOVE DOOR
      const sensorBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 1.2), darkEmeraldMat);
      sensorBox.position.set(0, 5.0, 2.8);
      const sensorLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xc8962e })
      );
      sensorLed.position.set(0.26, 5.0, 2.8);

      // DYNAMIC DOUBLE DOOR LEAVES (Closed by default, swing open when hero approaches!)
      // Left Door Leaf Pivot (Z = 1.0)
      const leftDoorLeaf = new THREE.Group();
      leftDoorLeaf.position.set(0, 0, 1.0);
      leftDoorLeaf.rotation.y = 0; // Starts CLOSED
      const leftDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.7, 1.8), brandEmeraldMat);
      leftDoorPanel.position.set(0, 2.45, 0.9);
      leftDoorPanel.castShadow = true;
      const handleL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 8), goldAccentMat);
      handleL.position.set(0.12, 2.3, 1.65);
      leftDoorLeaf.add(leftDoorPanel, handleL);

      // Right Door Leaf Pivot (Z = 4.6)
      const rightDoorLeaf = new THREE.Group();
      rightDoorLeaf.position.set(0, 0, 4.6);
      rightDoorLeaf.rotation.y = 0; // Starts CLOSED
      const rightDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.7, 1.8), brandEmeraldMat);
      rightDoorPanel.position.set(0, 2.45, -0.9);
      rightDoorPanel.castShadow = true;
      const handleR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 8), goldAccentMat);
      handleR.position.set(0.12, 2.3, -1.65);
      rightDoorLeaf.add(rightDoorPanel, handleR);

      // PINTU SIGNAGE PLAQUE (Plakat Nama Pintu di Atas Kusen)
      const signPlaque = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 3.4), darkEmeraldMat);
      signPlaque.position.set(0.28, 5.5, 2.8);
      const signBorder = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 3.48), goldAccentMat);
      signBorder.position.set(0.27, 5.5, 2.8);

      portal.add(
        wallBack,
        wallFront,
        doorLintel,
        archTrim,
        frameTop,
        framePostL,
        framePostR,
        sensorBox,
        sensorLed,
        leftDoorLeaf,
        rightDoorLeaf,
        signBorder,
        signPlaque
      );

      const doorData: AnimatedRoomDoor = {
        xPos,
        leftLeaf: leftDoorLeaf,
        rightLeaf: rightDoorLeaf,
        sensorMesh: sensorLed,
      };

      return { portalGroup: portal, doorData };
    };

    // Group for all interior rooms and corridor doors (hidden at Station 0 exterior)
    const interiorRoomsGroup = new THREE.Group();
    interiorRoomsGroup.visible = false;
    interiorRoomsGroupRef.current = interiorRoomsGroup;
    worldGroup.add(interiorRoomsGroup);

    const doorPositions = [11, 33, 55, 77, 99, 121];
    doorPositions.forEach((xPos, idx) => {
      const { portalGroup, doorData } = createArchwayDoor(xPos, roomDoorTitles[idx]);
      interiorRoomsGroup.add(portalGroup);
      roomDoorsRef.current.push(doorData);
    });

    // -----------------------------------------------------------
    // STATION 0: MODERN WHITE TOWER WITH RIBBON WINDOWS (SEPERTI GAMBAR)
    // Sits prominently on the right half of the Hero view (X = 4.5)
    // -----------------------------------------------------------
    const buildingFullGroup = new THREE.Group();
    buildingFullGroup.position.set(4.5, 0, 0);
    fullBuildingGroupRef.current = buildingFullGroup;

    // 1. Plinth / Stepped White Entrance Podium
    const basePodium = new THREE.Mesh(new THREE.BoxGeometry(18.0, 0.8, 15.0), pureWhiteFacadeMat);
    basePodium.position.set(0, 0.4, 1.0);
    basePodium.castShadow = true;
    basePodium.receiveShadow = true;
    buildingFullGroup.add(basePodium);

    // 2. TALL VERTICAL BACKDROP BLADE / FEATURE WALL (Like the orange wall in reference)
    // In rich Zaky Emerald (#0F5C4D) with fine gold fluting & vertical slogan
    // Height capped at building roofline (17.6) so it never clips into navbar or sky
    const verticalBlade = new THREE.Mesh(new THREE.BoxGeometry(4.8, 17.6, 0.8), darkEmeraldMat);
    verticalBlade.position.set(5.2, 8.8, -3.8);
    verticalBlade.castShadow = true;

    // Vertical gold fluting slats across the blade face
    for (let sl = 0; sl < 18; sl++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.08, 17.2, 0.1), goldAccentMat);
      slat.position.set(3.2 + sl * 0.22, 8.8, -3.38);
      buildingFullGroup.add(slat);
    }
    const bladeCoping = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.35, 1.0), goldAccentMat);
    bladeCoping.position.set(5.2, 17.75, -3.8);
    buildingFullGroup.add(verticalBlade, bladeCoping);

    // 3. MAIN WHITE TOWER (6 Floors of Horizontal Ribbon Windows & Vertical Mullions)
    const towerWidth = 9.4;
    const towerDepth = 9.2;
    const towerHeight = 17.5;

    // Main tower core in pure white
    const mainTowerCore = new THREE.Mesh(
      new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth),
      pureWhiteFacadeMat
    );
    mainTowerCore.position.set(-1.8, 9.15, 0);
    mainTowerCore.castShadow = true;
    mainTowerCore.receiveShadow = true;
    buildingFullGroup.add(mainTowerCore);

    // 6 FLOORS OF CONTINUOUS HORIZONTAL RIBBON WINDOWS (FLOORS 2 TO 7)
    // Each floor has dark reflective glass + regularly spaced vertical white mullions
    for (let floor = 0; floor < 6; floor++) {
      const floorY = 4.0 + floor * 1.95;

      // Front horizontal window band
      const frontGlassBand = new THREE.Mesh(
        new THREE.BoxGeometry(towerWidth - 0.4, 1.25, 0.12),
        windowGlassMat
      );
      frontGlassBand.position.set(-1.8, floorY, towerDepth / 2 + 0.05);
      buildingFullGroup.add(frontGlassBand);

      // Subtle warm interior glow behind glass
      const glowInterior = new THREE.Mesh(
        new THREE.BoxGeometry(towerWidth - 0.6, 1.15, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.18 })
      );
      glowInterior.position.set(-1.8, floorY, towerDepth / 2 + 0.02);
      buildingFullGroup.add(glowInterior);

      // Front Vertical White Mullions (8 vertical pillared dividers per floor)
      for (let m = 0; m < 8; m++) {
        const mullionX = -1.8 - (towerWidth - 0.8) / 2 + 0.5 + m * 1.1;
        const mullion = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 1.3, 0.22),
          pureWhiteFacadeMat
        );
        mullion.position.set(mullionX, floorY, towerDepth / 2 + 0.08);
        buildingFullGroup.add(mullion);
      }

      // Left side horizontal window band
      const sideGlassBand = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 1.25, towerDepth - 0.8),
        windowGlassMat
      );
      sideGlassBand.position.set(-1.8 - towerWidth / 2 - 0.05, floorY, 0);
      buildingFullGroup.add(sideGlassBand);

      // Left side vertical mullions (6 vertical pillared dividers)
      for (let sm = 0; sm < 6; sm++) {
        const mullionZ = -(towerDepth - 1.2) / 2 + 0.5 + sm * 1.4;
        const sideMullion = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 1.3, 0.18),
          pureWhiteFacadeMat
        );
        sideMullion.position.set(-1.8 - towerWidth / 2 - 0.08, floorY, mullionZ);
        buildingFullGroup.add(sideMullion);
      }

      // White floor slab ledge / horizontal divider
      const slabLedge = new THREE.Mesh(
        new THREE.BoxGeometry(towerWidth + 0.2, 0.35, towerDepth + 0.2),
        pureWhiteFacadeMat
      );
      slabLedge.position.set(-1.8, floorY - 0.8, 0);
      buildingFullGroup.add(slabLedge);
    }

    // 4. TOP ROOFTOP CROWN WITH OFFICIAL ZAKY FAVICON & BOLD BRANDING
    const crownGroup = new THREE.Group();
    crownGroup.position.set(-1.8, 16.1, towerDepth / 2 + 0.12);

    // Canvas Texture rendering the official Zaky Favicon (green rounded badge + white Islamic geometric emblem)
    if (typeof document !== 'undefined') {
      const brandCanvas = document.createElement('canvas');
      brandCanvas.width = 1024;
      brandCanvas.height = 340;
      const ctx = brandCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1024, 340);

        // 1. Zaky Favicon Badge (Rounded Rectangle in Brand Emerald #0F5C4D)
        const badgeX = 50;
        const badgeY = 40;
        const badgeSize = 260;
        const badgeRadius = 55;

        ctx.save();
        ctx.fillStyle = '#0F5C4D';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, badgeRadius);
        } else {
          ctx.rect(badgeX, badgeY, badgeSize, badgeSize);
        }
        ctx.fill();

        // 2. Draw Zaky Islamic Geometric Emblem inside Favicon
        const svgPathStr =
          'M729.78 66.71L663.2 133.29L663.2 231.86L663.2 330.3L759.17 330.3L855.01 330.3L924.32 260.99L993.63 191.68L978.93 178.02C970.87 170.48 961.77 162.03 958.65 159.3L953.06 154.23L894.28 213L835.5 271.78L777.89 271.78L720.42 271.78L720.42 212.87L720.42 154.1L778.28 96.23L836.15 38.36L817.04 19.25C806.5 8.58 797.53 0 797.14 0C796.75 0 766.45 30.04 729.78 66.71ZM175.16 25.75L156.05 44.86L214.56 103.38L273.08 161.9L273.08 219.38L273.08 276.98L214.3 276.98L155.4 276.98L97.53 219.12L39.66 161.25L20.16 180.75L0.65 200.26L68.27 267.88L135.89 335.5L233.68 335.5L331.6 335.5L331.6 239.01L331.6 142.39L263.72 74.51C226.27 37.06 195.45 6.5 195.06 6.5C194.67 6.5 185.7 15.08 175.16 25.75ZM356.31 237.06L356.31 336.15L428.22 408.06L500 479.84L569.31 410.53L638.49 341.35L638.49 239.53L638.49 137.84L608.58 137.84L578.67 137.84L578.67 227.31L578.67 316.64L539.27 356.05L500 395.32L457.35 352.67L414.82 310.14L414.82 223.93L414.82 137.84L385.57 137.84L356.31 137.84L356.31 237.06ZM590.38 425.88L518.21 498.05L587.13 566.97L656.05 635.89L758.39 635.89L860.86 635.89L860.86 606.63L860.86 577.37L771.39 577.37L682.05 577.37L642 537.32L602.08 497.4L644.08 455.4L685.96 413.52L773.47 413.52L860.86 413.52L860.6 383.88L860.21 354.36L761.38 353.97L662.55 353.71L590.38 425.88ZM139.14 389.47L139.14 418.73L229.13 418.73L319.12 418.73L358.52 458L397.92 497.4L355.4 539.92L312.74 582.57L225.88 582.57L139.14 582.57L139.4 612.09L139.79 641.74L238.62 642.13L337.45 642.39L409.62 570.22L481.79 498.05L412.87 429.13L343.95 360.21L241.61 360.21L139.14 360.21L139.14 389.47ZM430.69 585.57L361.51 654.75L361.51 756.57L361.51 858.26L391.42 858.26L421.33 858.26L421.33 768.14L421.33 678.15L460.08 639.4C481.27 618.21 499.35 600.78 500 600.78C500.78 600.78 519.9 619.38 542.65 642.13L583.88 683.36L583.88 770.87L583.88 858.26L613.78 858.26L643.69 858.26L643.69 759.04L643.69 659.95L571.78 588.04L500 516.25L430.69 585.57ZM668.4 757.22L668.4 853.71L736.67 921.98L804.94 990.25L824.45 970.74L843.95 951.24L785.44 892.72L726.92 834.2L726.92 776.59L726.92 719.12L785.7 719.12L844.6 719.12L902.47 776.98L960.34 834.85L979.84 815.34L999.35 795.84L931.73 728.22L864.11 660.6L766.32 660.6L668.4 660.6L668.4 757.22ZM76.33 734.46L7.8 802.99L27.31 822.5L46.81 842L105.72 783.09L164.5 724.32L222.11 724.32L279.58 724.32L279.58 782.57L279.58 840.7L239.79 880.36C217.95 902.21 191.81 928.74 181.79 939.27L163.46 958.52L182.83 978.02L202.21 997.4L269.44 930.17L336.8 862.81L336.8 764.37L336.8 665.8L240.83 665.8L144.99 665.8L76.33 734.46Z';

        ctx.translate(badgeX + 36, badgeY + 36);
        ctx.scale(0.188, 0.188);
        ctx.fillStyle = '#FFFFFF';
        if (typeof Path2D !== 'undefined') {
          const emblemPath = new Path2D(svgPathStr);
          ctx.fill(emblemPath);
        }
        ctx.restore();

        // 3. Typography "zaky."
        ctx.font = '900 138px Inter, -apple-system, sans-serif';
        ctx.fillStyle = '#0F5C4D';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('zaky', 345, 140);

        // Gold accent dot
        ctx.fillStyle = '#C8962E';
        ctx.beginPath();
        ctx.arc(695, 168, 20, 0, Math.PI * 2);
        ctx.fill();

        // Subtitle
        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.fillText('MARKAZ ZAKAT NASIONAL', 350, 230);
      }
      const brandTex = new THREE.CanvasTexture(brandCanvas);
      brandTex.minFilter = THREE.LinearFilter;
      brandTex.magFilter = THREE.LinearFilter;
      brandTex.needsUpdate = true;
      const brandMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(6.6, 2.1),
        new THREE.MeshStandardMaterial({ map: brandTex, roughness: 0.5 })
      );
      crownGroup.add(brandMesh);
    }
    buildingFullGroup.add(crownGroup);

    // 5. ROOFTOP HELIPAD & CIRCULAR MARKING PAD (Neomorphic style)
    const helipadRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.12, 16, 32),
      goldAccentMat
    );
    helipadRing.rotation.x = Math.PI / 2;
    helipadRing.position.set(-1.8, 17.95, 0);
    const helipadCenterRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.08, 16, 32),
      brandEmeraldMat
    );
    helipadCenterRing.rotation.x = Math.PI / 2;
    helipadCenterRing.position.set(-1.8, 17.95, 0);
    buildingFullGroup.add(helipadRing, helipadCenterRing);

    // 6. ARCHED ENTRANCE PORTAL TUNNEL & AUTOMATIC SLIDING DOORS
    // The road enters right through this illuminated arched portal
    const entrancePortal = new THREE.Group();
    entrancePortal.position.set(-1.8, 0, 4.6);

    // Outer Arched Portal Frame
    const portalArch = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 4.6, 2.0),
      pureWhiteFacadeMat
    );
    portalArch.position.set(0, 2.3, 0);

    // Portal Interior Tunnel Cutout
    const portalTunnel = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 3.6, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x0a3d33, roughness: 0.5 })
    );
    portalTunnel.position.set(0, 1.8, 0);

    // Gold Arched Fascia Trim
    const portalTrim = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.25, 0.3),
      goldAccentMat
    );
    portalTrim.position.set(0, 3.75, 1.05);

    // ZAKY FAVICON BADGE EMBOSSED ABOVE ENTRANCE PORTAL
    if (typeof document !== 'undefined') {
      const epCanvas = document.createElement('canvas');
      epCanvas.width = 300;
      epCanvas.height = 300;
      const epCtx = epCanvas.getContext('2d');
      if (epCtx) {
        epCtx.fillStyle = '#0F5C4D';
        epCtx.beginPath();
        if (typeof epCtx.roundRect === 'function') {
          epCtx.roundRect(0, 0, 300, 300, 65);
        } else {
          epCtx.rect(0, 0, 300, 300);
        }
        epCtx.fill();

        epCtx.save();
        epCtx.translate(42, 42);
        epCtx.scale(0.216, 0.216);
        epCtx.fillStyle = '#FFFFFF';
        if (typeof Path2D !== 'undefined') {
          const p = new Path2D(
            'M729.78 66.71L663.2 133.29L663.2 231.86L663.2 330.3L759.17 330.3L855.01 330.3L924.32 260.99L993.63 191.68L978.93 178.02C970.87 170.48 961.77 162.03 958.65 159.3L953.06 154.23L894.28 213L835.5 271.78L777.89 271.78L720.42 271.78L720.42 212.87L720.42 154.1L778.28 96.23L836.15 38.36L817.04 19.25C806.5 8.58 797.53 0 797.14 0C796.75 0 766.45 30.04 729.78 66.71ZM175.16 25.75L156.05 44.86L214.56 103.38L273.08 161.9L273.08 219.38L273.08 276.98L214.3 276.98L155.4 276.98L97.53 219.12L39.66 161.25L20.16 180.75L0.65 200.26L68.27 267.88L135.89 335.5L233.68 335.5L331.6 335.5L331.6 239.01L331.6 142.39L263.72 74.51C226.27 37.06 195.45 6.5 195.06 6.5C194.67 6.5 185.7 15.08 175.16 25.75ZM356.31 237.06L356.31 336.15L428.22 408.06L500 479.84L569.31 410.53L638.49 341.35L638.49 239.53L638.49 137.84L608.58 137.84L578.67 137.84L578.67 227.31L578.67 316.64L539.27 356.05L500 395.32L457.35 352.67L414.82 310.14L414.82 223.93L414.82 137.84L385.57 137.84L356.31 137.84L356.31 237.06ZM590.38 425.88L518.21 498.05L587.13 566.97L656.05 635.89L758.39 635.89L860.86 635.89L860.86 606.63L860.86 577.37L771.39 577.37L682.05 577.37L642 537.32L602.08 497.4L644.08 455.4L685.96 413.52L773.47 413.52L860.86 413.52L860.6 383.88L860.21 354.36L761.38 353.97L662.55 353.71L590.38 425.88ZM139.14 389.47L139.14 418.73L229.13 418.73L319.12 418.73L358.52 458L397.92 497.4L355.4 539.92L312.74 582.57L225.88 582.57L139.14 582.57L139.4 612.09L139.79 641.74L238.62 642.13L337.45 642.39L409.62 570.22L481.79 498.05L412.87 429.13L343.95 360.21L241.61 360.21L139.14 360.21L139.14 389.47ZM430.69 585.57L361.51 654.75L361.51 756.57L361.51 858.26L391.42 858.26L421.33 858.26L421.33 768.14L421.33 678.15L460.08 639.4C481.27 618.21 499.35 600.78 500 600.78C500.78 600.78 519.9 619.38 542.65 642.13L583.88 683.36L583.88 770.87L583.88 858.26L613.78 858.26L643.69 858.26L643.69 759.04L643.69 659.95L571.78 588.04L500 516.25L430.69 585.57ZM668.4 757.22L668.4 853.71L736.67 921.98L804.94 990.25L824.45 970.74L843.95 951.24L785.44 892.72L726.92 834.2L726.92 776.59L726.92 719.12L785.7 719.12L844.6 719.12L902.47 776.98L960.34 834.85L979.84 815.34L999.35 795.84L931.73 728.22L864.11 660.6L766.32 660.6L668.4 660.6L668.4 757.22ZM76.33 734.46L7.8 802.99L27.31 822.5L46.81 842L105.72 783.09L164.5 724.32L222.11 724.32L279.58 724.32L279.58 782.57L279.58 840.7L239.79 880.36C217.95 902.21 191.81 928.74 181.79 939.27L163.46 958.52L182.83 978.02L202.21 997.4L269.44 930.17L336.8 862.81L336.8 764.37L336.8 665.8L240.83 665.8L144.99 665.8L76.33 734.46Z'
          );
          epCtx.fill(p);
        }
        epCtx.restore();
      }
      const epTex = new THREE.CanvasTexture(epCanvas);
      const epMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.2),
        new THREE.MeshStandardMaterial({ map: epTex, roughness: 0.5 })
      );
      epMesh.position.set(0, 4.35, 1.07);
      entrancePortal.add(epMesh);
    }

    // Entrance Logo Plaque with "ZAKY"
    const entrancePlaque = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.45, 0.18),
      darkEmeraldMat
    );
    entrancePlaque.position.set(0, 3.75, 1.06);
    const entrancePlaqueBorder = new THREE.Mesh(
      new THREE.BoxGeometry(2.48, 0.52, 0.16),
      goldAccentMat
    );
    entrancePlaqueBorder.position.set(0, 3.75, 1.05);

    if (typeof document !== 'undefined') {
      const epCanvas = document.createElement('canvas');
      epCanvas.width = 512;
      epCanvas.height = 128;
      const epCtx = epCanvas.getContext('2d');
      if (epCtx) {
        epCtx.fillStyle = '#0A3D33';
        epCtx.fillRect(0, 0, 512, 128);
        epCtx.font = '900 68px Inter, sans-serif';
        epCtx.fillStyle = '#F7F4ED';
        epCtx.textAlign = 'center';
        epCtx.textBaseline = 'middle';
        epCtx.fillText('Z A K Y', 256, 64);
      }
      const epTex = new THREE.CanvasTexture(epCanvas);
      const epMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 0.4),
        new THREE.MeshBasicMaterial({ map: epTex })
      );
      epMesh.position.set(0, 3.75, 1.16);
      entrancePortal.add(epMesh);
    }

    // AUTOMATIC SLIDING GLASS DOORS (CLOSED AT HOME, AUTOMATICALLY SLIDE OPEN ON SCROLL)
    const doorFrameTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 0.2), goldAccentMat);
    doorFrameTop.position.set(0, 3.4, 0.95);

    // Motion Sensor Bar with LED Indicator above sliding doors
    const sensorBar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.25), darkEmeraldMat);
    sensorBar.position.set(0, 3.52, 1.02);
    const sensorLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xc8962e }) // Starts Amber/Gold (Closed)
    );
    sensorLed.position.set(0, 3.52, 1.15);
    frontSensorLedRef.current = sensorLed;

    // Left Sliding Glass Door Leaf (Slides to the left: X = -0.75 -> -2.2)
    const leftSlideDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 3.3, 0.08),
      entranceDoorGlassMat
    );
    leftSlideDoor.position.set(-0.75, 1.65, 0.95);
    frontSlideLeftRef.current = leftSlideDoor;

    // Right Sliding Glass Door Leaf (Slides to the right: X = 0.75 -> 2.2)
    const rightSlideDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 3.3, 0.08),
      entranceDoorGlassMat
    );
    rightSlideDoor.position.set(0.75, 1.65, 0.95);
    frontSlideRightRef.current = rightSlideDoor;

    // Gold vertical push-bars / handles on sliding doors
    const leftHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 8), goldAccentMat);
    leftHandle.position.set(0.6, 0, 0.06);
    leftSlideDoor.add(leftHandle);

    const rightHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 8), goldAccentMat);
    rightHandle.position.set(-0.6, 0, 0.06);
    rightSlideDoor.add(rightHandle);

    entrancePortal.add(
      portalArch,
      portalTunnel,
      portalTrim,
      doorFrameTop,
      sensorBar,
      sensorLed,
      leftSlideDoor,
      rightSlideDoor
    );
    buildingFullGroup.add(entrancePortal);

    // 7. ASPHALT DRIVEWAY ROADWAY CURVING INTO THE PORTAL
    const roadCurveGroup = new THREE.Group();
    roadCurveGroup.position.set(0, 0.06, 11.5);

    // Main curved roadway segment
    const mainRoad = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.08, 4.2), asphaltMat);
    mainRoad.position.set(1.0, 0, 2.5);

    // Approach road bending into the entrance portal
    const portalApproach = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.08, 7.5), asphaltMat);
    portalApproach.position.set(-1.8, 0, -2.5);

    // White dashed lane markings
    for (let dm = 0; dm < 6; dm++) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.09, 0.18), pureWhiteFacadeMat);
      dash.position.set(-3.2 + dm * 2.2, 0.01, 2.5);
      roadCurveGroup.add(dash);
    }
    for (let pdm = 0; pdm < 3; pdm++) {
      const pDash = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 1.2), pureWhiteFacadeMat);
      pDash.position.set(-1.8, 0.01, -4.5 + pdm * 2.2);
      roadCurveGroup.add(pDash);
    }

    roadCurveGroup.add(mainRoad, portalApproach);
    buildingFullGroup.add(roadCurveGroup);

    // 8. ZAKY LOGISTICS DELIVERY VAN ON DRIVEWAY
    const vanGroup = new THREE.Group();
    vanGroup.position.set(3.2, 0.35, 14.0);
    vanGroup.rotation.y = -Math.PI * 0.95;

    const vanBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 3.0), pureWhiteFacadeMat);
    vanBody.position.y = 0.6;
    const vanCabin = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.8, 1.1), pureWhiteFacadeMat);
    vanCabin.position.set(0, 0.95, -0.9);
    const vanWindshield = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.1), windowGlassMat);
    vanWindshield.position.set(0, 0.95, -1.46);
    const vanStripe = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.22, 3.02), brandEmeraldMat);
    vanStripe.position.y = 0.52;

    vanGroup.add(vanBody, vanCabin, vanWindshield, vanStripe);
    buildingFullGroup.add(vanGroup);

    // -----------------------------------------------------------
    // PROCEDURAL GENERATORS: ARCHITECTURAL TREES & FACIAL FEATURES
    // -----------------------------------------------------------
    const createDetailedArchitecturalTree = (
      tx: number,
      ty: number,
      tz: number,
      scale = 1.0,
      variant = 0
    ) => {
      const tree = new THREE.Group();
      tree.position.set(tx, ty, tz);
      tree.scale.setScalar(scale);

      // 1. Modern Architectural Planter Box (Neomorphic White Stone with Gold Accent)
      const planter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.88, 0.76, 0.42, 16),
        pureWhiteFacadeMat
      );
      planter.position.y = 0.21;
      planter.castShadow = true;

      const planterRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.89, 0.035, 8, 24),
        goldAccentMat
      );
      planterRim.rotation.x = Math.PI / 2;
      planterRim.position.y = 0.42;

      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.82, 0.82, 0.06, 16),
        potSoilMat
      );
      soil.position.y = 0.4;
      tree.add(planter, planterRim, soil);

      // 2. Natural Organic Segmented Trunk
      const trunkBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.28, 1.1, 8),
        treeBarkMat
      );
      trunkBase.position.y = 0.95;
      tree.add(trunkBase);

      const trunkMid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.18, 1.4, 8),
        treeBarkMat
      );
      trunkMid.position.set(0.04, 2.05, -0.03);
      trunkMid.rotation.z = variant % 2 === 0 ? 0.08 : -0.07;
      trunkMid.rotation.x = 0.05;
      tree.add(trunkMid);

      // 3. Branches reaching outward
      const branches = [
        { geom: [0.08, 0.12, 1.1, 6], pos: [-0.32, 2.7, 0.15], rot: [0.2, 0.3, 0.55] },
        { geom: [0.08, 0.11, 1.1, 6], pos: [0.35, 2.8, -0.2], rot: [-0.25, -0.4, -0.52] },
        { geom: [0.07, 0.1, 0.95, 6], pos: [0.1, 2.65, 0.35], rot: [0.55, 0.1, -0.15] },
        { geom: [0.07, 0.1, 1.2, 6], pos: [-0.05, 3.2, -0.05], rot: [0.05, 0.0, 0.08] },
      ];
      branches.forEach((b) => {
        const branchMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(b.geom[0], b.geom[1], b.geom[2], b.geom[3]),
          treeBarkMat
        );
        branchMesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
        branchMesh.rotation.set(b.rot[0], b.rot[1], b.rot[2]);
        tree.add(branchMesh);
      });

      // 4. Multi-Tiered Organic Foliage Clusters (Lush, faceted canopy layers)
      const canopyClusters = [
        { r: 0.72, pos: [-0.7, 2.85, 0.28], scale: [1.25, 0.82, 1.15], mat: foliageDeepMat },
        { r: 0.68, pos: [0.75, 2.95, -0.32], scale: [1.18, 0.85, 1.22], mat: foliageDeepMat },
        { r: 0.65, pos: [0.22, 2.75, 0.72], scale: [1.2, 0.78, 1.12], mat: foliageLushMat },
        { r: 0.62, pos: [-0.35, 3.1, -0.65], scale: [1.15, 0.82, 1.18], mat: foliageDeepMat },
        { r: 0.85, pos: [0.0, 3.5, 0.0], scale: [1.22, 0.9, 1.22], mat: foliageLushMat },
        { r: 0.55, pos: [-0.48, 3.65, 0.35], scale: [1.1, 0.85, 1.05], mat: foliageLightMat },
        { r: 0.52, pos: [0.52, 3.72, -0.25], scale: [1.08, 0.88, 1.1], mat: foliageLightMat },
        { r: 0.62, pos: [0.08, 4.15, 0.05], scale: [1.05, 0.95, 1.05], mat: foliageLightMat },
        { r: 0.38, pos: [0.12, 4.55, 0.0], scale: [1.0, 1.05, 1.0], mat: foliageHighlightMat },
      ];

      canopyClusters.forEach((c, idx) => {
        const clusterMesh = new THREE.Mesh(
          new THREE.DodecahedronGeometry(c.r, 1),
          c.mat
        );
        clusterMesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
        clusterMesh.scale.set(c.scale[0], c.scale[1], c.scale[2]);
        clusterMesh.rotation.set(idx * 0.4, idx * 0.7, idx * 0.3);
        clusterMesh.castShadow = true;
        tree.add(clusterMesh);
      });

      return tree;
    };

    const createDetailedDatePalm = (tx: number, ty: number, tz: number, scale = 1.0) => {
      const palm = new THREE.Group();
      palm.position.set(tx, ty, tz);
      palm.scale.setScalar(scale);

      const planter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.75, 0.4, 16),
        pureWhiteFacadeMat
      );
      planter.position.y = 0.2;
      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.05, 16),
        potSoilMat
      );
      soil.position.y = 0.38;
      palm.add(planter, soil);

      // Textured ringed palm trunk (3 curved segments)
      const segments = [
        { geom: [0.22, 0.28, 1.4, 8], pos: [0, 1.0, 0], rot: [0.03, 0, 0.02] },
        { geom: [0.18, 0.22, 1.4, 8], pos: [0.06, 2.3, 0.04], rot: [0.06, 0.1, 0.04] },
        { geom: [0.15, 0.18, 1.2, 8], pos: [0.14, 3.5, 0.09], rot: [0.08, 0.2, 0.05] },
      ];
      segments.forEach((s) => {
        const segMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(s.geom[0], s.geom[1], s.geom[2], s.geom[3]),
          palmTrunkMat
        );
        segMesh.position.set(s.pos[0], s.pos[1], s.pos[2]);
        segMesh.rotation.set(s.rot[0], s.rot[1], s.rot[2]);
        palm.add(segMesh);
      });

      // Palm Crown: 8 arching date palm fronds radiating outwards
      const crownY = 4.1;
      const frondCount = 9;
      for (let i = 0; i < frondCount; i++) {
        const angle = (i / frondCount) * Math.PI * 2;
        const frondGroup = new THREE.Group();
        frondGroup.position.set(0.16, crownY, 0.1);
        frondGroup.rotation.y = angle;

        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.06, 1.8, 5),
          treeBarkMat
        );
        stem.rotation.z = -0.75;
        stem.position.set(0.7, -0.25, 0);

        const leafBlade = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.04, 0.45),
          palmFrondMat
        );
        leafBlade.rotation.z = -0.75;
        leafBlade.position.set(0.75, -0.28, 0);

        frondGroup.add(stem, leafBlade);
        palm.add(frondGroup);
      }

      // Golden Date clusters
      for (let d = 0; d < 3; d++) {
        const dAngle = (d / 3) * Math.PI * 2 + 0.3;
        const dateCluster = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 8, 8),
          datesFruitMat
        );
        dateCluster.scale.set(0.8, 1.4, 0.8);
        dateCluster.position.set(
          0.16 + Math.cos(dAngle) * 0.25,
          crownY - 0.25,
          0.1 + Math.sin(dAngle) * 0.25
        );
        palm.add(dateCluster);
      }

      return palm;
    };

    const attachFacialFeatures = (
      parentGroup: THREE.Group,
      headY: number,
      options: {
        hasPeci?: boolean;
        hasGlasses?: boolean;
        hasHijab?: boolean;
        scale?: number;
      } = {}
    ) => {
      const s = options.scale || 1.0;
      const faceGroup = new THREE.Group();
      faceGroup.position.y = headY;

      // 1. Eyes (Left & Right with sclera, dark pupil & bright white specular catchlight)
      const eyeR = 0.038 * s;
      const pupilR = 0.022 * s;
      const catchR = 0.008 * s;
      const eyeX = 0.072 * s;
      const eyeY = 0.032 * s;
      const eyeZ = 0.212 * s;

      // Left Eye
      const leftSclera = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 10, 10), eyeWhiteMat);
      leftSclera.position.set(-eyeX, eyeY, eyeZ);
      const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(pupilR, 8, 8), pupilMat);
      leftPupil.position.set(-eyeX, eyeY, eyeZ + 0.024 * s);
      const leftCatch = new THREE.Mesh(new THREE.SphereGeometry(catchR, 6, 6), specularEyeMat);
      leftCatch.position.set(-eyeX + 0.008 * s, eyeY + 0.008 * s, eyeZ + 0.032 * s);

      // Right Eye
      const rightSclera = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 10, 10), eyeWhiteMat);
      rightSclera.position.set(eyeX, eyeY, eyeZ);
      const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(pupilR, 8, 8), pupilMat);
      rightPupil.position.set(eyeX, eyeY, eyeZ + 0.024 * s);
      const rightCatch = new THREE.Mesh(new THREE.SphereGeometry(catchR, 6, 6), specularEyeMat);
      rightCatch.position.set(eyeX + 0.008 * s, eyeY + 0.008 * s, eyeZ + 0.032 * s);

      faceGroup.add(leftSclera, leftPupil, leftCatch, rightSclera, rightPupil, rightCatch);

      // Eyebrows
      const browW = 0.07 * s;
      const browH = 0.016 * s;
      const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(browW, browH, 0.025 * s), eyebrowMat);
      leftBrow.position.set(-eyeX, 0.088 * s, 0.222 * s);
      leftBrow.rotation.z = -0.08;
      const rightBrow = new THREE.Mesh(new THREE.BoxGeometry(browW, browH, 0.025 * s), eyebrowMat);
      rightBrow.position.set(eyeX, 0.088 * s, 0.222 * s);
      rightBrow.rotation.z = 0.08;
      faceGroup.add(leftBrow, rightBrow);

      // 2. Nose (Bridge & Tip)
      const noseBridge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015 * s, 0.024 * s, 0.06 * s, 8),
        noseShadeMat
      );
      noseBridge.position.set(0, -0.008 * s, 0.232 * s);
      noseBridge.rotation.x = -0.2;

      const noseTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.025 * s, 10, 10),
        noseShadeMat
      );
      noseTip.position.set(0, -0.032 * s, 0.246 * s);

      faceGroup.add(noseBridge, noseTip);

      // 3. Mouth (Upturned friendly smile)
      const smile = new THREE.Mesh(
        new THREE.TorusGeometry(0.042 * s, 0.011 * s, 8, 16, Math.PI * 0.8),
        lipSmileMat
      );
      smile.position.set(0, -0.085 * s, 0.222 * s);
      smile.rotation.z = Math.PI * 0.9;
      smile.rotation.x = 0.15;
      faceGroup.add(smile);

      // 4. Cheeks (Soft natural blush)
      const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.032 * s, 8, 8), blushCheekMat);
      cheekL.position.set(-0.125 * s, -0.025 * s, 0.192 * s);
      const cheekR = new THREE.Mesh(new THREE.SphereGeometry(0.032 * s, 8, 8), blushCheekMat);
      cheekR.position.set(0.125 * s, -0.025 * s, 0.192 * s);
      faceGroup.add(cheekL, cheekR);

      // 5. Glasses
      if (options.hasGlasses) {
        const frameMat = goldAccentMat;
        const leftLens = new THREE.Mesh(new THREE.TorusGeometry(0.045 * s, 0.007 * s, 6, 16), frameMat);
        leftLens.position.set(-eyeX, eyeY, eyeZ + 0.035 * s);
        const rightLens = new THREE.Mesh(new THREE.TorusGeometry(0.045 * s, 0.007 * s, 6, 16), frameMat);
        rightLens.position.set(eyeX, eyeY, eyeZ + 0.035 * s);
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04 * s, 0.01 * s, 0.01 * s), frameMat);
        bridge.position.set(0, eyeY, eyeZ + 0.035 * s);
        faceGroup.add(leftLens, rightLens, bridge);
      }

      // 6. Hijab (for Dewi Sartika)
      if (options.hasHijab) {
        const hijabHood = new THREE.Mesh(
          new THREE.SphereGeometry(0.235 * s, 16, 16),
          hijabMat
        );
        hijabHood.position.set(0, 0.02 * s, -0.02 * s);
        hijabHood.scale.set(1.05, 1.08, 1.05);

        const hijabWrap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24 * s, 0.3 * s, 0.22 * s, 16),
          hijabMat
        );
        hijabWrap.position.y = -0.14 * s;
        faceGroup.add(hijabHood, hijabWrap);
      }

      parentGroup.add(faceGroup);
      return faceGroup;
    };

    // 9. ARCHITECTURAL LUXURY TREES & DATE PALMS (Replacing round spheres with rich organic foliage)
    buildingFullGroup.add(createDetailedArchitecturalTree(-6.5, 0, 7.5, 1.15, 0));
    buildingFullGroup.add(createDetailedDatePalm(-5.0, 0, 11.2, 1.1));
    buildingFullGroup.add(createDetailedDatePalm(1.8, 0, 11.0, 1.12));
    buildingFullGroup.add(createDetailedArchitecturalTree(5.8, 0, 9.5, 1.18, 1));
    buildingFullGroup.add(createDetailedArchitecturalTree(7.8, 0, 6.2, 1.05, 2));
    buildingFullGroup.add(createDetailedArchitecturalTree(-8.2, 0, 4.2, 1.08, 3));

    worldGroup.add(buildingFullGroup);

    // -----------------------------------------------------------
    // ROOM 1 (X = 22): LOBI PENERIMAAN & AKAD (HIGH DETAIL & NEOMORPHISM)
    // -----------------------------------------------------------
    const room1 = new THREE.Group();
    room1.position.set(22, 0, 0);

    // 1. Sleek Neomorphic Reception Counter (Z = -2.4, corridor at Z = 2.8 is 100% open)
    const counterDesk = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.1, 1.3), pureWhiteFacadeMat);
    counterDesk.position.set(0, 0.55, -2.4);
    const counterTrim = new THREE.Mesh(new THREE.BoxGeometry(5.25, 0.08, 1.35), goldAccentMat);
    counterTrim.position.set(0, 1.08, -2.4);
    const counterPlinth = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.12, 1.2), darkEmeraldMat);
    counterPlinth.position.set(0, 0.06, -2.4);

    // Dual Flat Teller Terminals with Gold Pedestals
    [-1.6, 1.6].forEach((tx) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.22, 8), goldAccentMat);
      stand.position.set(tx, 1.18, -2.4);
      const scr = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.03), darkSuitMat);
      scr.position.set(tx, 1.35, -2.45);
      scr.rotation.x = -0.15;
      const displayFace = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.36), screenGlowMat);
      displayFace.position.set(tx, 1.35, -2.43);
      displayFace.rotation.x = -0.15;
      room1.add(stand, scr, displayFace);
    });

    // QRIS Instant Zakat Terminal & Card Reader on Counter
    const qrisStand = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.2), brandEmeraldMat);
    qrisStand.position.set(0, 1.22, -2.15);
    const qrisScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), pureWhiteFacadeMat);
    qrisScreen.position.set(0, 1.25, -2.04);
    qrisScreen.rotation.x = -0.25;
    const qrisLed = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    qrisLed.position.set(0.1, 1.38, -2.08);
    room1.add(qrisStand, qrisScreen, qrisLed);

    // Seated Amil Budi behind Counter
    const amilStaff = new THREE.Group();
    amilStaff.position.set(0, 0.5, -3.4);
    const amilBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.35), brandEmeraldMat);
    amilBody.position.y = 0.55;
    const amilHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinToneMat);
    amilHead.position.y = 1.05;
    const amilPeci = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.18, 16), darkEmeraldMat);
    amilPeci.position.y = 1.2;
    amilStaff.add(amilBody, amilHead, amilPeci);
    attachFacialFeatures(amilStaff, 1.05, { scale: 0.95 });

    // Ergonomic Office Mesh Chair for Amil
    const amilChair = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.7), darkSuitMat);
    amilChair.position.set(0, 0.6, -3.5);

    // Muzakki Standing in Front of Reception Counter (Z = -1.2, well clear of corridor Z = 2.8!)
    const muzakkiChar = new THREE.Group();
    muzakkiChar.position.set(0, 0, -1.2);
    muzakkiChar.rotation.y = Math.PI;
    const mBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), pureWhiteFacadeMat);
    mBody.position.y = 1.0;
    const mHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinToneMat);
    mHead.position.y = 1.5;
    muzakkiChar.add(mBody, mHead);
    attachFacialFeatures(muzakkiChar, 1.5, { scale: 0.95 });

    // 2. Executive Waiting Lounge (North Wall: X = -4.8, Z = -5.4)
    // Low-profile 3-seater emerald sofa against the wall
    const sofaMain = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.55, 1.3), brandEmeraldMat);
    sofaMain.position.set(-4.8, 0.3, -5.4);
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.75, 0.3), brandEmeraldMat);
    sofaBack.position.set(-4.8, 0.85, -6.0);
    // Cream Accent Lumbar Cushions
    [-1.2, 0, 1.2].forEach((cx) => {
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.25), pureWhiteFacadeMat);
      cushion.position.set(-4.8 + cx, 0.55, -5.75);
      room1.add(cushion);
    });

    // Modern Gold & Marble Oval Coffee Table
    const coffeeTable = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.38, 24), warmWoodMat);
    coffeeTable.position.set(-4.8, 0.2, -4.0);
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.94, 0.94, 0.04, 24), pureWhiteFacadeMat);
    tableTop.position.set(-4.8, 0.4, -4.0);
    const goldRim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.02, 12, 24), goldAccentMat);
    goldRim.rotation.x = Math.PI / 2;
    goldRim.position.set(-4.8, 0.4, -4.0);

    // Ceramic White Potted Plant
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.75, 16), pureWhiteFacadeMat);
    pot.position.set(-7.2, 0.4, -5.2);
    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55), new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 }));
    foliage.position.set(-7.2, 1.0, -5.2);

    // 3. Self-Service Zakat Kiosk Station (X = 4.8, Z = -2.6)
    const kioskPillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.4), darkEmeraldMat);
    kioskPillar.position.set(4.8, 0.9, -2.6);
    const kioskScreen = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.7, 0.04), brandEmeraldMat);
    kioskScreen.position.set(4.8, 1.35, -2.38);
    kioskScreen.rotation.x = -0.18;
    const kioskGoldBand = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.42), goldAccentMat);
    kioskGoldBand.position.set(4.8, 1.78, -2.6);

    // Secure Electronic Deposit Vault (North-East Wall: Z = -5.5)
    const safeBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 1.4), darkEmeraldMat);
    safeBox.position.set(5.2, 1.1, -5.5);
    const safeTrim = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.08, 1.46), goldAccentMat);
    safeTrim.position.set(5.2, 2.15, -5.5);
    const safeDial = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16), goldAccentMat);
    safeDial.rotation.x = Math.PI / 2;
    safeDial.position.set(5.2, 1.3, -4.75);

    room1.add(
      counterDesk, counterTrim, counterPlinth, amilStaff, amilChair, muzakkiChar,
      sofaMain, sofaBack, coffeeTable, tableTop, goldRim, pot, foliage,
      kioskPillar, kioskScreen, kioskGoldBand, safeBox, safeTrim, safeDial
    );
    interiorRoomsGroup.add(room1);

    // -----------------------------------------------------------
    // ROOM 2 (X = 44): RUANG VALIDASI ASNAF & PRIVASI (HIGH DETAIL)
    // -----------------------------------------------------------
    const room2 = new THREE.Group();
    room2.position.set(44, 0, 0);

    // 1. Central Holographic 8-Asnaf Analysis Pedestal (Moved back to Z = -2.4, corridor clear!)
    const holoPedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.75, 12), darkEmeraldMat);
    holoPedestal.position.set(0, 0.38, -2.4);
    const holoRim = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.05, 12, 24), goldAccentMat);
    holoRim.rotation.x = Math.PI / 2;
    holoRim.position.set(0, 0.75, -2.4);

    // Holographic Wireframe Cylinder
    const holoPrism = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 1.6, 8),
      new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.65, wireframe: true })
    );
    holoPrism.position.set(0, 1.8, -2.4);

    // Concentric Golden Gimbal Ring
    const holoRing = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.04, 16, 32), goldAccentMat);
    holoRing.rotation.x = Math.PI / 2;
    holoRing.position.set(0, 1.8, -2.4);

    // 8 Small Asnaf Category Node Spheres
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), goldAccentMat);
      node.position.set(Math.cos(angle) * 1.1, 1.8, -2.4 + Math.sin(angle) * 1.1);
      room2.add(node);
    }

    // 2. Dual Auditor Workstations (X = -4.5 and +4.5, Z = -3.5)
    [-4.5, 4.5].forEach((wx, wIdx) => {
      const desk = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.8, 1.2), pureWhiteFacadeMat);
      desk.position.set(wx, 0.4, -3.5);
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.06, 1.25), warmWoodMat);
      deskTop.position.set(wx, 0.82, -3.5);

      [-0.6, 0.6].forEach((mx) => {
        const mon = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 0.03), darkSuitMat);
        mon.position.set(wx + mx, 1.2, -3.8);
        mon.rotation.y = (mx < 0 ? 0.15 : -0.15) * (wIdx === 0 ? 1 : -1);
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.38), screenGlowMat);
        scr.position.set(wx + mx, 1.2, -3.78);
        scr.rotation.y = mon.rotation.y;
        room2.add(mon, scr);
      });

      const bioPad = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.3), goldAccentMat);
      bioPad.position.set(wx + (wIdx === 0 ? 1.0 : -1.0), 0.87, -3.3);
      const bioSensor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
      bioSensor.position.set(wx + (wIdx === 0 ? 1.0 : -1.0), 0.9, -3.3);

      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.65), darkSuitMat);
      chair.position.set(wx, 0.55, -4.6);
      room2.add(desk, deskTop, bioPad, bioSensor, chair);
    });

    // 3. Document Credenza Storage (North Wall: Z = -6.2)
    const credenza = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.2, 0.8), darkEmeraldMat);
    credenza.position.set(0, 0.6, -6.2);
    const credenzaTrim = new THREE.Mesh(new THREE.BoxGeometry(7.08, 0.06, 0.86), goldAccentMat);
    credenzaTrim.position.set(0, 1.22, -6.2);

    // Wall Screen Display for 8-Asnaf Live Status
    const wallScreen2 = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.2), screenGlowMat);
    wallScreen2.position.set(0, 4.0, -8.1);
    const wallScreenBorder = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.4, 0.04), goldAccentMat);
    wallScreenBorder.position.set(0, 4.0, -8.12);

    room2.add(holoPedestal, holoRim, holoPrism, holoRing, credenza, credenzaTrim, wallScreen2, wallScreenBorder);
    interiorRoomsGroup.add(room2);

    // -----------------------------------------------------------
    // ROOM 3 (X = 66): RUANG OTORISASI 4-MATA (HIGH DETAIL)
    // -----------------------------------------------------------
    const room3 = new THREE.Group();
    room3.position.set(66, 0, 0);

    // 1. Executive 4-Eyes Dual-Key Console Desk (Z = -3.4, corridor clear!)
    const execDesk = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.85, 2.0), darkEmeraldMat);
    execDesk.position.set(0, 0.45, -3.4);
    const execLeather = new THREE.Mesh(new THREE.BoxGeometry(4.85, 0.06, 2.05), brandEmeraldMat);
    execLeather.position.set(0, 0.9, -3.4);
    const deskGoldBase = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.1, 1.9), goldAccentMat);
    deskGoldBase.position.set(0, 0.05, -3.4);

    // Dual Cryptographic Authorization Docks (Amil Pelaksana & Dewan Pengawas)
    [-1.5, 1.5].forEach((kx, kIdx) => {
      const dock = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.14, 16), goldAccentMat);
      dock.position.set(kx, 0.98, -2.8);
      const token = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.04), pureWhiteFacadeMat);
      token.position.set(kx, 1.1, -2.8);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 12, 24), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(kx, 0.99, -2.8);
      const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.2), darkSuitMat);
      thumb.position.set(kx + (kIdx === 0 ? 0.45 : -0.45), 0.94, -2.8);
      room3.add(dock, token, ring, thumb);
    });

    // Seated Supervisor Amil Hari at Center (Z = -4.5)
    const hariChar = new THREE.Group();
    hariChar.position.set(0, 0.6, -4.5);
    const hBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.38), darkSuitMat);
    hBody.position.y = 0.55;
    const hHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinToneMat);
    hHead.position.y = 1.05;
    hariChar.add(hBody, hHead);
    attachFacialFeatures(hariChar, 1.05, { scale: 0.95, hasGlasses: true });

    // Executive High-Back Chair
    const execChair = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.8), darkEmeraldMat);
    execChair.position.set(0, 0.95, -4.7);
    const chairGoldPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.28, 0.4, 16), goldAccentMat);
    chairGoldPost.position.set(0, 0.2, -4.7);

    // 2. Executive Sharia Credenza & Floating Archives (North Wall: Z = -6.4)
    const execArchive = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.6, 0.7), warmWoodMat);
    execArchive.position.set(0, 0.8, -6.4);
    const archiveGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(5.86, 0.06, 0.76), goldAccentMat);
    archiveGoldTrim.position.set(0, 1.62, -6.4);

    // Sharia Compliance Gold Trophy / Crescent Plaque
    const trophyBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.12, 16), darkEmeraldMat);
    trophyBase.position.set(0, 1.7, -6.4);
    const trophyEmblem = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.04, 12, 24), goldAccentMat);
    trophyEmblem.position.set(0, 2.05, -6.4);

    // Large Consensus Wall Display
    const wallMatrix = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.4), new THREE.MeshBasicMaterial({ color: 0x0a3d33 }));
    wallMatrix.position.set(0, 4.0, -8.1);
    const wallMatrixGoldBorder = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.6, 0.04), goldAccentMat);
    wallMatrixGoldBorder.position.set(0, 4.0, -8.12);

    room3.add(execDesk, execLeather, deskGoldBase, hariChar, execChair, chairGoldPost, execArchive, archiveGoldTrim, trophyBase, trophyEmblem, wallMatrix, wallMatrixGoldBorder);
    interiorRoomsGroup.add(room3);

    // -----------------------------------------------------------
    // ROOM 4 (X = 88): RUANG SERAH TERIMA & SAKSI (HIGH DETAIL)
    // -----------------------------------------------------------
    const room4 = new THREE.Group();
    room4.position.set(88, 0, 0);

    // 1. Dispatch & Distribution Counter (Z = -2.2, corridor clear!)
    const handCounter = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.0, 1.2), pureWhiteFacadeMat);
    handCounter.position.set(0, 0.5, -2.2);
    const counterGoldEdge = new THREE.Mesh(new THREE.BoxGeometry(4.86, 0.06, 1.26), goldAccentMat);
    counterGoldEdge.position.set(0, 1.02, -2.2);

    // Flush Digital Parcel Scale on Counter
    const scaleBase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.7), darkSuitMat);
    scaleBase.position.set(0, 1.04, -2.2);
    const scaleLcd = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    scaleLcd.position.set(0, 1.06, -1.9);
    scaleLcd.rotation.x = -Math.PI / 2;

    // Barcode Dispatch Scanner on Dock
    const scanDock = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.22, 12), goldAccentMat);
    scanDock.position.set(-1.6, 1.13, -2.15);

    // Dewi (Amil Staff) behind Counter (Z = -3.2)
    const dewiChar = new THREE.Group();
    dewiChar.position.set(-0.8, 0, -3.2);
    const dBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), brandEmeraldMat);
    dBody.position.y = 0.95;
    const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), skinToneMat);
    dHead.position.y = 1.45;
    const dTablet = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.03), pureWhiteFacadeMat);
    dTablet.position.set(0.2, 1.1, 0.3);
    dewiChar.add(dBody, dHead, dTablet);
    attachFacialFeatures(dewiChar, 1.45, { scale: 0.9, hasHijab: true });

    // Mustahik Recipient in Front of Counter (Z = -1.2, well clear of corridor Z = 2.8!)
    const mustahikChar = new THREE.Group();
    mustahikChar.position.set(0.8, 0, -1.2);
    mustahikChar.rotation.y = Math.PI;
    const mustBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 }));
    mustBody.position.y = 0.95;
    const mustHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), skinToneMat);
    mustHead.position.y = 1.45;
    mustahikChar.add(mustBody, mustHead);
    attachFacialFeatures(mustahikChar, 1.45, { scale: 0.9 });

    // 2. Organized Aid Depot Staging (North Wall: Z = -5.4)
    const palletMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 });
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    const greenAidMat = new THREE.MeshStandardMaterial({ color: 0x0f5c4d, roughness: 0.5 });

    [-4.6, 4.6].forEach((px) => {
      const pallet = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 1.6), palletMat);
      pallet.position.set(px, 0.07, -5.4);
      room4.add(pallet);
    });

    // Neatly Stacked Aid Cartons with Green & Gold Identification
    const aidCartonGeom = new THREE.BoxGeometry(0.85, 0.65, 0.85);
    const boxPositions = [
      { pos: [-5.1, 0.45, -5.7], isGreen: true },
      { pos: [-4.2, 0.45, -5.7], isGreen: false },
      { pos: [-4.6, 1.1, -5.7], isGreen: true },
      { pos: [-5.1, 0.45, -4.9], isGreen: false },
      { pos: [-4.2, 0.45, -4.9], isGreen: true },
      { pos: [4.2, 0.45, -5.4], isGreen: false },
      { pos: [5.1, 0.45, -5.4], isGreen: true },
      { pos: [4.6, 1.1, -5.4], isGreen: false },
    ];
    boxPositions.forEach(({ pos, isGreen }) => {
      const b = new THREE.Mesh(aidCartonGeom, isGreen ? greenAidMat : boxMat);
      b.position.set(...(pos as [number, number, number]));
      const bStripe = new THREE.Mesh(new THREE.BoxGeometry(0.87, 0.12, 0.87), goldAccentMat);
      bStripe.position.set(pos[0], pos[1], pos[2]);
      room4.add(b, bStripe);
    });

    // Potted Greenery Accent
    const pot4 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.25, 0.7, 16), pureWhiteFacadeMat);
    pot4.position.set(-7.2, 0.35, -5.2);
    const fol4 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 }));
    fol4.position.set(-7.2, 0.9, -5.2);

    // Live Delivery Tracking Screen on Back Wall
    const wallScreen4 = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 2.2), screenGlowMat);
    wallScreen4.position.set(0, 4.0, -8.1);
    const wallScreen4Border = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.4, 0.04), goldAccentMat);
    wallScreen4Border.position.set(0, 4.0, -8.12);

    room4.add(handCounter, counterGoldEdge, scaleBase, scaleLcd, scanDock, dewiChar, mustahikChar, pot4, fol4, wallScreen4, wallScreen4Border);
    interiorRoomsGroup.add(room4);

    // -----------------------------------------------------------
    // ROOM 5 (X = 110): DATA CENTER RANTAI KRIPTO (HIGH DETAIL)
    // -----------------------------------------------------------
    const room5 = new THREE.Group();
    room5.position.set(110, 0, 0);

    // 1. Enterprise High-Density Server Racks (North Wall: Z = -5.6)
    const serverMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.7 });
    [-4.8, -2.4, 2.4, 4.8].forEach((rx) => {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 5.0, 1.4), serverMat);
      rack.position.set(rx, 2.5, -5.6);
      const headerTrim = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.1, 1.44), goldAccentMat);
      headerTrim.position.set(rx, 5.02, -5.6);
      const led = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.12), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
      led.position.set(rx, 3.8, -4.88);
      const ledAmber = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.06), new THREE.MeshBasicMaterial({ color: 0xc8962e }));
      ledAmber.position.set(rx + 0.5, 4.2, -4.88);
      room5.add(rack, headerTrim, led, ledAmber);
    });

    // Gold Overhead Cable Trays connecting Racks
    const cableTray = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.15, 0.6), goldAccentMat);
    cableTray.position.set(0, 5.3, -5.6);
    room5.add(cableTray);

    // 2. Central Cryptographic Blockchain Pedestal & Floating Cubes (Z = -2.4, corridor clear!)
    const cryptoPedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.6, 16), darkEmeraldMat);
    cryptoPedestal.position.set(0, 0.3, -2.4);
    const cryptoRim = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.04, 12, 24), goldAccentMat);
    cryptoRim.rotation.x = Math.PI / 2;
    cryptoRim.position.set(0, 0.6, -2.4);

    const cryptoCubesGroup = new THREE.Group();
    cryptoCubesRef.current = cryptoCubesGroup;
    cryptoCubesGroup.position.set(0, 2.3, -2.4);

    for (let i = 0; i < 5; i++) {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.68, 0.68),
        new THREE.MeshStandardMaterial({
          color: 0x0f5c4d,
          roughness: 0.35,
          metalness: 0.1,
          transparent: true,
          opacity: 0.88,
        })
      );
      cube.position.set((i - 2) * 1.15, Math.sin(i * 1.1) * 0.25, 0);
      const cubeEdge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.7), goldAccentMat);
      cubeEdge.position.set((i - 2) * 1.15, Math.sin(i * 1.1) * 0.25, 0);
      cryptoCubesGroup.add(cube, cubeEdge);
    }
    room5.add(cryptoPedestal, cryptoRim, cryptoCubesGroup);

    // 3. DevOps Security Telemetry Console (X = -4.2, Z = -2.6)
    const devopsDesk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.0), pureWhiteFacadeMat);
    devopsDesk.position.set(-4.2, 0.4, -2.6);
    const devopsTop = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.05, 1.05), darkEmeraldMat);
    devopsTop.position.set(-4.2, 0.82, -2.6);
    const ultraWideMon = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.04), darkSuitMat);
    ultraWideMon.position.set(-4.2, 1.25, -2.9);
    ultraWideMon.rotation.x = -0.1;
    const ultraWideScr = new THREE.Mesh(new THREE.PlaneGeometry(1.54, 0.44), screenGlowMat);
    ultraWideScr.position.set(-4.2, 1.25, -2.88);
    ultraWideScr.rotation.x = -0.1;
    room5.add(devopsDesk, devopsTop, ultraWideMon, ultraWideScr);

    // Back Wall Realtime Sharia Blockchain Metrics Screen
    const wallScreen5 = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.4), new THREE.MeshBasicMaterial({ color: 0x064e3b }));
    wallScreen5.position.set(0, 4.0, -8.1);
    const wallScreen5Border = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.6, 0.04), goldAccentMat);
    wallScreen5Border.position.set(0, 4.0, -8.12);

    room5.add(wallScreen5, wallScreen5Border);
    interiorRoomsGroup.add(room5);

    // -----------------------------------------------------------
    // ROOM 6 (X = 132): RUANG OBSERVATORIUM PAPAN SILANG (HIGH DETAIL)
    // -----------------------------------------------------------
    const room6 = new THREE.Group();
    room6.position.set(132, 0, 0);

    // 1. Central Federation Council Table (Relocated to Z = -2.8, Radius 2.0: 100% CLEAR OF CORRIDOR Z = 2.8!)
    const fedTable = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 0.65, 32), brandEmeraldMat);
    fedTable.position.set(0, 0.55, -2.8);
    const fedTableRim = new THREE.Mesh(new THREE.TorusGeometry(2.02, 0.05, 16, 32), goldAccentMat);
    fedTableRim.rotation.x = Math.PI / 2;
    fedTableRim.position.set(0, 0.88, -2.8);
    const fedTableHub = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.08, 24), darkEmeraldMat);
    fedTableHub.position.set(0, 0.9, -2.8);

    // 2. Floating 3D Federation Wireframe Globe (Z = -2.8)
    const globeGroup = new THREE.Group();
    federationGlobeRef.current = globeGroup;
    globeGroup.position.set(0, 2.4, -2.8);

    const wireGlobe = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.75 })
    );
    const equatorRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.03, 12, 32), goldAccentMat);
    equatorRing.rotation.x = Math.PI / 2;
    globeGroup.add(wireGlobe, equatorRing);

    // Regional Zakat Federation Member Nodes
    const cityNodes = [
      { pos: [-0.5, 0.3, 0.5], color: 0x10b981 }, // Jakarta
      { pos: [0.5, -0.2, 0.6], color: 0x38bdf8 }, // Kuala Lumpur
      { pos: [0.2, 0.5, -0.6], color: 0xf59e0b }, // Riyadh / Jeddah
      { pos: [-0.4, -0.3, -0.5], color: 0x10b981 }, // Istanbul
    ];
    cityNodes.forEach(({ pos, color }) => {
      const bNode = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshBasicMaterial({ color }));
      bNode.position.set(...(pos as [number, number, number]));
      globeGroup.add(bNode);
    });

    // 3. Ergonomic Council Seating around the North Arc of the Table (Z = -4.2 to -4.5)
    for (let c = 0; c < 5; c++) {
      const angle = Math.PI + (c - 2) * 0.45;
      const cx = Math.sin(angle) * 2.8;
      const cz = -2.8 + Math.cos(angle) * 1.5;
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.6), darkSuitMat);
      chair.position.set(cx, 0.5, cz);
      chair.rotation.y = -angle;
      room6.add(chair);
    }

    // 4. Global Federation Standards & Banners on Gold Stanchions (North Wall: Z = -6.2)
    [-4.5, 0, 4.5].forEach((bx, bIdx) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.8, 8), goldAccentMat);
      pole.position.set(bx, 2.4, -6.2);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), goldAccentMat);
      finial.position.set(bx, 4.85, -6.2);
      const banner = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 2.2),
        new THREE.MeshStandardMaterial({
          color: bIdx === 0 ? 0x0f5c4d : bIdx === 1 ? 0x0369a1 : 0xb45309,
          roughness: 0.6,
        })
      );
      banner.position.set(bx, 3.5, -6.18);
      room6.add(pole, finial, banner);
    });

    // Panoramic Global Federation Observatory Display
    const wallScreen6 = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 2.4), new THREE.MeshBasicMaterial({ color: 0x0a3d33 }));
    wallScreen6.position.set(0, 4.0, -8.1);
    const wallScreen6Border = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.6, 0.04), goldAccentMat);
    wallScreen6Border.position.set(0, 4.0, -8.12);

    room6.add(fedTable, fedTableRim, fedTableHub, globeGroup, wallScreen6, wallScreen6Border);
    interiorRoomsGroup.add(room6);

    // -----------------------------------------------------------
    // THE 3D TRAVELING CHARACTER (AMIL ZAKY) — HIGH REALISM & EXPRESSION
    // -----------------------------------------------------------
    const charRoot = new THREE.Group();
    charRoot.position.set(2.7, 0.25, 11.5);
    charRoot.rotation.y = Math.PI;
    worldGroup.add(charRoot);
    characterGroupRef.current = charRoot;

    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.95;

    // 1. Amil Formal Uniform: Emerald Blazer with White Shirt & Collar
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.38), brandEmeraldMat);
    const shirtInlay = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.39), pureWhiteFacadeMat);
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.41), pureWhiteFacadeMat);
    collar.position.y = 0.35;

    // Golden Official Amil ID Badge pinned to chest
    const idBadge = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.02), idBadgeMat);
    idBadge.position.set(-0.16, 0.16, 0.20);
    // Dark Green Amil Tie / Lanyard
    const lanyard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.02), darkEmeraldMat);
    lanyard.position.set(0, 0.12, 0.20);

    torsoGroup.add(bodyMesh, shirtInlay, collar, idBadge, lanyard);

    // 2. Realistic Expressive Human Head (Eyes, Pupils, Nose, Mouth Smile, Ears, Songkok)
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.65;

    // Anatomical head base in warm natural skin tone
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), skinToneMat);
    headMesh.scale.set(0.96, 1.05, 1.0);
    headGroup.add(headMesh);

    // EARS (Telinga Kiri & Kanan)
    const leftEar = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), skinToneMat);
    leftEar.scale.set(0.35, 1.1, 0.8);
    leftEar.position.set(-0.235, 0.02, 0.02);
    const rightEar = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), skinToneMat);
    rightEar.scale.set(0.35, 1.1, 0.8);
    rightEar.position.set(0.235, 0.02, 0.02);
    headGroup.add(leftEar, rightEar);

    // EYES (Mata Nyata Berkilau & Pupil)
    // Left Eye White (Sclera)
    const leftEyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), eyeWhiteMat);
    leftEyeWhite.position.set(-0.078, 0.035, 0.218);
    // Left Iris/Pupil
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), pupilMat);
    leftPupil.position.set(-0.078, 0.035, 0.244);
    // Left Specular Catchlight (Kilau Cahaya Hidup)
    const leftCatchlight = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), specularEyeMat);
    leftCatchlight.position.set(-0.069, 0.044, 0.255);

    // Right Eye White (Sclera)
    const rightEyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), eyeWhiteMat);
    rightEyeWhite.position.set(0.078, 0.035, 0.218);
    // Right Iris/Pupil
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), pupilMat);
    rightPupil.position.set(0.078, 0.035, 0.244);
    // Right Specular Catchlight
    const rightCatchlight = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), specularEyeMat);
    rightCatchlight.position.set(0.087, 0.044, 0.255);

    headGroup.add(
      leftEyeWhite,
      leftPupil,
      leftCatchlight,
      rightEyeWhite,
      rightPupil,
      rightCatchlight
    );

    // EYEBROWS (Alis Amil Rapi)
    const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.018, 0.03), eyebrowMat);
    leftBrow.position.set(-0.08, 0.095, 0.226);
    leftBrow.rotation.z = -0.08;
    const rightBrow = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.018, 0.03), eyebrowMat);
    rightBrow.position.set(0.08, 0.095, 0.226);
    rightBrow.rotation.z = 0.08;
    headGroup.add(leftBrow, rightBrow);

    // NOSE (Hidung Mancung Natural dengan Batang & Cuping)
    const noseBridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.026, 0.065, 8),
      noseShadeMat
    );
    noseBridge.position.set(0, -0.008, 0.238);
    noseBridge.rotation.x = -0.22;

    const noseTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 12, 12),
      noseShadeMat
    );
    noseTip.position.set(0, -0.035, 0.252);

    const nostrilL = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), noseShadeMat);
    nostrilL.position.set(-0.028, -0.038, 0.242);
    const nostrilR = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), noseShadeMat);
    nostrilR.position.set(0.028, -0.038, 0.242);

    headGroup.add(noseBridge, noseTip, nostrilL, nostrilR);

    // MOUTH & SMILE (Mulut Senyum Ramah Khas Amil)
    const smileCurve = new THREE.Mesh(
      new THREE.TorusGeometry(0.046, 0.012, 8, 16, Math.PI * 0.8),
      lipSmileMat
    );
    smileCurve.position.set(0, -0.09, 0.225);
    smileCurve.rotation.z = Math.PI * 0.9;
    smileCurve.rotation.x = 0.15;

    const teethLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.009, 0.01),
      pureWhiteFacadeMat
    );
    teethLine.position.set(0, -0.086, 0.226);

    headGroup.add(smileCurve, teethLine);

    // CHEEKS (Pipi Berseri / Healthy Amil Glow)
    const leftCheek = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), blushCheekMat);
    leftCheek.position.set(-0.13, -0.03, 0.198);
    const rightCheek = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), blushCheekMat);
    rightCheek.position.set(0.13, -0.03, 0.198);
    headGroup.add(leftCheek, rightCheek);

    // SIDEBURNS & HAIR (Cambang Rapi Bawah Peci)
    const leftHair = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.08, 0.1), eyebrowMat);
    leftHair.position.set(-0.22, 0.08, 0.04);
    const rightHair = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.08, 0.1), eyebrowMat);
    rightHair.position.set(0.22, 0.08, 0.04);
    headGroup.add(leftHair, rightHair);

    // INDONESIAN SONGKOK / PECI HITAM DENGAN LIST EMAS
    const peciMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.218, 0.225, 0.22, 24),
      songkokVelvetMat
    );
    peciMesh.scale.set(0.96, 1.0, 1.05);
    peciMesh.position.y = 0.20;

    const peciGoldTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.226, 0.01, 8, 24),
      songkokGoldTrimMat
    );
    peciGoldTrim.scale.set(0.96, 1.0, 1.05);
    peciGoldTrim.rotation.x = Math.PI / 2;
    peciGoldTrim.position.y = 0.10;

    headGroup.add(peciMesh, peciGoldTrim);
    torsoGroup.add(headGroup);

    // Left Arm with White Shirt Cuff & Detailed Hand
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.38, 0.25, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.16), brandEmeraldMat);
    leftArmMesh.position.y = -0.22;
    const leftCuff = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.17), pureWhiteFacadeMat);
    leftCuff.position.y = -0.49;
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), skinToneMat);
    leftHand.scale.set(0.9, 1.2, 0.8);
    leftHand.position.y = -0.56;
    leftArm.add(leftArmMesh, leftCuff, leftHand);
    torsoGroup.add(leftArm);

    // Right Arm with White Shirt Cuff & Detailed Hand
    const rightArm = new THREE.Group();
    rightArm.position.set(0.38, 0.25, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.16), brandEmeraldMat);
    rightArmMesh.position.y = -0.22;
    const rightCuff = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.17), pureWhiteFacadeMat);
    rightCuff.position.y = -0.49;
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), skinToneMat);
    rightHand.scale.set(0.9, 1.2, 0.8);
    rightHand.position.y = -0.56;
    rightArm.add(rightArmMesh, rightCuff, rightHand);
    torsoGroup.add(rightArm);

    charRoot.add(torsoGroup);

    // Legs with Formal Trousers & Black Pantofel Shoes
    const trouserMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.18, 0.65, 0);
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.56, 0.18), trouserMat);
    leftLegMesh.position.y = -0.26;
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.11, 0.28), shoeLeatherMat);
    leftShoe.position.set(0, -0.56, 0.04);
    leftLeg.add(leftLegMesh, leftShoe);
    charRoot.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.18, 0.65, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.56, 0.18), trouserMat);
    rightLegMesh.position.y = -0.26;
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.11, 0.28), shoeLeatherMat);
    rightShoe.position.set(0, -0.56, 0.04);
    rightLeg.add(rightLegMesh, rightShoe);
    charRoot.add(rightLeg);

    charPartsRef.current = {
      torso: torsoGroup,
      head: headGroup,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
    };

    // -----------------------------------------------------------
    // RENDER & DYNAMIC AUTOMATIC DOOR ANIMATION LOOP
    // -----------------------------------------------------------
    const timer = new THREE.Timer();
    let animId: number;
    let idleFrames = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      timer.update();
      // Jangan render saat scene di luar viewport atau tab tersembunyi
      if (!journeyVisibleRef.current || document.hidden) {
        return;
      }
      const delta = timer.getDelta();
      const time = timer.getElapsed();
      const calm = calmModeRef.current;
      const softwareGl = softwareGlRef.current;
      const ambientAktif = !calm && !softwareGl;

      // Render-saat-bergerak saja bila animasi ambient mati (mode tenang /
      // perender perangkat lunak): begitu kamera, karakter, dan pintu mencapai
      // targetnya, lewati pembaruan + render agar utas utama benar-benar bisa
      // diam (hemat CPU/baterai; halaman dapat mencapai kondisi idle).
      // Gulir (ScrollTrigger) mengubah target -> gerakan terdeteksi lagi
      // secara otomatis pada frame berikutnya.
      if (!ambientAktif) {
        let bergerak = false;
        if (cameraRef.current) {
          if (cameraRef.current.position.distanceTo(targetCameraPos.current) > 0.003) bergerak = true;
          if (currentCameraLookAt.current.distanceTo(targetCameraLookAt.current) > 0.003) bergerak = true;
        }
        const charNow = characterGroupRef.current;
        if (charNow) {
          if (
            Math.hypot(
              charNow.position.x - targetCharPos.current.x,
              charNow.position.z - targetCharPos.current.z
            ) > 0.003
          ) {
            bergerak = true;
          }
          if (!bergerak) {
            const charX = charNow.position.x;
            for (const door of roomDoorsRef.current) {
              const distToDoor = door.xPos - charX;
              let openAmount = 0;
              if (distToDoor <= 6.0 && distToDoor >= -2.2) {
                openAmount = Math.min(1.0, Math.max(0, (6.0 - distToDoor) / 3.8));
              } else if (distToDoor < -2.2) {
                openAmount = Math.max(0, 1.0 - (-distToDoor - 2.2) / 3.5);
              }
              const targetAngle = openAmount * (Math.PI / 2.0);
              if (
                Math.abs(door.leftLeaf.rotation.y - targetAngle) > 0.002 ||
                Math.abs(door.rightLeaf.rotation.y + targetAngle) > 0.002
              ) {
                bergerak = true;
                break;
              }
            }
          }
        }
        if (!bergerak) {
          idleFrames++;
          // Perender perangkat lunak mendapat masa tenggang jauh lebih
          // pendek (6 frame): setiap frame di sana berharga ratusan ms.
          if (idleFrames > (softwareGl ? 6 : 20)) {
            return;
          }
        } else {
          idleFrames = 0;
        }
      }

      if (ambientAktif) {
        if (cryptoCubesRef.current) {
          cryptoCubesRef.current.rotation.y = time * 0.7;
          cryptoCubesRef.current.position.y = 2.3 + Math.sin(time * 2) * 0.12;
        }

        if (federationGlobeRef.current) {
          federationGlobeRef.current.rotation.y = time * 0.5;
        }
      }

      // Denyut halus garis jalur emas di lantai (mode tenang: intensitas tetap)
      if (glowPathMatRef.current) {
        glowPathMatRef.current.emissiveIntensity =
          calm || softwareGl ? 0.55 : 0.52 + Math.sin(time * 1.6) * 0.16;
      }

      // 1. Smooth camera interpolation
      // Mode tenang: faktor lerp jauh lebih kecil agar kamera meluncur
      // sangat lembut antar stasiun, tanpa gerak terbang yang dramatis.
      // Perender perangkat lunak: lompat langsung ke target (snap) - lerp
      // puluhan frame terlalu mahal saat satu frame berharga ratusan ms.
      const camLerp = softwareGl ? 1 : calm ? 0.045 : 0.14;
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCameraPos.current, camLerp);
        currentCameraLookAt.current.lerp(targetCameraLookAt.current, camLerp);
        cameraRef.current.lookAt(currentCameraLookAt.current);
      }

      // 2. Synchronous Camera-Locked Character Movement (Zero Delay, Natural Walking Cadence)
      if (characterGroupRef.current && charPartsRef.current) {
        const char = characterGroupRef.current;
        const parts = charPartsRef.current;
        const target = targetCharPos.current;

        // Previous position to calculate actual displacement this frame
        const prevX = char.position.x;
        const prevZ = char.position.z;

        // Position interpolation perfectly matches camera lerp
        // Moves in 100% lockstep with the camera - never lags behind!
        char.position.x = THREE.MathUtils.lerp(char.position.x, target.x, camLerp);
        char.position.y = target.y;
        char.position.z = THREE.MathUtils.lerp(char.position.z, target.z, camLerp);

        const deltaX = char.position.x - prevX;
        const deltaZ = char.position.z - prevZ;
        const frameDist = Math.hypot(deltaX, deltaZ);

        if (frameDist > 0.0005) {
          // Dynamic heading orientation: Face the travel direction smoothly
          const moveAngle = Math.atan2(deltaX, deltaZ);
          char.rotation.y = THREE.MathUtils.lerp(char.rotation.y, moveAngle, calm ? 0.08 : 0.15);

          if (calm) {
            // Mode tenang: karakter tetap meluncur ke stasiun berikutnya,
            // tetapi tanpa ayunan langkah dan tanpa pantulan torso.
            parts.leftLeg.rotation.x = THREE.MathUtils.lerp(parts.leftLeg.rotation.x, 0, 0.15);
            parts.rightLeg.rotation.x = THREE.MathUtils.lerp(parts.rightLeg.rotation.x, 0, 0.15);
            parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, 0, 0.15);
            parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, 0, 0.15);
            parts.torso.position.y = THREE.MathUtils.lerp(parts.torso.position.y, 0.95, 0.15);
          } else {
            // NATURAL HUMAN WALKING CADENCE (Strictly clamped to normal walking pace - NEVER looks like running!)
            // Real-world human walk is ~1.5 to 1.7 steps per second (~4.8 to 5.2 rad/s)
            // Even on fast scrolls, the character maintains a calm, graceful walk rhythm.
            const walkFrequency = 5.0; // Normal human walking cadence
            walkDistanceRef.current += delta * walkFrequency;

            // Leg swing amplitude: 0.22 rad (~12.6 degrees), calm natural step length
            const swing = Math.sin(walkDistanceRef.current) * 0.22;

            parts.leftLeg.rotation.x = THREE.MathUtils.lerp(parts.leftLeg.rotation.x, swing, 0.25);
            parts.rightLeg.rotation.x = THREE.MathUtils.lerp(parts.rightLeg.rotation.x, -swing, 0.25);
            parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, -swing * 0.55, 0.25);
            parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, swing * 0.55, 0.25);
            // Subtle natural torso vertical bob
            parts.torso.position.y = 0.95 + Math.abs(Math.sin(walkDistanceRef.current)) * 0.012;
          }
        } else {
          // Stationary / Standing still: smoothly ease limbs back to natural resting standing posture
          parts.leftLeg.rotation.x = THREE.MathUtils.lerp(parts.leftLeg.rotation.x, 0, 0.15);
          parts.rightLeg.rotation.x = THREE.MathUtils.lerp(parts.rightLeg.rotation.x, 0, 0.15);
          parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, 0, 0.15);
          parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, 0, 0.15);
          parts.torso.position.y = THREE.MathUtils.lerp(parts.torso.position.y, 0.95, 0.15);
        }

        // DYNAMIC SENSOR & AUTOMATIC OPENING FOR ALL ROOM DOORS (PINTU OTOMATIS)
        const charX = char.position.x;
        roomDoorsRef.current.forEach((door) => {
          const distToDoor = door.xPos - charX; // positive when hero approaches from left

          // Sensor range: starts opening early (dist 6.0m) and fully open by 2.2m
          let openAmount = 0;
          if (distToDoor > 6.0) {
            openAmount = 0;
          } else if (distToDoor >= -2.2) {
            openAmount = Math.min(1.0, Math.max(0, (6.0 - distToDoor) / 3.8));
          } else {
            // Hero walked past doorway into room: smoothly closes behind him
            const past = -distToDoor;
            openAmount = Math.max(0, 1.0 - (past - 2.2) / 3.5);
          }

          // Automatic swing angle: 90 degrees open (swings forward into room flat against the walls)
          // Mode tenang: pintu membuka lebih perlahan.
          const targetAngle = openAmount * (Math.PI / 2.0);
          const doorLerp = softwareGl ? 1 : calm ? 0.1 : 0.22;
          door.leftLeaf.rotation.y = THREE.MathUtils.lerp(door.leftLeaf.rotation.y, targetAngle, doorLerp);
          door.rightLeaf.rotation.y = THREE.MathUtils.lerp(door.rightLeaf.rotation.y, -targetAngle, doorLerp);

          // Sensor LED color change: green when opening, gold when idle/closed
          if (door.sensorMesh) {
            const mat = door.sensorMesh.material as THREE.MeshBasicMaterial;
            if (openAmount > 0.1) {
              mat.color.setHex(0x10b981); // Bright Emerald Green (Detecting)
            } else {
              mat.color.setHex(0xc8962e); // Gold (Idle)
            }
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvasContainerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = canvasContainerRef.current.clientWidth || window.innerWidth;
      const h = canvasContainerRef.current.clientHeight || window.innerHeight;
      if (w <= 0 || h <= 0) return;

      width = w;
      height = h;

      const settings = computeCameraSettings(w, h);
      cameraSettingsRef.current = settings;
      cameraRef.current.aspect = settings.aspect;
      cameraRef.current.fov = settings.fov;
      cameraRef.current.updateProjectionMatrix();

      // Update WebGL buffer resolution without overwriting 100% full-bleed CSS styling
      rendererRef.current.setSize(w, h, false);
      rendererRef.current.setPixelRatio(
        Math.min(window.devicePixelRatio, softwareGlRef.current ? 1 : window.innerWidth < 768 ? 1.5 : 1.75)
      );

      if (rendererRef.current.domElement) {
        rendererRef.current.domElement.style.width = '100%';
        rendererRef.current.domElement.style.height = '100%';
        rendererRef.current.domElement.style.display = 'block';
      }

      // Re-align camera framing on resize or fullscreen toggle when at Station 0
      if (currentProgressRef.current < 0.02) {
        const initPosX = 27.5 * settings.heroPosMult;
        const initPosY = 21.0 * settings.heroPosMult;
        const initPosZ = 37.0 * settings.heroPosMult;
        const initLookAtY = 8.2 + settings.targetLookAtYOffset;
        targetCameraPos.current.set(initPosX, initPosY, initPosZ);
        targetCameraLookAt.current.set(3.0, initLookAtY, 0);
      }

      // Instantly refresh ScrollTrigger to keep scrollytelling distances in sync with the new window height
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    };

    const onFullscreenChange = () => {
      handleResize();
      requestAnimationFrame(handleResize);
      setTimeout(handleResize, 100);
      setTimeout(handleResize, 300);
    };

    // ResizeObserver watches the actual canvas container DOM element for instant resize without reload
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    return () => {
      if (journeyVisObserver) {
        journeyVisObserver.disconnect();
      }
      cancelAnimationFrame(animId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
    // staticMode sebagai dependensi: saat pengguna memaksa tur 3D dari mode
    // statis (atau renderer gagal dan kembali statis), scene harus
    // diinisialisasi ulang / dibersihkan mengikuti mode terbaru.
  }, [staticMode]);

  // -------------------------------------------------------------
  // GSAP SCROLLTRIGGER: BUTTER-SMOOTH JOURNEY WITH ZERO UNPIN JOLT
  // -------------------------------------------------------------
  useEffect(() => {
    if (staticMode) return;
    if (typeof window !== 'undefined' && scrollTrackRef.current) {
      const journeyTrigger = ScrollTrigger.create({
        trigger: scrollTrackRef.current,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * 2.4)}`,
        // Mode tenang: scrub diberi waktu peredam ekstra agar gerak kamera
        // terasa meluncur lembut, bukan menempel kaku pada posisi gulir.
        scrub: calmModeRef.current ? 0.8 : true,
        onUpdate: (self) => {
          const progress = self.progress; // 0.0 to 1.0
          currentProgressRef.current = progress;
          // Indikator progres langkah (di-render hemat: hanya saat berubah >= 0.5%)
          const pct = Math.round(progress * 200) / 2;
          if (Math.abs(pct - progressPctRef.current) >= 0.5) {
            progressPctRef.current = pct;
            setProgressPct(pct);
          }

          // Compute character position along the journey path
          let charZ = 11.5;
          let charX = 2.7;

          if (progress < 0.12) {
            const t0 = progress / 0.12;
            const tSmooth = t0 * t0 * (3 - 2 * t0);
            const posOnPath = entranceCurveRef.current.getPointAt(tSmooth);
            charX = posOnPath.x;
            charZ = posOnPath.z;
          } else if (progress < 0.94) {
            const tInterior = (progress - 0.12) / (0.94 - 0.12);
            charX = 22 + tInterior * (132 - 22);
            charZ = 2.8;
          } else {
            charX = 132.0;
            charZ = 2.8;
          }

          // 1. Station Index Mapping: Synchronized EXACTLY with the character stepping through each door
          let nextStep = 0;
          if (progress < 0.12) {
            // Front Entrance Sliding Glass Doors are located at Z = 4.6
            // The exact instant the character crosses Z = 4.6 into the building, the card updates to Step 1
            nextStep = charZ <= 4.6 ? 1 : 0;
          } else {
            // Interior Corridor Doors: Pintu 2 (x=33), Pintu 3 (x=55), Pintu 4 (x=77), Pintu 5 (x=99), Pintu 6 (x=121)
            // As character steps through each doorway threshold, the card updates immediately
            if (charX < 32.5) {
              nextStep = 1;
            } else if (charX < 54.5) {
              nextStep = 2;
            } else if (charX < 76.5) {
              nextStep = 3;
            } else if (charX < 98.5) {
              nextStep = 4;
            } else if (charX < 120.5) {
              nextStep = 5;
            } else {
              nextStep = 6;
            }
          }
          setActiveStep((prev) => (prev !== nextStep ? nextStep : prev));

          // 2. Direct DOM style dissolve for HUD cards & top badge during approach to Room 6 (progress 0.88 to 0.98)
          // Direct DOM manipulation prevents heavy React re-renders on every scroll tick!
          let calculatedOpacity = 1;
          if (progress > 0.90) {
            const exitT = (progress - 0.90) / 0.08; // 0 to 1 between 0.90 and 0.98
            calculatedOpacity = Math.max(0, 1 - exitT);
          }
          if (hudCardRef.current) {
            hudCardRef.current.style.opacity = calculatedOpacity.toFixed(3);
            hudCardRef.current.style.pointerEvents = calculatedOpacity < 0.1 ? 'none' : 'auto';
          }
          if (topBadgeRef.current) {
            topBadgeRef.current.style.opacity = calculatedOpacity.toFixed(3);
            topBadgeRef.current.style.pointerEvents = calculatedOpacity < 0.1 ? 'none' : 'auto';
          }

          // Toggle interior rooms visibility (strictly hidden at Station 0 exterior to prevent leaks in fullscreen)
          if (interiorRoomsGroupRef.current) {
            interiorRoomsGroupRef.current.visible = progress >= 0.04;
          }

          // 3. Cinematic 3D Trajectory & Camera Control
          if (progress < 0.12) {
            // Stage A: Cinematic Exterior-to-Interior Dive through Automatic Front Doors (Progress 0.0 to 0.12)
            const t0 = progress / 0.12; // 0 to 1
            const tSmooth = t0 * t0 * (3 - 2 * t0);

            // FRONT AUTOMATIC SLIDING DOORS LOGIC
            let frontOpenT = 0;
            const doorOpenState = t0 >= 0.03;
            setIsFrontDoorOpen((prev) => (prev !== doorOpenState ? doorOpenState : prev));

            if (t0 < 0.03) {
              frontOpenT = 0;
            } else if (t0 <= 0.20) {
              frontOpenT = (t0 - 0.03) / 0.17;
            } else {
              frontOpenT = 1.0;
            }

            if (frontSlideLeftRef.current && frontSlideRightRef.current) {
              frontSlideLeftRef.current.position.x = -0.75 - frontOpenT * 1.45;
              frontSlideRightRef.current.position.x = 0.75 + frontOpenT * 1.45;
            }

            if (frontSensorLedRef.current) {
              const ledMat = frontSensorLedRef.current.material as THREE.MeshBasicMaterial;
              if (frontOpenT > 0.05) {
                ledMat.color.setHex(0x10b981);
              } else {
                ledMat.color.setHex(0xc8962e);
              }
            }

            const settings = cameraSettingsRef.current;
            const heroMult = settings.heroPosMult;
            const lookAtYOffset = settings.targetLookAtYOffset;
            const startPosX = 27.5 * heroMult;
            const startPosY = 21.0 * heroMult;
            const startPosZ = 37.0 * heroMult;
            const startLookAtY = 8.2 + lookAtYOffset;

            const camLookX = tSmooth < 0.45
              ? THREE.MathUtils.lerp(3.0, 2.7, tSmooth / 0.45)
              : THREE.MathUtils.lerp(2.7, 22.0, (tSmooth - 0.45) / 0.55);
            const camLookY = tSmooth < 0.45
              ? THREE.MathUtils.lerp(startLookAtY, 3.5, tSmooth / 0.45)
              : THREE.MathUtils.lerp(3.5, 2.2 + lookAtYOffset * 0.4, (tSmooth - 0.45) / 0.55);
            const camLookZ = tSmooth < 0.45
              ? THREE.MathUtils.lerp(0, 3.5, tSmooth / 0.45)
              : THREE.MathUtils.lerp(3.5, 0, (tSmooth - 0.45) / 0.55);

            const camPosX = tSmooth < 0.45
              ? THREE.MathUtils.lerp(startPosX, 16.0, tSmooth / 0.45)
              : THREE.MathUtils.lerp(16.0, 22.0, (tSmooth - 0.45) / 0.55);
            const camPosY = tSmooth < 0.45
              ? THREE.MathUtils.lerp(startPosY, 10.0, tSmooth / 0.45)
              : THREE.MathUtils.lerp(10.0, 6.8 + (settings.isMobile ? 0.6 : 0), (tSmooth - 0.45) / 0.55);
            const camPosZ = tSmooth < 0.45
              ? THREE.MathUtils.lerp(startPosZ, 25.0, tSmooth / 0.45)
              : THREE.MathUtils.lerp(25.0, 16.5 + settings.interiorZOffset, (tSmooth - 0.45) / 0.55);

            targetCameraPos.current.set(camPosX, camPosY, camPosZ);
            targetCameraLookAt.current.set(camLookX, camLookY, camLookZ);

            const posOnPath = entranceCurveRef.current.getPointAt(tSmooth);
            targetCharPos.current.copy(posOnPath);
          } else if (progress < 0.94) {
            // Stage B: Continuous Interior Tour through Rooms 1 to 6 (Progress 0.12 to 0.88)
            setIsFrontDoorOpen((prev) => (prev ? prev : true));

            if (frontSlideLeftRef.current && frontSlideRightRef.current) {
              frontSlideLeftRef.current.position.x = -2.2;
              frontSlideRightRef.current.position.x = 2.2;
            }

            const tInterior = (progress - 0.12) / (0.94 - 0.12); // 0.0 to 1.0
            const interiorX = 22 + tInterior * (132 - 22);

            const settings = cameraSettingsRef.current;
            targetCameraPos.current.set(
              interiorX,
              6.8 + (settings.isMobile ? 0.6 : 0),
              16.5 + settings.interiorZOffset
            );
            targetCameraLookAt.current.set(
              interiorX,
              2.2 + settings.targetLookAtYOffset * 0.4,
              0
            );

            // Character follows the glowing path at Z = 2.8
            targetCharPos.current.set(interiorX, 0.25, 2.8);
          } else {
            // Stage C: Settle in Room 6 (Papan Silang) with zero jerk (Progress 0.88 to 1.00+)
            // Character stands comfortably in Room 6; scene remains steady and stable
            const settings = cameraSettingsRef.current;
            targetCharPos.current.set(132.0, 0.25, 2.8);
            targetCameraPos.current.set(
              132.0,
              6.8 + (settings.isMobile ? 0.6 : 0),
              16.5 + settings.interiorZOffset
            );
            targetCameraLookAt.current.set(
              132.0,
              2.2 + settings.targetLookAtYOffset * 0.4,
              0
            );
          }
        },
      });

      scrollTriggerInstanceRef.current = journeyTrigger;

      return () => {
        journeyTrigger.kill();
      };
    }
  }, [staticMode]);

  const currentStation = STATIONS[activeStep] || STATIONS[0];

  if (staticMode) {
    return (
      <>
        <HeroFallback
          onOpenAkadModal={onOpenAkadModal}
          mode="static"
          onForce3D={() => {
            setRenderFailed(false);
            setForce3D(true);
          }}
        />
        {/* Pengguna mode statis tetap mendapat cerita alurnya secara runtut */}
        <JourneyStepsStatic />
      </>
    );
  }

  return (
    <div
      ref={scrollTrackRef}
      className="relative w-full"
      style={{ height: '440vh' }}
    >
      {/* 
        STICKY 100vh 3D VIEWPORT:
        Stays firmly pinned at top: 0 with native GPU acceleration.
        Eliminates GSAP unpin hitching and composite blinking completely!
      */}
      <div
        ref={pinSectionRef}
        className="sticky top-0 w-full h-screen h-[100dvh] overflow-hidden bg-[#F7F4ED] selection:bg-primary-100 selection:text-primary-900 z-0"
      >
        {/* 
          3D WEBGL CANVAS VIEWPORT
        */}
        {/* Canvas murni tampilan (kamera digerakkan gulir, tanpa interaksi
            pointer), jadi pointer-events dimatikan total: lapisan ini tidak
            akan pernah menelan klik yang ditujukan ke elemen lain. */}
        <div
          ref={canvasContainerRef}
          className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden"
          style={{ touchAction: 'pan-y' }}
        />

        {/* Top Subtle Vignette (Seamless with #F5F1E6 sky, avoiding cloudy haze) */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#F5F1E6]/80 to-transparent pointer-events-none z-10" />

        {/* Anotasi tulisan tangan, hanya tampak di gerbang (langkah 0), desktop lebar:
            posisi kanan bawah seperti versi statis, di atas kontrol progres dan di
            ruang kosong kanan adegan - jangan dipindah ke tengah karena menabrak fasad. */}
        {activeStep === 0 && (
          <span
            aria-hidden
            className="font-hand hidden xl:block absolute right-10 bottom-36 text-[1.7rem] leading-none whitespace-nowrap text-accent-600 rotate-[-5deg] z-10 pointer-events-none select-none"
          >
            catatan saling disaksikan
          </span>
        )}


        {/* Indikator progres langkah + tombol Lewati (pola referensi), desktop */}
        <div className="absolute z-20 hidden lg:flex flex-col gap-2 left-1/2 -translate-x-1/2 bottom-6 w-[min(92vw,600px)]">
          <div className="flex items-center justify-between gap-3">
            <span className="bg-white/85 backdrop-blur px-3.5 py-2 rounded-full border border-neutral-900/10 shadow-sm text-[11px] font-semibold text-neutral-700">
              {activeStep === 0
                ? currentStation.roomName
                : `Langkah ${activeStep} dari 6 · ${currentStation.roomName}`}
            </span>
            <button
              type="button"
              onClick={handleSkipJourney}
              className="bg-neutral-900/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-md hover:bg-primary-800 text-[11px] font-bold cursor-pointer"
            >
              Lewati
            </button>
          </div>
          <div className="z-progress-track h-1.5 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPct)} aria-label="Progres penjelajahan gedung">
            <div className="z-progress-fill h-full rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Top Active Room Indicator Badge — Clean Neomorphic Convex Pill */}
        <div
          ref={topBadgeRef}
          className="absolute top-20 sm:top-24 right-3 sm:right-8 z-20 flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 backdrop-blur-md border border-neutral-900/10 shadow-[0_10px_24px_-12px_rgba(20,32,29,0.35)] pointer-events-auto transition-opacity duration-300"
        >
          {isFrontDoorOpen || activeStep > 0 ? (
            <DoorOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <DoorClosed className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" />
          )}
          <div className="text-left">
            <span className="block text-[11px] sm:text-xs font-bold text-neutral-800">
              {currentStation.doorName}
            </span>
          </div>
        </div>

        {/* 
          NEOMORPHIC HUD CARD (CLEAN, MINIMAL, TACTILE)
          - Mobile / Tablet (< lg): Bottom Docked Neomorphic Floating Sheet
          - Desktop (lg:): Left Floating Neomorphic Sidebar Card
        */}
        <div
          ref={hudCardRef}
          className="absolute z-20 pointer-events-none transition-opacity duration-300
            bottom-3 inset-x-3 sm:inset-x-6 max-w-md mx-auto w-auto
            lg:top-28 lg:left-8 lg:bottom-auto lg:inset-x-auto lg:w-[390px] lg:max-w-md"
        >
          <div className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-neutral-900/10 rounded-[24px] p-4 sm:p-6 transition-all duration-300 shadow-[0_24px_48px_-16px_rgba(20,32,29,0.30),0_2px_6px_rgba(20,32,29,0.06)] flex flex-col max-h-[56dvh] lg:max-h-none overflow-hidden">
            {/* Header: Step Indicator */}
            <div className="flex items-center justify-end gap-2 shrink-0">

              {/* Step indicator pill */}
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] font-mono font-bold text-neutral-600">
                <span>{activeStep === 0 ? 'Markaz' : `${activeStep} / 6`}</span>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="mt-3 shrink-0">
              <h2 className="text-[clamp(1.15rem,2.4vw,1.75rem)] font-extrabold tracking-tight text-neutral-900 leading-[1.15]">
                {currentStation.title}
              </h2>
              <p className="text-xs font-semibold text-primary-800 mt-0.5">
                {currentStation.subtitle}
              </p>
            </div>

            {/* Area konten kartu: bisa digulir di mobile agar kartu tidak menutupi
                adegan 3D; di desktop mengalir normal tanpa gulir */}
            <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-visible -mx-1 px-1">
            {/* Inset Neomorphic Content Box */}
            <div className="mt-3 p-3 sm:p-3.5 rounded-2xl bg-[#F7F4ED] border border-neutral-900/5 space-y-2.5">
              <p className="text-[13px] leading-relaxed text-neutral-600">
                {currentStation.description}
              </p>

              {/* Kartu data melayang: data aplikasi nyata per stasiun */}
              <dl className="grid grid-cols-2 gap-2 pt-0.5">
                {currentStation.details.map((d) => (
                  <div key={d.label} className="rounded-xl bg-white border border-neutral-900/5 px-2 py-1.5 sm:px-2.5 sm:py-2 shadow-[0_1px_2px_rgba(20,32,29,0.05)]">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{d.label}</dt>
                    <dd className="text-[11px] font-mono font-bold text-primary-900 mt-0.5 leading-snug">{d.value}</dd>
                  </div>
                ))}
              </dl>

              {/* Status & Key Metric Row */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#CBD5E1]/30 text-neutral-700">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-medium text-neutral-600">
                    {activeStep === 0
                      ? (isFrontDoorOpen ? 'Pintu Terbuka' : 'Pintu Masuk')
                      : currentStation.doorName}
                  </span>
                </div>
                <span className="font-mono font-bold text-[11px] text-primary-900 bg-white/70 px-2 py-0.5 rounded-md border border-white">
                  {currentStation.metricValue}
                </span>
              </div>
            </div>

            {/* Quick Search on Step 0 (Clean & Simple Neomorphic Input) */}
            {activeStep === 0 && (
              <div className="mt-3 space-y-2">
                <form onSubmit={handleQuickSearch}>
                  <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-neutral-200 focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-600/20 transition-all">
                    <Search className="w-3.5 h-3.5 text-neutral-400 ml-2 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchKode}
                      onChange={(e) => {
                        setSearchKode(e.target.value.toUpperCase());
                        setQuickError('');
                      }}
                      placeholder="Cek kode unik (ZKHTNU9L6XKD)"
                      maxLength={14}
                      className="w-full bg-transparent text-xs font-mono font-bold uppercase text-neutral-900 placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-neutral-400 focus:outline-none px-1 py-1"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-primary-800 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all whitespace-nowrap cursor-pointer"
                    >
                      Cek
                    </button>
                  </div>
                  {quickError && <p className="text-[11px] text-red-600 font-medium pl-1 mt-1">{quickError}</p>}
                </form>

                {/* Sample Code chips */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-neutral-500 text-[10px]">Contoh:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchKode('ZKHTNU9L6XKD');
                      window.location.href = '/verifikasi/ZKHTNU9L6XKD';
                    }}
                    className="px-2 py-1 rounded-md bg-white text-primary-900 font-mono font-bold border border-neutral-200 hover:border-primary-600 transition-all cursor-pointer text-[10px]"
                  >
                    ZKHTNU9L6XKD
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchKode('ZK4B8V2KNT9X');
                      window.location.href = '/verifikasi/ZK4B8V2KNT9X';
                    }}
                    className="px-2 py-1 rounded-md bg-white text-neutral-700 font-mono font-semibold border border-neutral-200 hover:border-primary-600 transition-all cursor-pointer text-[10px]"
                  >
                    ZK4B8V2KNT9X
                  </button>
                </div>
              </div>
            )}

            </div>

            {/* Action Row */}
            <div className="flex items-center gap-2 sm:gap-3 mt-3.5 pt-3 border-t border-neutral-200/50 shrink-0">
              {activeStep === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAkadModal) onOpenAkadModal();
                    else handleJumpToStep(1);
                  }}
                  className="inline-flex items-center justify-center gap-2 flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-neutral-950 text-xs font-bold shadow-[2px_2px_8px_rgba(200,150,46,0.3)] transition-all cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Salurkan / Hitung Zakat</span>
                </button>
              ) : (
                <Link
                  href={currentStation.actionHref}
                  className="inline-flex items-center justify-center gap-2 flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-800 to-primary-700 hover:from-primary-700 hover:to-primary-600 text-white text-xs font-semibold shadow-[2px_2px_8px_rgba(15,92,77,0.25)] transition-all"
                >
                  <span className="truncate">{currentStation.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                </Link>
              )}

              {/* Station Prev/Next Navigation Controls — Neomorphic convex square buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={activeStep === 0}
                  onClick={() => handleJumpToStep(activeStep - 1)}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 shadow-sm hover:border-primary-600 active:bg-neutral-50 disabled:opacity-35 text-neutral-700 transition-all cursor-pointer"
                  title="Stasiun sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={activeStep === 6}
                  onClick={() => handleJumpToStep(activeStep + 1)}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 shadow-sm hover:border-primary-600 active:bg-neutral-50 disabled:opacity-35 text-neutral-700 transition-all cursor-pointer"
                  title="Stasiun berikutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
  </div>
);
}
