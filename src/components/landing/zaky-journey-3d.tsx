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
  Sparkles,
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
  DoorOpen,
  DoorClosed,
} from 'lucide-react';
import Link from 'next/link';

// Register GSAP ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface JourneyStation {
  id: number;
  slug: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  unit: string;
  actor: string;
  roomName: string;
  doorName: string;
  xPosition: number;
  metricLabel: string;
  metricValue: string;
  actionText: string;
  actionHref: string;
  details: {
    label: string;
    value: string;
  }[];
}

// 7 Stasiun: Fasad Gedung Putih Utuh (0) + 6 Ruangan Berpintu Fisik Horizontal (1 s/d 6)
export const STATIONS: JourneyStation[] = [
  {
    id: 0,
    slug: 'overview',
    badge: 'MARKAZ PUSAT ZAKY',
    title: 'Gedung Markaz Zakat Nasional Zaky',
    subtitle: 'Arsitektur Islami Modern Putih Megah & Pintu Otomatis',
    description:
      'Gedung markaz pusat terpadu Zaky tampak luar berwarna putih elegan dengan jendela pita modern. Scroll ke bawah untuk melihat pintu depan terbuka otomatis dan menelusuri 6 ruangan institusi.',
    unit: 'Gedung Utama',
    actor: 'Markaz Nasional',
    roomName: 'Fasad Putih & Plaza Utama',
    doorName: 'Pintu Gerbang Utama',
    xPosition: 0,
    metricLabel: 'Lembaga Terhubung',
    metricValue: '3 Kota Federasi',
    actionText: 'Masuk Melewati Pintu Utama',
    actionHref: '#step-1',
    details: [
      { label: 'Warna Gedung', value: 'Putih Marmer Islami Modern' },
      { label: 'Protokol Keamanan', value: 'Segregasi 4-Mata & P2P' },
      { label: 'Audit Kriptografi', value: 'RFC 8785 Deterministik' },
    ],
  },
  {
    id: 1,
    slug: 'akad-penerimaan',
    badge: 'LANGKAH 01 — PENERIMAAN',
    title: 'Lobi Akad & Penyetoran Muzakki',
    subtitle: 'Pemisahan Hak Amil Sejak Detik Pertama Transaksi',
    description:
      'Muzakki menunaikan zakat melalui loket digital resmi. Sistem langsung memisahkan maksimal 12.5% hak amil dan mengunci 87.5% dana zakat murni ke pos dana asnaf.',
    unit: 'Unit Pengumpulan (UPZ)',
    actor: 'Amil Budi (Petugas Penerima)',
    roomName: 'Lobi Pelayanan Muzakki',
    doorName: 'Pintu 1: Lobi Penerimaan',
    xPosition: 22,
    metricLabel: 'Pemisahan Hak Amil',
    metricValue: 'Maks. 12.5% Pasti',
    actionText: 'Coba Simulasi Setor',
    actionHref: '/penerimaan/buat',
    details: [
      { label: 'Dana Zakat Murni', value: '87.5% (Rp 8.750.000)' },
      { label: 'Hak Amil Terkunci', value: '12.5% (Rp 1.250.000)' },
      { label: 'Bukti Akad', value: 'E-Kuitansi + SHA-256' },
    ],
  },
  {
    id: 2,
    slug: 'verifikasi-asnaf',
    badge: 'LANGKAH 02 — PENDATAAN',
    title: 'Ruang Validasi Asnaf & Privasi PDP',
    subtitle: 'Pencocokan 8 Golongan Syariah & Penyamaran NIK',
    description:
      'Petugas lapangan memvalidasi berkas mustahik sesuai QS At-Taubah:60. NIK dan identitas sensitif disamarkan otomatis dengan HMAC-SHA256 untuk melindungi martabat.',
    unit: 'Unit Pendataan & Asnaf',
    actor: 'Rian (Analis Asnaf Lapangan)',
    roomName: 'Ruang Survei & Validasi',
    doorName: 'Pintu 2: Validasi Asnaf',
    xPosition: 44,
    metricLabel: 'Kategori Asnaf',
    metricValue: '8 Golongan Sah',
    actionText: 'Lihat Standar Syariah',
    actionHref: '/docs#syariah',
    details: [
      { label: 'Golongan Penerima', value: 'Fakir / Miskin / Riqab' },
      { label: 'Masking PDP', value: '3201****8912 (HMAC)' },
      { label: 'Status Validasi', value: 'Rekomendasi Sah' },
    ],
  },
  {
    id: 3,
    slug: 'segregasi-4-mata',
    badge: 'LANGKAH 03 — PERSETUJUAN',
    title: 'Ruang Otorisasi Segregasi 4-Mata',
    subtitle: 'Penyetujuan Lintas Unit & Reservasi Saldo Database',
    description:
      'Penyetuju dari Unit Keuangan meninjau rekomendasi draf penyaluran. Pembuat draf dan penyetuju mutlak dari unit berbeda. Saldo dicadangkan seketika di PostgreSQL.',
    unit: 'Unit Keuangan & Otorisasi',
    actor: 'Penyetuju Hari (Direktur Otorisasi)',
    roomName: 'Ruang Direksi Eksekutif',
    doorName: 'Pintu 3: Otorisasi 4-Mata',
    xPosition: 66,
    metricLabel: 'Konkurensi Database',
    metricValue: '0 Saldo Over-allocate',
    actionText: 'Cek Aturan 4-Mata',
    actionHref: '/docs#four-eyes',
    details: [
      { label: 'Pembuat Draf', value: 'Amil Budi (Unit Layanan)' },
      { label: 'Penyetuju Sah', value: 'Hari (Unit Keuangan)' },
      { label: 'Kunci Baris DB', value: 'FOR UPDATE Monotonik' },
    ],
  },
  {
    id: 4,
    slug: 'distribusi-saksi',
    badge: 'LANGKAH 04 — LOGISTIK & SAKSI',
    title: 'Ruang Serah Terima & Saksi Independen',
    subtitle: 'Verifikasi Dua Saksi Lapangan & Pengesahan OTP',
    description:
      'Paket manfaat diserahkan langsung kepada mustahik. Dua saksi dari unit berbeda menandatangani berita acara serah terima atau mustahik memasukkan token OTP 72 jam.',
    unit: 'Unit Distribusi & Logistik',
    actor: 'Saksi Dewi (Saksi Independen)',
    roomName: 'Gudang Logistik & Serah Terima',
    doorName: 'Pintu 4: Penyaluran & Saksi',
    xPosition: 88,
    metricLabel: 'Metode Pengesahan',
    metricValue: 'OTP / Saksi Geotag',
    actionText: 'Verifikasi Penyaluran',
    actionHref: '/verifikasi/ZKHTNU9L6XKD',
    details: [
      { label: 'Paket Amanah', value: 'Bantuan Sembako & Tunai' },
      { label: 'Konfirmasi Penerima', value: 'OTP SMS Valid' },
      { label: 'Saksi Lapangan', value: '2 Saksi Akun Berbeda' },
    ],
  },
  {
    id: 5,
    slug: 'rantai-audit',
    badge: 'LANGKAH 05 — KRIPTOGRAFI',
    title: 'Ruang Audit Kriptografi Rantai SHA-256',
    subtitle: 'Pencatatan Kekal Append-Only & Hash Harian Ed25519',
    description:
      'Setiap mutasi terhubung secara matematis dalam rantai audit SHA-256 deterministik. Basis data mengunci tabel secara append-only dan menerbitkan hash harian.',
    unit: 'Biro Teknologi & Kriptografi',
    actor: 'Sistem Rantai Otomatis',
    roomName: 'Ruang Server Kriptografi',
    doorName: 'Pintu 5: Data Center Kripto',
    xPosition: 110,
    metricLabel: 'Integritas Mutasi',
    metricValue: '100% SHA-256 Bersambung',
    actionText: 'Pelajari Kriptografi',
    actionHref: '/docs#kriptografi',
    details: [
      { label: 'Kanonikalisasi', value: 'RFC 8785 Deterministik' },
      { label: 'Tanda Tangan', value: 'Ed25519 Asimetris' },
      { label: 'Integritas Log', value: 'Audit Log Append-Only' },
    ],
  },
  {
    id: 6,
    slug: 'federasi-silang',
    badge: 'LANGKAH 06 — PAPAN SILANG P2P',
    title: 'Ruang Observatorium Jaringan Tiga Lembaga',
    subtitle: 'Konsensus Kesaksian Silang Tanpa Server Terpusat',
    description:
      'Tiga lembaga zakat independen (Jakarta, Bandung, Surabaya) saling menyaksikan hash harian satu sama lain. Setiap manipulasi data lokal langsung terdeteksi seketika.',
    unit: 'Jaringan Federasi Nasional',
    actor: '3 Lembaga Silang',
    roomName: 'Ruang Rapat Konsensus P2P',
    doorName: 'Pintu 6: Papan Silang',
    xPosition: 132,
    metricLabel: 'Status Konsensus',
    metricValue: '100% Cocok (0 Anomali)',
    actionText: 'Pantau Papan Silang',
    actionHref: '/silang',
    details: [
      { label: 'Lembaga Penerbit', value: 'Lembaga A (Pusat Jakarta)' },
      { label: 'Lembaga Saksi 1', value: 'Lembaga B (Bandung)' },
      { label: 'Lembaga Saksi 2', value: 'Lembaga C (Surabaya)' },
    ],
  },
];

