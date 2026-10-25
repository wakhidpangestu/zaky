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
    subtitle: 'Arsitektur Islami Modern Putih Megah & Fasad Berkelanjutan',
    description:
      'Gedung markaz pusat terpadu Zaky tampak luar berwarna putih megah. Scroll ke bawah untuk masuk menembus pintu gerbang utama dan menelusuri 6 ruangan berpintu di dalamnya.',
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
    slug: 'penyaluran-saksi',
    badge: 'LANGKAH 04 — PENYALURAN',
    title: 'Ruang Serah Terima & Saksi Lapangan',
    subtitle: 'Konfirmasi 2 Metode: OTP Mustahik atau Geotag Saksi',
    description:
      'Bantuan diserahkan langsung. Penyaluran disahkan melalui verifikasi tautan/SMS OTP mustahik atau foto geotag bersama saksi dari unit distribusi berbeda.',
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
      { label: 'Saksi Lintas Unit', value: 'Dewi (Unit Distribusi)' },
    ],
  },
  {
    id: 5,
    slug: 'rantai-kripto',
    badge: 'LANGKAH 05 — RANTAI LOG AUDIT',
    title: 'Ruang Data Center Rantai Kriptografis',
    subtitle: 'Log Transaksi Append-Only & SHA-256 Kekal',
    description:
      'Setiap mutasi dicatat dalam tabel append-only yang tak bisa diubah maupun dihapus. Data dinormalisasi dengan kanonikalisasi RFC 8785 JCS dan dirantai secara kriptografis.',
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
      { label: 'Format Serialisasi', value: 'RFC 8785 Deterministik' },
      { label: 'Penyimpanan Log', value: 'PostgreSQL Append-Only' },
      { label: 'Deteksi Manipulasi', value: 'Seketika (Zero Latency)' },
    ],
  },
  {
    id: 6,
    slug: 'papan-silang',
    badge: 'LANGKAH 06 — PAPAN SILANG',
    title: 'Ruang Observatorium Papan Silang',
    subtitle: 'Konsensus Federasi Antarlembaga & Tanda Tangan Ed25519',
    description:
      'Setiap tengah malam, hash riwayat mutasi harian disaksikan dan ditandatangani oleh lembaga zakat mitra independen (Pusat, Bandung, Surabaya). Data mustahil dimanipulasi sepihak.',
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

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const facadeDoorsRef = useRef<THREE.Group | null>(null);
  const fullBuildingGroupRef = useRef<THREE.Group | null>(null);
  const roomDoorsRef = useRef<THREE.Group[]>([]);
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
  // Default camera angle in Hero: isometric perspective viewing the building on the right
  const targetCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(15, 13, 21));
  const targetCameraLookAt = useRef<THREE.Vector3>(new THREE.Vector3(4.5, 3.2, 0));
  const targetCharPos = useRef<THREE.Vector3>(new THREE.Vector3(3.0, 0.25, 9.5));

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

    // 2. Camera: Isometric 3D angle looking at the building on the right half of the screen
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(15, 13, 21);
    camera.lookAt(4.5, 3.2, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting: Crisp architectural sunlight + soft sky fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe5f5ee, 0xd8e4df, 0.48);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.6);
    sunLight.position.set(28, 40, 24);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 250;
    sunLight.shadow.camera.left = -90;
    sunLight.shadow.camera.right = 90;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    // Warm foyer light inside the main entrance
    const foyerLight = new THREE.PointLight(0xf59e0b, 2.5, 14);
    foyerLight.position.set(4.5, 3.0, 3.5);
    scene.add(foyerLight);

    // Room accent lights
    const accentColors = [0xc8962e, 0x0f5c4d, 0x10b981, 0x38bdf8, 0x10b981, 0x38bdf8];
    [22, 44, 66, 88, 110, 132].forEach((xPos, idx) => {
      const pLight = new THREE.PointLight(accentColors[idx], 1.8, 22);
      pLight.position.set(xPos, 5.5, 2.0);
      scene.add(pLight);
    });

    // -----------------------------------------------------------
    // MATERIALS PALETTE (PURE CRISP WHITE EXTERIOR + HIGH CONTRAST)
    // -----------------------------------------------------------
    // Pure White Building Facade Material
    const pureWhiteFacadeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.22,
      metalness: 0.04,
    });
    // White Terrace / Steps
    const whiteStepMat = new THREE.MeshStandardMaterial({
      color: 0xfbfbfb,
      roughness: 0.35,
    });
    const darkEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x0a3d33,
      roughness: 0.35,
      metalness: 0.2,
    });
    const brandEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x0f5c4d,
      roughness: 0.25,
      metalness: 0.35,
    });
    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xc8962e,
      roughness: 0.18,
      metalness: 0.9,
    });
    const windowGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.08,
      metalness: 0.92,
    });
    const screenGlowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    });
    const glowPathMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.85,
    });
    const warmWoodMat = new THREE.MeshStandardMaterial({
      color: 0x7c583f,
      roughness: 0.45,
    });
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
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
    // REAL PHYSICAL DOORS FOR EVERY SINGLE ROOM (PINTU SETIAP RUANGAN)
    // -----------------------------------------------------------
    const roomDoorTitles = [
      'PINTU 1: LOBI PENERIMAAN',
      'PINTU 2: VALIDASI ASNAF',
      'PINTU 3: OTORISASI 4-MATA',
      'PINTU 4: PENYALURAN & SAKSI',
      'PINTU 5: DATA CENTER KRIPTO',
      'PINTU 6: PAPAN SILANG',
    ];

    const createArchwayDoor = (xPos: number, doorTitle: string) => {
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

      // PHYSICAL DOUBLE DOOR PANELS (Daun Pintu Terbuka Mengundang Masuk)
      // Left Door Leaf (Angled 40 deg open)
      const leftDoorLeaf = new THREE.Group();
      leftDoorLeaf.position.set(0, 0, 1.0);
      leftDoorLeaf.rotation.y = -Math.PI / 4.2;
      const leftDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.7, 1.8), brandEmeraldMat);
      leftDoorPanel.position.set(0, 2.45, 0.9);
      leftDoorPanel.castShadow = true;
      // Gold Handle
      const handleL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 8), goldAccentMat);
      handleL.position.set(0.12, 2.3, 1.65);
      leftDoorLeaf.add(leftDoorPanel, handleL);

      // Right Door Leaf (Angled 40 deg open)
      const rightDoorLeaf = new THREE.Group();
      rightDoorLeaf.position.set(0, 0, 4.6);
      rightDoorLeaf.rotation.y = Math.PI / 4.2;
      const rightDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.7, 1.8), brandEmeraldMat);
      rightDoorPanel.position.set(0, 2.45, -0.9);
      rightDoorPanel.castShadow = true;
      // Gold Handle
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
        leftDoorLeaf,
        rightDoorLeaf,
        signBorder,
        signPlaque
      );
      return portal;
    };

    const doorPositions = [11, 33, 55, 77, 99, 121];
    doorPositions.forEach((xPos, idx) => {
      const doorMesh = createArchwayDoor(xPos, roomDoorTitles[idx]);
      worldGroup.add(doorMesh);
      roomDoorsRef.current.push(doorMesh);
    });

    // -----------------------------------------------------------
    // STATION 0: PURE CRISP WHITE ISLAMIC MODERN BUILDING (TAMPAK DEPAN UTUH)
    // Centered around X = 4.5 so it sits proudly on the right half of the view!
    // -----------------------------------------------------------
    const buildingFullGroup = new THREE.Group();
    buildingFullGroup.position.set(4.5, 0, 0);
    fullBuildingGroupRef.current = buildingFullGroup;

    // 1. Plinth / Stepped White Marble Entrance Podium
    const basePodium = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.8, 14), pureWhiteFacadeMat);
    basePodium.position.set(0, 0.4, 1.0);
    basePodium.castShadow = true;
    basePodium.receiveShadow = true;
    buildingFullGroup.add(basePodium);

    // Grand Entrance White Steps leading up to the main arch
    for (let s = 0; s < 4; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(8 - s * 0.5, 0.18, 5 - s * 0.7),
        whiteStepMat
      );
      step.position.set(0, 0.18 * s + 0.09, 8.5 - s * 0.6);
      step.receiveShadow = true;
      buildingFullGroup.add(step);
    }

    // 2. Main White Tower (Pristine White Marble Architecture with 3D Depth)
    const mainTower = new THREE.Mesh(new THREE.BoxGeometry(11.5, 11.0, 11), pureWhiteFacadeMat);
    mainTower.position.set(-2.5, 5.9, 0);
    mainTower.castShadow = true;
    mainTower.receiveShadow = true;
    buildingFullGroup.add(mainTower);

    // Front Window Grid (Dark reflective glass with crisp architectural mullions)
    for (let f = 0; f < 3; f++) {
      for (let w = 0; w < 3; w++) {
        const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.1), pureWhiteFacadeMat);
        windowFrame.position.set(-5.0 + w * 2.5, 4.4 + f * 2.5, 5.55);
        const windowPane = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 0.12), windowGlassMat);
        windowPane.position.set(-5.0 + w * 2.5, 4.4 + f * 2.5, 5.56);
        buildingFullGroup.add(windowFrame, windowPane);
      }
    }

    // Left Side Windows
    for (let f = 0; f < 3; f++) {
      for (let w = 0; w < 3; w++) {
        const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 1.6), windowGlassMat);
        sideWin.position.set(-8.3, 4.4 + f * 2.5, -3.0 + w * 3.0);
        buildingFullGroup.add(sideWin);
      }
    }

    // 3. Right Tower Wing — Also in Pristine Pure White with Gold Louvers
    const whiteRightWing = new THREE.Mesh(new THREE.BoxGeometry(6.5, 13.0, 10), pureWhiteFacadeMat);
    whiteRightWing.position.set(5.5, 6.9, 0);
    whiteRightWing.castShadow = true;
    whiteRightWing.receiveShadow = true;
    buildingFullGroup.add(whiteRightWing);

    // Front windows on Right Tower Wing
    for (let f = 0; f < 3; f++) {
      const rwWin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 0.12), windowGlassMat);
      rwWin.position.set(5.5, 4.4 + f * 2.5, 5.06);
      buildingFullGroup.add(rwWin);
    }

    // Vertical gold sunshade louvers on Right White Wing
    for (let l = 0; l < 4; l++) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.15, 10.5, 0.4), goldAccentMat);
      louver.position.set(3.5 + l * 1.3, 6.8, 5.15);
      buildingFullGroup.add(louver);
    }

    // Rooftop Terrace with Gold Railing
    const terraceRailing = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.8, 10), goldAccentMat);
    terraceRailing.position.set(5.5, 13.5, 0);
    buildingFullGroup.add(terraceRailing);

    // 4. Grand Islamic Triple-Arched White Entrance Portico (Pintu Masuk Utama)
    const entranceGroup = new THREE.Group();
    facadeDoorsRef.current = entranceGroup;
    entranceGroup.position.set(-2.5, 0, 5.6);

    // Main Arched Portal Frame in White & Gold
    const mainArchTrim = new THREE.Mesh(new THREE.BoxGeometry(4.4, 4.8, 0.4), pureWhiteFacadeMat);
    mainArchTrim.position.set(0, 2.4, 0);
    const mainArchInner = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.2, 0.2), goldAccentMat);
    mainArchInner.position.set(0, 2.1, 0.1);
    const entranceGlass = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.8, 0.1), windowGlassMat);
    entranceGlass.position.set(0, 1.9, 0.15);

    entranceGroup.add(mainArchTrim, mainArchInner, entranceGlass);
    buildingFullGroup.add(entranceGroup);

    // Modern glass entrance canopy over steps
    const canopyGlass = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.1, 2.8), windowGlassMat);
    canopyGlass.position.set(-2.5, 4.6, 6.8);
    const canopyRod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8), goldAccentMat);
    canopyRod1.rotation.x = -Math.PI / 4;
    canopyRod1.position.set(-4.5, 5.3, 6.2);
    const canopyRod2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8), goldAccentMat);
    canopyRod2.rotation.x = -Math.PI / 4;
    canopyRod2.position.set(-0.5, 5.3, 6.2);
    buildingFullGroup.add(canopyGlass, canopyRod1, canopyRod2);

    // 5. Islamic Modern Dome on Rooftop in Pure White with Gold Ribs
    const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.1, 0.7, 16), pureWhiteFacadeMat);
    domeBase.position.set(-2.5, 11.75, 0);
    const domeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.7, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      pureWhiteFacadeMat
    );
    domeSphere.position.set(-2.5, 12.1, 0);
    domeSphere.castShadow = true;
    const domeFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.8, 8), goldAccentMat);
    domeFinial.position.set(-2.5, 15.3, 0);
    buildingFullGroup.add(domeBase, domeSphere, domeFinial);

    // 6. Modern Minaret Tower on Left Corner in Pure White
    const minaretBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 14.5, 8), pureWhiteFacadeMat);
    minaretBase.position.set(-7.5, 7.25, 5.0);
    minaretBase.castShadow = true;

    const minaretBalcony = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.3, 0.6, 8), goldAccentMat);
    minaretBalcony.position.set(-7.5, 14.6, 5.0);

    const minaretSpire = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4.0, 8), pureWhiteFacadeMat);
    minaretSpire.position.set(-7.5, 16.9, 5.0);
    minaretSpire.castShadow = true;

    const crescent = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.08, 16, 32, Math.PI * 1.5),
      goldAccentMat
    );
    crescent.position.set(-7.5, 19.3, 5.0);
    crescent.rotation.z = Math.PI * 0.25;
    buildingFullGroup.add(minaretBase, minaretBalcony, minaretSpire, crescent);

    // 7. Bold Illuminated 3D "Z A K Y" Name Sign in Gold on White Parapet
    const signGroup = new THREE.Group();
    signGroup.position.set(5.5, 11.8, 5.2);
    ['Z', 'A', 'K', 'Y'].forEach((char, idx) => {
      const lMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.75, 0.25), goldAccentMat);
      lMesh.position.x = (idx - 1.5) * 1.3;
      signGroup.add(lMesh);
    });
    buildingFullGroup.add(signGroup);

    // 8. Plaza Forecourt: Octagonal Islamic Fountain with Water Spray
    const fountainBasin = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.55, 8), pureWhiteFacadeMat);
    fountainBasin.position.set(-2.5, 0.28, 12.0);
    fountainBasin.castShadow = true;

    const fountainWater = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.58, 8), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9 }));
    fountainWater.position.set(-2.5, 0.3, 12.0);

    const fountainNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.2, 8), goldAccentMat);
    fountainNozzle.position.set(-2.5, 0.85, 12.0);
    buildingFullGroup.add(fountainBasin, fountainWater, fountainNozzle);

    // 9. Asphalt Driveway with Road Markings
    const roadCurve = new THREE.Mesh(new THREE.BoxGeometry(16, 0.1, 4.5), asphaltMat);
    roadCurve.position.set(0, 0.06, 14.5);
    roadCurve.receiveShadow = true;
    buildingFullGroup.add(roadCurve);

    // White logistics delivery van ("Armada Zaky") on driveway
    const vanGroup = new THREE.Group();
    vanGroup.position.set(4.5, 0.35, 14.5);
    vanGroup.rotation.y = -Math.PI * 0.9;
    const vanBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 3.2), pureWhiteFacadeMat);
    vanBody.position.y = 0.65;
    vanBody.castShadow = true;
    const vanStripe = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.25, 3.22), brandEmeraldMat);
    vanStripe.position.y = 0.55;
    vanGroup.add(vanBody, vanStripe);
    buildingFullGroup.add(vanGroup);

    // 4 Palm Trees around fountain
    [-6.5, -4.5, 0.5, 2.5].forEach((tx) => {
      const pTree = new THREE.Group();
      pTree.position.set(tx, 0, 11.5);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 3.4, 8), warmWoodMat);
      trunk.position.y = 1.7;
      trunk.castShadow = true;
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.2, 7), new THREE.MeshStandardMaterial({ color: 0x137a66, roughness: 0.8 }));
      canopy.position.y = 3.8;
      canopy.castShadow = true;
      pTree.add(trunk, canopy);
      buildingFullGroup.add(pTree);
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
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.95,
          transparent: true,
          opacity: 0.85,
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
    charRoot.position.set(3.0, 0.25, 9.5);
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
    // RENDER & DYNAMIC CATCH-UP ANIMATION LOOP
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
        cameraRef.current.position.lerp(targetCameraPos.current, 0.08);
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

        if (distance > 0.06) {
          // Dynamic adaptive speed: scales up dramatically if user scrolls fast!
          const dynamicSpeed = Math.max(14.0, distance * 8.5);
          const stepDist = Math.min(distance, delta * dynamicSpeed);

          const dirX = diffX / distance;
          const dirZ = diffZ / distance;
          char.position.x += dirX * stepDist;
          char.position.z += dirZ * stepDist;

          const moveAngle = Math.atan2(dirX, dirZ);
          char.rotation.y = THREE.MathUtils.lerp(char.rotation.y, moveAngle, 0.25);

          const walkFreq = Math.min(22.0, 9.0 + distance * 2.5);
          const swing = Math.sin(time * walkFreq);
          parts.leftLeg.rotation.x = swing * 0.55;
          parts.rightLeg.rotation.x = -swing * 0.55;
          parts.leftArm.rotation.x = -swing * 0.55;
          parts.rightArm.rotation.x = swing * 0.55;
          parts.torso.position.y = 0.95 + Math.abs(Math.sin(time * walkFreq * 2)) * 0.06;
        } else {
          char.rotation.y = THREE.MathUtils.lerp(char.rotation.y, 0, 0.15);
          parts.leftLeg.rotation.x = THREE.MathUtils.lerp(parts.leftLeg.rotation.x, 0, 0.2);
          parts.rightLeg.rotation.x = THREE.MathUtils.lerp(parts.rightLeg.rotation.x, 0, 0.2);
          parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, 0, 0.2);
          parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, 0, 0.2);
          parts.torso.position.y = 0.95 + Math.sin(time * 1.5) * 0.02;
        }
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
  // GSAP SCROLLTRIGGER: PINNED HORIZONTAL JOURNEY
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

          // 1. Cinematic Exterior to Interior Transition (Progress 0.0 to 0.14)
          if (progress < 0.14) {
            const t0 = progress / 0.14; // 0 to 1

            // Camera smoothly swoops down and enters through the grand entrance
            targetCameraPos.current.set(
              THREE.MathUtils.lerp(15, 18, t0),
              THREE.MathUtils.lerp(13, 6.8, t0),
              THREE.MathUtils.lerp(21, 16.5, t0)
            );
            targetCameraLookAt.current.set(
              THREE.MathUtils.lerp(4.5, 18, t0),
              THREE.MathUtils.lerp(3.2, 2.2, t0),
              0
            );

            // Character walks up the front entrance steps into the building
            targetCharPos.current.set(
              THREE.MathUtils.lerp(3.0, 18, t0),
              0.25,
              THREE.MathUtils.lerp(9.5, 2.8, t0)
            );

            if (facadeDoorsRef.current) {
              facadeDoorsRef.current.position.y = THREE.MathUtils.lerp(0, 3.8, t0);
            }
          } else {
            // 2. Interior Tour through Rooms 1 to 6 (Progress 0.14 to 1.0)
            const tInterior = (progress - 0.14) / (1 - 0.14); // 0 to 1
            const interiorX = 22 + tInterior * (132 - 22);

            targetCameraPos.current.set(interiorX, 6.8, 16.5);
            targetCameraLookAt.current.set(interiorX, 2.2, 0);

            // Character follows the glowing path at Z = 2.8
            targetCharPos.current.set(interiorX, 0.25, 2.8);

            if (facadeDoorsRef.current) {
              facadeDoorsRef.current.position.y = 3.8;
            }
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
        <DoorOpen className="w-4 h-4 text-primary-700" />
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
        LEFT FLOATING HUD CARD
      */}
      <div className="absolute left-4 sm:left-8 lg:left-12 top-28 bottom-28 z-20 flex items-center pointer-events-none">
        <div className="w-full max-w-md sm:max-w-lg bg-white/92 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-neutral-200/90 shadow-xl pointer-events-auto transition-all duration-300 text-left space-y-4">
          {/* Station Badge & Unit */}
          <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <span className="text-[11px] font-bold font-mono tracking-wider text-primary-700 uppercase bg-primary-100/70 px-2.5 py-1 rounded-lg">
              {currentStation.badge}
            </span>
            <span className="text-[11px] font-medium text-neutral-500 truncate max-w-[200px]">
              {currentStation.unit}
            </span>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              {currentStation.title}
            </h2>
            <p className="text-xs font-semibold text-primary-700">
              {currentStation.subtitle}
            </p>
            <p className="text-xs text-neutral-600 leading-relaxed pt-1">
              {currentStation.description}
            </p>
          </div>

          {/* Metric Breakdown Box */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-800 border-b border-neutral-200/60 pb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                <span>{currentStation.metricLabel}</span>
              </span>
              <span className="font-mono text-primary-700 bg-white px-2 py-0.5 rounded-md border border-neutral-200 shadow-2xs">
                {currentStation.metricValue}
              </span>
            </div>

            <div className="space-y-1 pt-0.5">
              {currentStation.details.map((detail, dIdx) => (
                <div key={dIdx} className="flex items-center justify-between text-[11px] text-neutral-600">
                  <span>{detail.label}</span>
                  <span className="font-mono font-medium text-neutral-800">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
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