interface AnimatedRoomDoor {
  xPos: number;
  leftLeaf: THREE.Group;
  rightLeaf: THREE.Group;
  sensorMesh?: THREE.Mesh;
}

interface ZakyJourney3DProps {
  onOpenAkadModal?: () => void;
}

export default function ZakyJourney3D({ onOpenAkadModal }: ZakyJourney3DProps) {
  const pinSectionRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const scrollTriggerInstanceRef = useRef<ScrollTrigger | null>(null);

  const [activeStep, setActiveStep] = useState<number>(0);
  const [searchKode, setSearchKode] = useState<string>('ZKHTNU9L6XKD');
  const [quickError, setQuickError] = useState<string>('');
  const [isFrontDoorOpen, setIsFrontDoorOpen] = useState<boolean>(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
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

  // Smooth lerp coordinates
  const currentProgressRef = useRef<number>(0);
  // Default camera angle in Hero: isometric perspective viewing the FULL building zoomed out nicely
  const targetCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(29.0, 22.0, 38.0));
  const targetCameraLookAt = useRef<THREE.Vector3>(new THREE.Vector3(2.5, 8.5, 0));
  const targetCharPos = useRef<THREE.Vector3>(new THREE.Vector3(1.0, 0.25, 9.5));
  const walkDistanceRef = useRef<number>(0);

  const handleJumpToStep = useCallback((stepIndex: number) => {
    const clamped = Math.max(0, Math.min(6, stepIndex));
    setActiveStep(clamped);

    if (scrollTriggerInstanceRef.current) {
      const st = scrollTriggerInstanceRef.current;
      const progress = clamped / 6;
      const targetScroll = st.start + progress * (st.end - st.start);
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, []);

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
    if (!canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf2f7f4);
    scene.fog = new THREE.FogExp2(0xf2f7f4, 0.007);

    // 2. Camera: Isometric 3D angle zoomed out to view the entire building fully
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(29.0, 22.0, 38.0);
    camera.lookAt(2.5, 8.5, 0);

    // 3. Renderer - Neomorphic styling with ZERO shadows
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false; // NO SHADOWS
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

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
      color: 0x0f5c4d,
      roughness: 0.5,
    });
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
      color: 0xe0ac69,
      roughness: 0.6,
    });

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // -----------------------------------------------------------
    // CONTINUOUS PLAZA, FLOOR, AND HALLWAY WALLS
    // -----------------------------------------------------------
    const longPlaza = new THREE.Mesh(
      new THREE.BoxGeometry(190, 0.8, 34),
      new THREE.MeshStandardMaterial({ color: 0xedf3f0, roughness: 0.7 })
    );
    longPlaza.position.set(65, -0.4, 0);
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

    const doorPositions = [11, 33, 55, 77, 99, 121];
    doorPositions.forEach((xPos, idx) => {
      const { portalGroup, doorData } = createArchwayDoor(xPos, roomDoorTitles[idx]);
      worldGroup.add(portalGroup);
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
    const verticalBlade = new THREE.Mesh(new THREE.BoxGeometry(4.8, 22.0, 0.8), darkEmeraldMat);
    verticalBlade.position.set(5.2, 11.0, -3.8);
    verticalBlade.castShadow = true;

    // Vertical gold fluting slats across the blade face
    for (let sl = 0; sl < 18; sl++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.08, 21.6, 0.1), goldAccentMat);
      slat.position.set(3.2 + sl * 0.22, 11.0, -3.38);
      buildingFullGroup.add(slat);
    }
    const bladeCoping = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.35, 1.0), goldAccentMat);
    bladeCoping.position.set(5.2, 22.1, -3.8);
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
        epCtx.fillStyle = '#F4F7F5';
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

    // 9. TREES & PLANTER BOXES AROUND PODIUM
    const treePositions = [
      [-6.5, 0, 7.5],
      [-5.0, 0, 11.0],
      [1.5, 0, 10.5],
      [5.5, 0, 9.5],
    ];
    treePositions.forEach(([tx, ty, tz]) => {
      const tree = new THREE.Group();
      tree.position.set(tx, ty, tz);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 2.8, 8), warmWoodMat);
      trunk.position.y = 1.4;
      const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x137a66, roughness: 0.7 })
      );
      canopy.position.y = 3.2;
      tree.add(trunk, canopy);
      buildingFullGroup.add(tree);
    });

    worldGroup.add(buildingFullGroup);

    // -----------------------------------------------------------
    // ROOM 1 (X = 22): LOBI PENERIMAAN & AKAD (HIGH DETAIL)
    // -----------------------------------------------------------
    const room1 = new THREE.Group();
    room1.position.set(22, 0, 0);

    const rug1 = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.02, 4.5), new THREE.MeshStandardMaterial({ color: 0x0f5c4d, roughness: 0.9 }));
    rug1.position.set(-1.0, 0.13, 0.5);
    room1.add(rug1);

    const counterDesk = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.1, 1.4), pureWhiteFacadeMat);
    counterDesk.position.set(0, 0.55, -2.2);
    counterDesk.castShadow = true;
    const counterTrim = new THREE.Mesh(new THREE.BoxGeometry(5.45, 0.1, 1.45), goldAccentMat);
    counterTrim.position.set(0, 1.08, -2.2);

    [-1.6, 1.6].forEach((tx) => {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.4), darkEmeraldMat);
      stand.position.set(tx, 1.12, -2.2);
      const scr = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.03), screenGlowMat);
      scr.position.set(tx, 1.3, -2.35);
      scr.rotation.x = -0.2;
      room1.add(stand, scr);
    });

    // Seated Amil Budi
    const amilStaff = new THREE.Group();
    amilStaff.position.set(0, 0.5, -3.2);
    const amilBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.35), brandEmeraldMat);
    amilBody.position.y = 0.55;
    const amilHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinToneMat);
    amilHead.position.y = 1.05;
    const amilPeci = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.18, 16), darkEmeraldMat);
    amilPeci.position.y = 1.2;
    amilStaff.add(amilBody, amilHead, amilPeci);
    room1.add(amilStaff);

    // Muzakki Standing at Counter
    const muzakkiChar = new THREE.Group();
    muzakkiChar.position.set(0, 0, -1.0);
    muzakkiChar.rotation.y = Math.PI;
    const mBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), pureWhiteFacadeMat);
    mBody.position.y = 1.0;
    const mHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinToneMat);
    mHead.position.y = 1.5;
    muzakkiChar.add(mBody, mHead);
    room1.add(muzakkiChar);

    // L-shaped Emerald Velvet Sofa
    const sofaMain = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.65, 1.5), brandEmeraldMat);
    sofaMain.position.set(-3.5, 0.35, 2.5);
    sofaMain.castShadow = true;
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.8, 0.3), brandEmeraldMat);
    sofaBack.position.set(-3.5, 0.9, 3.2);
    const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 1.0), warmWoodMat);
    coffeeTable.position.set(-3.5, 0.23, 1.0);

    // Safe Box with Gold Dial
    const safeBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.6), darkEmeraldMat);
    safeBox.position.set(4.5, 1.2, -5.5);
    safeBox.castShadow = true;
    const safeDial = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16), goldAccentMat);
    safeDial.rotation.x = Math.PI / 2;
    safeDial.position.set(4.5, 1.4, -4.68);

    room1.add(counterDesk, counterTrim, sofaMain, sofaBack, coffeeTable, safeBox, safeDial);
    worldGroup.add(room1);

    // -----------------------------------------------------------
    // ROOM 2 (X = 44): RUANG VALIDASI ASNAF & PRIVASI (HIGH DETAIL)
    // -----------------------------------------------------------
    const room2 = new THREE.Group();
    room2.position.set(44, 0, 0);

    const desk2A = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1.4), warmWoodMat);
    desk2A.position.set(-3.0, 0.85, -2.8);
    const desk2B = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1.4), warmWoodMat);
    desk2B.position.set(3.0, 0.85, -2.8);

    const holoPedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.8, 8), darkEmeraldMat);
    holoPedestal.position.set(0, 0.4, 0.5);

    const holoPrism = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 1.8, 8),
      new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.7, wireframe: true })
    );
    holoPrism.position.set(0, 2.0, 0.5);

    const holoRing = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.06, 16, 32), goldAccentMat);
    holoRing.rotation.x = Math.PI / 2;
    holoRing.position.set(0, 2.2, 0.5);

    const wallScreen2 = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.0), screenGlowMat);
    wallScreen2.position.set(0, 4.0, -8.1);

    room2.add(desk2A, desk2B, holoPedestal, holoPrism, holoRing, wallScreen2);
    worldGroup.add(room2);

    // -----------------------------------------------------------
    // ROOM 3 (X = 66): RUANG OTORISASI 4-MATA (HIGH DETAIL)
    // -----------------------------------------------------------
    const room3 = new THREE.Group();
    room3.position.set(66, 0, 0);

    const execDesk = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.85, 2.2), darkEmeraldMat);
    execDesk.position.set(0, 0.45, -2.5);
    execDesk.castShadow = true;
    const execLeather = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.08, 2.25), brandEmeraldMat);
    execLeather.position.set(0, 0.9, -2.5);

    const execChair = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.8), darkEmeraldMat);
    execChair.position.set(0, 1.1, -4.2);

    const hariChar = new THREE.Group();
    hariChar.position.set(0, 0.6, -3.8);
    const hBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.38), darkSuitMat);
    hBody.position.y = 0.55;
    const hHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinToneMat);
    hHead.position.y = 1.05;
    hariChar.add(hBody, hHead);

    const bioStand = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.55), goldAccentMat);
    bioStand.position.set(1.5, 0.98, -2.0);
    const bioRing = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 16, 32), glowPathMat);
    bioRing.rotation.x = Math.PI / 2;
    bioRing.position.set(1.5, 1.18, -2.0);

    const wallMatrix = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.2), new THREE.MeshBasicMaterial({ color: 0x0a3d33 }));
    wallMatrix.position.set(0, 4.0, -8.1);

    room3.add(execDesk, execLeather, execChair, hariChar, bioStand, bioRing, wallMatrix);
    worldGroup.add(room3);

    // -----------------------------------------------------------
    // ROOM 4 (X = 88): RUANG SERAH TERIMA & SAKSI (HIGH DETAIL)
    // -----------------------------------------------------------
    const room4 = new THREE.Group();
    room4.position.set(88, 0, 0);

    const handCounter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.0, 1.4), pureWhiteFacadeMat);
    handCounter.position.set(0, 0.5, -1.8);
    handCounter.castShadow = true;

    const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    const greenAidMat = new THREE.MeshStandardMaterial({ color: 0x0f5c4d, roughness: 0.5 });

    const createBox = (bx: number, by: number, bz: number, isGreen = false) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), isGreen ? greenAidMat : boxMat);
      b.position.set(bx, by, bz);
      b.castShadow = true;
      return b;
    };

    room4.add(
      createBox(-4.0, 0.35, -5.0, true),
      createBox(-4.0, 1.05, -5.0, false),
      createBox(-4.0, 0.35, -3.9, false),
      createBox(-3.0, 0.35, -5.0, false),
      createBox(-3.0, 1.05, -5.0, true),
      createBox(4.0, 0.35, -5.0, false),
      createBox(4.0, 1.05, -5.0, true)
    );

    const dewiChar = new THREE.Group();
    dewiChar.position.set(-1.0, 0, -0.4);
    const dBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), brandEmeraldMat);
    dBody.position.y = 0.95;
    const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), skinToneMat);
    dHead.position.y = 1.45;
    const dPhone = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.04), screenGlowMat);
    dPhone.position.set(0.3, 1.15, 0.25);
    dewiChar.add(dBody, dHead, dPhone);

    const mustahikChar = new THREE.Group();
    mustahikChar.position.set(1.0, 0, -0.4);
    mustahikChar.rotation.y = Math.PI;
    const mustBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), new THREE.MeshStandardMaterial({ color: 0x64748b }));
    mustBody.position.y = 0.95;
    const mustHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), skinToneMat);
    mustHead.position.y = 1.45;
    mustahikChar.add(mustBody, mustHead);

    room4.add(handCounter, dewiChar, mustahikChar);
    worldGroup.add(room4);

    // -----------------------------------------------------------
    // ROOM 5 (X = 110): DATA CENTER RANTAI KRIPTO (HIGH DETAIL)
    // -----------------------------------------------------------
    const room5 = new THREE.Group();
    room5.position.set(110, 0, 0);

    const serverMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.9 });
    [-4.5, -2.4, 2.4, 4.5].forEach((rx) => {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.7, 4.8, 1.5), serverMat);
      rack.position.set(rx, 2.4, -5.0);
      rack.castShadow = true;
      const led = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.12), glowPathMat);
      led.position.set(rx, 3.5, -4.23);
      room5.add(rack, led);
    });

    const cryptoCubesGroup = new THREE.Group();
    cryptoCubesRef.current = cryptoCubesGroup;
    cryptoCubesGroup.position.set(0, 2.5, 0);

    for (let i = 0; i < 5; i++) {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        new THREE.MeshStandardMaterial({
          color: 0x0f5c4d,
          roughness: 0.35,
          metalness: 0.1,
          transparent: true,
          opacity: 0.9,
        })
      );
      cube.position.set((i - 2) * 1.3, Math.sin(i * 0.9) * 0.3, 0);
      cryptoCubesGroup.add(cube);
    }
    room5.add(cryptoCubesGroup);

    const wallScreen5 = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.4), new THREE.MeshBasicMaterial({ color: 0x064e3b }));
    wallScreen5.position.set(0, 4.0, -8.1);
    room5.add(wallScreen5);

    worldGroup.add(room5);

    // -----------------------------------------------------------
    // ROOM 6 (X = 132): RUANG OBSERVATORIUM PAPAN SILANG
    // -----------------------------------------------------------
    const room6 = new THREE.Group();
    room6.position.set(132, 0, 0);

    const fedTable = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.7, 32), brandEmeraldMat);
    fedTable.position.set(0, 0.65, 0);

    const globeGroup = new THREE.Group();
    federationGlobeRef.current = globeGroup;
    globeGroup.position.set(0, 2.6, 0);

    const wireGlobe = new THREE.Mesh(
      new THREE.SphereGeometry(1.3, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.75 })
    );
    globeGroup.add(wireGlobe);

    const cityNodes = [
      { pos: [-0.6, 0.3, 0.5], color: 0x10b981 },
      { pos: [0.5, -0.2, 0.6], color: 0x38bdf8 },
      { pos: [0.2, 0.5, -0.6], color: 0xf59e0b },
    ];
    cityNodes.forEach(({ pos, color }) => {
      const bNode = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshBasicMaterial({ color }));
      bNode.position.set(...(pos as [number, number, number]));
      globeGroup.add(bNode);
    });

    [-3.2, 0, 3.2].forEach((bx, bIdx) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.0, 8), goldAccentMat);
      pole.position.set(bx, 2.5, -5.0);
      const banner = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 2.0),
        new THREE.MeshStandardMaterial({ color: bIdx === 0 ? 0x0f5c4d : bIdx === 1 ? 0x0369a1 : 0xb45309 })
      );
      banner.position.set(bx, 3.5, -4.98);
      room6.add(pole, banner);
    });

    room6.add(fedTable, globeGroup);
    worldGroup.add(room6);

    // -----------------------------------------------------------
    // THE 3D TRAVELING CHARACTER (AMIL ZAKY)
    // -----------------------------------------------------------
    const charRoot = new THREE.Group();
    charRoot.position.set(1.0, 0.25, 9.5);
    worldGroup.add(charRoot);
    characterGroupRef.current = charRoot;

    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.95;
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.38), brandEmeraldMat);
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.4), pureWhiteFacadeMat);
    collar.position.y = 0.35;
    torsoGroup.add(bodyMesh, collar);

    const headGroup = new THREE.Group();
    headGroup.position.y = 0.65;
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinToneMat);
    const peciMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.22, 16), darkEmeraldMat);
    peciMesh.position.y = 0.18;
    headGroup.add(headMesh, peciMesh);
    torsoGroup.add(headGroup);

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.38, 0.25, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 0.16), brandEmeraldMat);
    leftArmMesh.position.y = -0.28;
    leftArm.add(leftArmMesh);
    torsoGroup.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.38, 0.25, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 0.16), brandEmeraldMat);
    rightArmMesh.position.y = -0.28;
    rightArm.add(rightArmMesh);
    torsoGroup.add(rightArm);

    charRoot.add(torsoGroup);

    const trouserMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.18, 0.65, 0);
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.2), trouserMat);
    leftLegMesh.position.y = -0.32;
    leftLeg.add(leftLegMesh);
    charRoot.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.18, 0.65, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.2), trouserMat);
    rightLegMesh.position.y = -0.32;
    rightLeg.add(rightLegMesh);
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
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (cryptoCubesRef.current) {
        cryptoCubesRef.current.rotation.y = time * 0.7;
        cryptoCubesRef.current.position.y = 2.5 + Math.sin(time * 2) * 0.15;
      }

      if (federationGlobeRef.current) {
        federationGlobeRef.current.rotation.y = time * 0.5;
      }

      // Smooth camera interpolation
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCameraPos.current, 0.075);
        cameraRef.current.lookAt(targetCameraLookAt.current);
      }

      // Adaptive Dynamic Character Movement (Never lags behind on fast scroll!)
      if (characterGroupRef.current && charPartsRef.current) {
        const char = characterGroupRef.current;
        const parts = charPartsRef.current;
        const target = targetCharPos.current;

        const diffX = target.x - char.position.x;
        const diffZ = target.z - char.position.z;
        const distance = Math.hypot(diffX, diffZ);

        if (distance > 0.05) {
          // Gentle natural walking speed (calm and smooth amil walk pace)
          const walkSpeed = Math.min(3.8, Math.max(1.6, distance * 2.2));
          const stepDist = Math.min(distance, delta * walkSpeed);

          const dirX = diffX / distance;
          const dirZ = diffZ / distance;
          char.position.x += dirX * stepDist;
          char.position.z += dirZ * stepDist;

          const moveAngle = Math.atan2(dirX, dirZ);
          char.rotation.y = THREE.MathUtils.lerp(char.rotation.y, moveAngle, 0.12);

          // Stride length = 1.4 meters. Leg swing strictly follows ground displacement!
          walkDistanceRef.current += stepDist;
          const walkCycle = (walkDistanceRef.current / 1.4) * Math.PI * 2;
          const swing = Math.sin(walkCycle) * 0.22; // Soft 12-degree walking swing

          parts.leftLeg.rotation.x = THREE.MathUtils.lerp(parts.leftLeg.rotation.x, swing, 0.25);
          parts.rightLeg.rotation.x = THREE.MathUtils.lerp(parts.rightLeg.rotation.x, -swing, 0.25);
          parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, -swing * 0.55, 0.25);
          parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, swing * 0.55, 0.25);
          parts.torso.position.y = 0.95 + Math.abs(Math.sin(walkCycle)) * 0.012;
        } else {
          char.rotation.y = THREE.MathUtils.lerp(char.rotation.y, 0, 0.1);
          parts.leftLeg.rotation.x = THREE.MathUtils.lerp(parts.leftLeg.rotation.x, 0, 0.18);
          parts.rightLeg.rotation.x = THREE.MathUtils.lerp(parts.rightLeg.rotation.x, 0, 0.18);
          parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, 0, 0.18);
          parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, 0, 0.18);
          parts.torso.position.y = THREE.MathUtils.lerp(parts.torso.position.y, 0.95, 0.18);
        }

        // DYNAMIC SENSOR & AUTOMATIC OPENING FOR ALL ROOM DOORS (PINTU OTOMATIS)
        const charX = char.position.x;
        roomDoorsRef.current.forEach((door) => {
          const distToDoor = door.xPos - charX; // positive when hero approaches from left

          // Sensor range: within 4.5m approaching and up to 1.8m past doorway
          let openAmount = 0;
          if (distToDoor > 4.5) {
            // Far away: closed
            openAmount = 0;
          } else if (distToDoor >= -1.8) {
            // Approaching and walking through doorway
            // Smoothly open from dist 4.5 down to 1.5 (fully open)
            openAmount = Math.min(1.0, Math.max(0, (4.5 - distToDoor) / 2.8));
          } else {
            // Hero walked past the doorway into the room: gently ease shut behind him
            const past = -distToDoor; // > 1.8
            openAmount = Math.max(0, 1.0 - (past - 1.8) / 3.0);
          }

          // Automatic swing angle: ~85 degrees open
          const targetAngle = openAmount * (Math.PI / 2.15);
          door.leftLeaf.rotation.y = THREE.MathUtils.lerp(door.leftLeaf.rotation.y, -targetAngle, 0.14);
          door.rightLeaf.rotation.y = THREE.MathUtils.lerp(door.rightLeaf.rotation.y, targetAngle, 0.14);

          // Sensor LED color change: green when opening, gold when idle/closed
          if (door.sensorMesh) {
            const mat = door.sensorMesh.material as THREE.MeshBasicMaterial;
            if (openAmount > 0.15) {
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
      width = canvasContainerRef.current.clientWidth;
      height = canvasContainerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  // -------------------------------------------------------------
  // GSAP SCROLLTRIGGER: PINNED HORIZONTAL JOURNEY WITH AUTOMATIC DOORS
  // -------------------------------------------------------------
  useEffect(() => {
    if (typeof window !== 'undefined' && pinSectionRef.current) {
      const pinTrigger = ScrollTrigger.create({
        trigger: pinSectionRef.current,
        start: 'top top',
        end: () => `+=${window.innerWidth * 5.2}`,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        onUpdate: (self) => {
          const progress = self.progress; // 0.0 to 1.0
          currentProgressRef.current = progress;

          const stepFloat = progress * 6;
          const currentIdx = Math.min(6, Math.floor(stepFloat + 0.25));
          setActiveStep(currentIdx);

          // 1. Cinematic Exterior-to-Interior Dive through Automatic Front Doors (Progress 0.0 to 0.14)
          if (progress < 0.14) {
            const t0 = progress / 0.14; // 0 to 1
            // Cubic smooth easing for natural entrance velocity
            const tSmooth = t0 * t0 * (3 - 2 * t0);

            // FRONT AUTOMATIC SLIDING DOORS LOGIC:
            // Closed when t0 < 0.08, smoothly slides wide open between 0.08 and 0.45!
            let frontOpenT = 0;
            if (t0 < 0.08) {
              frontOpenT = 0;
              setIsFrontDoorOpen(false);
            } else if (t0 <= 0.45) {
              frontOpenT = (t0 - 0.08) / 0.37;
              setIsFrontDoorOpen(true);
            } else {
              frontOpenT = 1.0;
              setIsFrontDoorOpen(true);
            }

            // Animate Front Sliding Doors (Retract outwards into portal walls)
            if (frontSlideLeftRef.current && frontSlideRightRef.current) {
              frontSlideLeftRef.current.position.x = -0.75 - frontOpenT * 1.35;
              frontSlideRightRef.current.position.x = 0.75 + frontOpenT * 1.35;
            }

            // Animate Front Sensor LED indicator
            if (frontSensorLedRef.current) {
              const ledMat = frontSensorLedRef.current.material as THREE.MeshBasicMaterial;
              if (frontOpenT > 0.05) {
                ledMat.color.setHex(0x10b981); // Bright Emerald Green (Open)
              } else {
                ledMat.color.setHex(0xc8962e); // Gold (Closed)
              }
            }

            // Camera smoothly glides down from high isometric exterior and swoops right through the entrance portal
            targetCameraPos.current.set(
              THREE.MathUtils.lerp(29.0, 22.0, tSmooth),
              THREE.MathUtils.lerp(22.0, 6.8, tSmooth),
              THREE.MathUtils.lerp(38.0, 16.5, tSmooth)
            );
            targetCameraLookAt.current.set(
              THREE.MathUtils.lerp(2.5, 22.0, tSmooth),
              THREE.MathUtils.lerp(8.5, 2.2, tSmooth),
              THREE.MathUtils.lerp(0, 0, tSmooth)
            );

            // Character walks up the curved driveway into the arched portal and through the opened automatic doors
            targetCharPos.current.set(
              THREE.MathUtils.lerp(1.0, 22.0, tSmooth),
              0.25,
              THREE.MathUtils.lerp(9.5, 2.8, tSmooth)
            );
          } else {
            // 2. Interior Tour through Rooms 1 to 6 (Progress 0.14 to 1.0)
            setIsFrontDoorOpen(true);

            // Keep front sliding doors open
            if (frontSlideLeftRef.current && frontSlideRightRef.current) {
              frontSlideLeftRef.current.position.x = -2.1;
              frontSlideRightRef.current.position.x = 2.1;
            }

            const tInterior = (progress - 0.14) / (1 - 0.14); // 0 to 1
            const interiorX = 22 + tInterior * (132 - 22);

            targetCameraPos.current.set(interiorX, 6.8, 16.5);
            targetCameraLookAt.current.set(interiorX, 2.2, 0);

            // Character follows the glowing path at Z = 2.8
            targetCharPos.current.set(interiorX, 0.25, 2.8);
          }
        },
      });

      scrollTriggerInstanceRef.current = pinTrigger;

      return () => {
        pinTrigger.kill();
      };
    }
  }, []);

  const currentStation = STATIONS[activeStep] || STATIONS[0];

  return (
    <div
      ref={pinSectionRef}
      className="relative w-full h-screen overflow-hidden bg-[#F4F7F5] selection:bg-primary-100 selection:text-primary-900"
    >
      {/* 
        3D WEBGL CANVAS VIEWPORT
      */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 w-full h-full z-0 pointer-events-auto"
        style={{ touchAction: 'none' }}
      />

      {/* Top & Bottom Vignettes for Soft Seamless Blending */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/95 via-white/50 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F4F7F5] via-[#F4F7F5]/70 to-transparent pointer-events-none z-10" />

      {/* Top Active Room Indicator Badge */}
      <div className="absolute top-24 right-4 sm:right-8 z-20 hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/85 backdrop-blur-md border border-neutral-200/90 shadow-sm pointer-events-auto">
        {isFrontDoorOpen || activeStep > 0 ? (
          <DoorOpen className="w-4 h-4 text-emerald-600" />
        ) : (
          <DoorClosed className="w-4 h-4 text-amber-600" />
        )}
        <div className="text-left">
          <span className="block text-[10px] font-mono font-bold tracking-wider uppercase text-neutral-400">
            {currentStation.doorName}
          </span>
          <span className="block text-xs font-bold text-neutral-800">
            {currentStation.roomName}
          </span>
        </div>
      </div>

      {/* 
        LEFT INTERACTIVE HUD CARD (SEPERTI DI VIDEO REFERENSI)
        Persistent, dynamic, context-aware information panel
      */}
      <div className="absolute top-28 left-4 sm:left-8 z-20 w-[90%] sm:w-[410px] max-w-md pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-neutral-200/90 shadow-xl rounded-3xl p-5 sm:p-6 space-y-4 transition-all">
          {/* Header row: Badge + Unit */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-primary-50 text-primary-800 border border-primary-200/70">
              <Sparkles className="w-3 h-3 text-primary-600" />
              {currentStation.badge}
            </span>
            <span className="text-[11px] font-medium text-neutral-500 truncate max-w-[170px]">
              {currentStation.actor}
            </span>
          </div>

          {/* Title & Subtitle */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 leading-snug">
              {currentStation.title}
            </h2>
            <p className="text-xs font-medium text-primary-700 mt-1">
              {currentStation.subtitle}
            </p>
          </div>

          {/* Dynamic Door Status Badge */}
          <div className="flex items-center gap-2">
            {activeStep === 0 ? (
              isFrontDoorOpen ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                  <DoorOpen className="w-3.5 h-3.5 text-emerald-600" />
                  Pintu Utama: Terbuka Otomatis (Masuk...)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  Pintu Utama: Tertutup (Otomatis Terbuka Saat Scroll)
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <DoorOpen className="w-3.5 h-3.5 text-emerald-600" />
                Sensor Gerak Pintu: Aktif Otomatis
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed text-neutral-600">
            {currentStation.description}
          </p>

          {/* Key Metric Highlight */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-primary-900 to-primary-800 text-white flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-emerald-200/90 font-medium">
                {currentStation.metricLabel}
              </p>
              <p className="text-sm sm:text-base font-extrabold text-white mt-0.5 font-mono">
                {currentStation.metricValue}
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-accent-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Spec details grid */}
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            {currentStation.details.map((detail, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-neutral-50/80 border border-neutral-100"
              >
                <span className="text-neutral-500 font-normal">{detail.label}</span>
                <span className="text-neutral-900 font-semibold font-mono text-[11px]">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Search on Step 0 */}
          {activeStep === 0 && (
            <div className="space-y-2 pt-1">
              <form onSubmit={handleQuickSearch}>
                <div className="flex items-center gap-2 p-1.5 bg-neutral-50 rounded-2xl border border-neutral-200 focus-within:border-primary-700 transition-all">
                  <Search className="w-4 h-4 text-neutral-400 ml-2.5 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchKode}
                    onChange={(e) => {
                      setSearchKode(e.target.value.toUpperCase());
                      setQuickError('');
                    }}
                    placeholder="Masukkan kode unik (mis. ZKHTNU9L6XKD)"
                    maxLength={14}
                    className="w-full bg-transparent text-xs font-mono font-bold uppercase text-neutral-900 placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-neutral-400 focus:outline-none px-2 py-1"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-primary-700 hover:bg-primary-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-all whitespace-nowrap cursor-pointer"
                  >
                    Cek
                  </button>
                </div>
                {quickError && <p className="text-xs text-red-600 font-medium pl-2">{quickError}</p>}
              </form>

              {/* Clickable Quick Sample Codes including ZKHTNU9L6XKD */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-neutral-400 font-medium">Contoh kode:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchKode('ZKHTNU9L6XKD');
                    window.location.href = '/verifikasi/ZKHTNU9L6XKD';
                  }}
                  className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold hover:bg-emerald-200 transition-colors cursor-pointer border border-emerald-200"
                  title="Klik untuk verifikasi transaksi ZKHTNU9L6XKD"
                >
                  ZKHTNU9L6XKD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchKode('ZK4B8V2KNT9X');
                    window.location.href = '/verifikasi/ZK4B8V2KNT9X';
                  }}
                  className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-mono font-semibold hover:bg-neutral-200 transition-colors cursor-pointer border border-neutral-200"
                >
                  ZK4B8V2KNT9X
                </button>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-2">
            {activeStep === 0 ? (
              <button
                type="button"
                onClick={() => {
                  if (onOpenAkadModal) onOpenAkadModal();
                  else handleJumpToStep(1);
                }}
                className="inline-flex items-center justify-center gap-2 flex-1 py-2.5 px-4 rounded-xl bg-accent-500 hover:bg-accent-600 text-neutral-950 text-xs font-bold shadow-sm transition-all hover:scale-102 cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>Salurkan / Hitung Zakat</span>
              </button>
            ) : (
              <Link
                href={currentStation.actionHref}
                className="inline-flex items-center justify-center gap-2 flex-1 py-2 px-4 rounded-xl bg-primary-700 hover:bg-primary-600 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>{currentStation.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={activeStep === 0}
                onClick={() => handleJumpToStep(activeStep - 1)}
                className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 disabled:opacity-30 text-neutral-700 transition-colors cursor-pointer"
                title="Stasiun sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={activeStep === 6}
                onClick={() => handleJumpToStep(activeStep + 1)}
                className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 disabled:opacity-30 text-neutral-700 transition-colors cursor-pointer"
                title="Stasiun berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 
        BOTTOM PERSISTENT HORIZONTAL JOURNEY STEPPER
      */}
      <div className="absolute bottom-4 sm:bottom-6 inset-x-0 z-30 max-w-4xl mx-auto px-4 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-lg border border-neutral-200/90 shadow-xl rounded-2xl p-2 sm:p-2.5">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {STATIONS.map((station) => {
              const isActive = activeStep === station.id;
              const isPassed = activeStep > station.id;

              return (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => handleJumpToStep(station.id)}
                  className={`flex-1 py-1.5 px-1 sm:px-2.5 rounded-xl text-center transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-primary-700 text-white font-bold shadow-xs scale-102'
                      : isPassed
                      ? 'text-neutral-700 hover:bg-neutral-100 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100/60 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                    <span
                      className={`text-[10px] sm:text-xs font-mono rounded-full w-4 h-4 flex items-center justify-center ${
                        isActive
                          ? 'bg-white text-primary-800 font-bold'
                          : isPassed
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-neutral-200/80 text-neutral-600'
                      }`}
                    >
                      {station.id}
                    </span>
                    <span className="text-[11px] sm:text-xs truncate hidden md:inline">
                      {station.slug === 'overview'
                        ? 'Gedung Putih'
                        : station.doorName.replace('Pintu ', 'P')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
