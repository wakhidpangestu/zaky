'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  Network,
  Sparkles,
  Search,
  ChevronRight,
  QrCode,
  Building2,
  FileCheck2,
  Scale,
  Eye,
  Hash,
  ExternalLink,
  Coins,
  HeartHandshake,
  Check,
  AlertCircle,
  Truck,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

// Register GSAP ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// 6 Tahapan Perjalanan Zaky (Alur Lengkap Transparansi Zakat)
export interface JourneyStep {
  id: number;
  slug: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  unit: string;
  actor: string;
  roomName: string;
  metricLabel: string;
  metricValue: string;
  actionText: string;
  actionHref: string;
  details: {
    label: string;
    value: string;
  }[];
}

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 0,
    slug: 'overview',
    badge: 'MARKAZ PUSAT ZAKY',
    title: 'Gedung Markaz Zakat Nasional Zaky',
    subtitle: 'Arsitektur Fisik & Digital Terpadu Berlandaskan Amanah Syariah',
    description:
      'Selamat datang di ekosistem Zaky. Di sinilah setiap transaksi zakat melewati 6 lapisan perlindungan, segregasi 4-unit kewenangan, dan konsensus kriptografis antarlembaga.',
    unit: 'Gedung Utama',
    actor: 'Markaz Nasional',
    roomName: 'Plaza & Fasad Utama',
    metricLabel: 'Lembaga Terhubung',
    metricValue: '3 Kota Federasi',
    actionText: 'Mulai Tur Interaktif',
    actionHref: '#step-1',
    details: [
      { label: 'Status Bangunan', value: 'Modern Islamic HQ' },
      { label: 'Protokol Keamanan', value: '4-Mata & Konsensus P2P' },
      { label: 'Audit Kripto', value: 'RFC 8785 Deterministik' },
    ],
  },
  {
    id: 1,
    slug: 'akad-penerimaan',
    badge: 'LANGKAH 01 — PENERIMAAN',
    title: 'Lobi Akad & Penyetoran Muzakki',
    subtitle: 'Transparansi Pemisahan Hak Amil Sejak Detik Pertama',
    description:
      'Muzakki menunaikan zakat melalui loket digital resmi. Sistem langsung mengunci pemisahan maksimal 12.5% hak amil dan 87.5% dana zakat murni ke pos dana asnaf.',
    unit: 'Unit Pengumpulan (UPZ)',
    actor: 'Amil Budi (Petugas Penerima)',
    roomName: 'Lobi Pelayanan Muzakki',
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
      'Petugas lapangan memvalidasi berkas mustahik sesuai kriteria QS At-Taubah:60. NIK dan identitas sensitif disamarkan otomatis menggunakan HMAC-SHA256 untuk melindungi martabat.',
    unit: 'Unit Pendataan & Asnaf',
    actor: 'Rian (Analis Asnaf Lapangan)',
    roomName: 'Ruang Survei & Validasi',
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
      'Penyetuju dari Unit Keuangan meninjau draf penyaluran. Pembuat draf dan penyetuju mutlak harus dari unit berbeda untuk mencegah kolusi. Saldo dicadangkan seketika di PostgreSQL.',
    unit: 'Unit Keuangan & Otorisasi',
    actor: 'Penyetuju Hari (Direktur Otorisasi)',
    roomName: 'Ruang Direksi Eksekutif',
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
    title: 'Ruang Serah Terima & Saksi Lintas Unit',
    subtitle: 'Konfirmasi 2 Metode: OTP Mustahik atau Geotag Saksi',
    description:
      'Bantuan diserahkan langsung. Penyaluran disahkan melalui verifikasi tautan/SMS OTP mustahik atau foto geotag bersama saksi dari unit distribusi berbeda.',
    unit: 'Unit Distribusi & Logistik',
    actor: 'Saksi Dewi (Saksi Independen)',
    roomName: 'Gudang Logistik & Serah Terima',
    metricLabel: 'Metode Pengesahan',
    metricValue: 'OTP / Saksi Geotag',
    actionText: 'Verifikasi Penyaluran',
    actionHref: '/verifikasi/ZK4B8V2KNT9X',
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
    title: 'Ruang Server Rantai Kriptografis',
    subtitle: 'Log Transaksi Append-Only & SHA-256 Kekal',
    description:
      'Setiap mutasi dicatat dalam tabel append-only yang tak bisa diubah maupun dihapus. Data dinormalisasi dengan kanonikalisasi RFC 8785 JCS dan dirantai secara kriptografis.',
    unit: 'Biro Teknologi & Kriptografi',
    actor: 'Sistem Rantai Otomatis',
    roomName: 'Ruang Data Center Amanah',
    metricLabel: 'Integritas Mutasi',
    metricValue: '100% SHA-256 Bersambung',
    actionText: 'Pelajari Kriptografi',
    actionHref: '/docs#kriptografi',
    details: [
      { label: 'Format Serialisasi', value: 'RFC 8785 Deterministik' },
      { label: 'Penyimpanan Log', value: 'Tabel PostgreSQL Append-Only' },
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
      'Setiap tengah malam, hash riwayat mutasi harian disaksikan dan ditandatangani oleh lembaga zakat mitra independen (Pusat, Bandung, Surabaya). Tidak ada satu pihak pun yang bisa merekayasa data.',
    unit: 'Jaringan Federasi Nasional',
    actor: '3 Lembaga Silang',
    roomName: 'Ruang Rapat Konsensus P2P',
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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [searchKode, setSearchKode] = useState<string>('');
  const [quickError, setQuickError] = useState<string>('');

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterRigRef = useRef<{
    group: THREE.Group;
    torsoGroup: THREE.Group;
    headGroup: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    targetPos: THREE.Vector3;
    isMoving: boolean;
  } | null>(null);
  const roomsGroupRef = useRef<THREE.Group | null>(null);
  const buildingMeshGroupRef = useRef<THREE.Group | null>(null);
  const vanMeshRef = useRef<THREE.Group | null>(null);
  const cryptoChainRef = useRef<THREE.Group | null>(null);
  const federationHoloRef = useRef<THREE.Group | null>(null);

  // Waypoints for camera and character for each of the 7 stages (0..6)
  const WAYPOINTS = [
    // 0: Overview (Fasad Gedung Luar)
    {
      camPos: new THREE.Vector3(18, 14, 20),
      camLookAt: new THREE.Vector3(0, 3, 0),
      charPos: new THREE.Vector3(0, 0, 8.5),
      charRotY: 0,
      zoom: 1,
    },
    // 1: Lobi Akad & Penerimaan Muzakki
    {
      camPos: new THREE.Vector3(-2, 4.5, 9),
      camLookAt: new THREE.Vector3(-4.5, 1.4, 2.5),
      charPos: new THREE.Vector3(-3.5, 0, 4.5),
      charRotY: Math.PI * 0.2,
      zoom: 1.5,
    },
    // 2: Ruang Validasi Asnaf & Privasi
    {
      camPos: new THREE.Vector3(8, 4.5, 8.5),
      camLookAt: new THREE.Vector3(4.5, 1.4, 2.5),
      charPos: new THREE.Vector3(3.8, 0, 4.5),
      charRotY: -Math.PI * 0.2,
      zoom: 1.5,
    },
    // 3: Ruang Otorisasi Segregasi 4-Mata
    {
      camPos: new THREE.Vector3(-3, 8.2, 7.5),
      camLookAt: new THREE.Vector3(-4.5, 5.0, 0),
      charPos: new THREE.Vector3(-3.8, 4.0, 1.2),
      charRotY: Math.PI * 0.15,
      zoom: 1.6,
    },
    // 4: Ruang Serah Terima & Saksi Lapangan
    {
      camPos: new THREE.Vector3(8, 8.2, 7.5),
      camLookAt: new THREE.Vector3(4.5, 5.0, 0),
      charPos: new THREE.Vector3(3.8, 4.0, 1.2),
      charRotY: -Math.PI * 0.15,
      zoom: 1.6,
    },
    // 5: Ruang Server Rantai Kriptografis
    {
      camPos: new THREE.Vector3(-2.5, 11.5, 5),
      camLookAt: new THREE.Vector3(-4.0, 8.4, -2.5),
      charPos: new THREE.Vector3(-3.5, 7.5, -1.2),
      charRotY: 0,
      zoom: 1.7,
    },
    // 6: Ruang Observatorium Papan Silang
    {
      camPos: new THREE.Vector3(7.5, 11.5, 5),
      camLookAt: new THREE.Vector3(4.0, 8.4, -2.5),
      charPos: new THREE.Vector3(3.5, 7.5, -1.2),
      charRotY: 0,
      zoom: 1.7,
    },
  ];

  // Helper function to animate to a specific step
  const goToStep = useCallback((stepIndex: number) => {
    const clamped = Math.max(0, Math.min(6, stepIndex));
    setActiveStep(clamped);

    // Update target for character
    if (characterRigRef.current && WAYPOINTS[clamped]) {
      characterRigRef.current.targetPos.copy(WAYPOINTS[clamped].charPos);
      characterRigRef.current.isMoving = true;
    }
  }, []);

  // Quick Verification handler
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
  // THREE.JS INITIALIZATION & SCENE SETUP
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
    scene.fog = new THREE.FogExp2(0xf2f7f4, 0.015);

    // 2. Camera (Perspective with low FOV for that stylish isometric feel)
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.copy(WAYPOINTS[0].camPos);
    camera.lookAt(WAYPOINTS[0].camLookAt);

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
    renderer.toneMappingExposure = 1.05;

    // Clear existing children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting Setup (Soft Studio + Sunlight + Green/Gold Accents)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe6f4ef, 0xdfe8e4, 0.5);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    sunLight.position.set(24, 38, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Warm Accent Light for Entrance / Lobi
    const lobbyWarmLight = new THREE.PointLight(0xc8962e, 1.8, 15);
    lobbyWarmLight.position.set(-4, 3, 3);
    scene.add(lobbyWarmLight);

    // High-tech Emerald Light for Server / Papan Silang
    const techEmeraldLight = new THREE.PointLight(0x10b981, 2.2, 18);
    techEmeraldLight.position.set(-4, 9, -2);
    scene.add(techEmeraldLight);

    // -----------------------------------------------------------
    // MATERIALS PALETTE (ZAKY DESIGN SYSTEM)
    // -----------------------------------------------------------
    const whiteStoneMat = new THREE.MeshStandardMaterial({
      color: 0xfdfdfd,
      roughness: 0.35,
      metalness: 0.05,
    });
    const creamPlazaMat = new THREE.MeshStandardMaterial({
      color: 0xe8ede9,
      roughness: 0.7,
    });
    const darkEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x0a3d33,
      roughness: 0.3,
      metalness: 0.2,
    });
    const primaryEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x0f5c4d,
      roughness: 0.25,
      metalness: 0.35,
    });
    const accentGoldMat = new THREE.MeshStandardMaterial({
      color: 0xc8962e,
      roughness: 0.2,
      metalness: 0.85,
    });
    const glassWindowMat = new THREE.MeshStandardMaterial({
      color: 0xa5d8cc,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.65,
    });
    const glowPathMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.75,
    });
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x137a66,
      roughness: 0.8,
    });
    const woodFurnitureMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.45,
    });
    const screenCyanMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    });

    // -----------------------------------------------------------
    // 1. PLAZA, ROADWAY, FOUNTAIN & SURROUNDINGS
    // -----------------------------------------------------------
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Ground Island / Base Podium
    const groundMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(24, 25, 0.8, 48),
      creamPlazaMat
    );
    groundMesh.position.y = -0.4;
    groundMesh.receiveShadow = true;
    worldGroup.add(groundMesh);

    // Paved Pathway / Inner courtyard
    const innerCourtyard = new THREE.Mesh(
      new THREE.CylinderGeometry(18, 18, 0.82, 32),
      new THREE.MeshStandardMaterial({ color: 0xf4f7f5, roughness: 0.6 })
    );
    innerCourtyard.position.y = -0.38;
    innerCourtyard.receiveShadow = true;
    worldGroup.add(innerCourtyard);

    // Modern Curved Driveway Road
    const roadCurve = new THREE.Mesh(
      new THREE.TorusGeometry(14, 2.2, 16, 64, Math.PI * 0.9),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    roadCurve.rotation.x = Math.PI / 2;
    roadCurve.position.set(2, -0.36, 6);
    roadCurve.receiveShadow = true;
    worldGroup.add(roadCurve);

    // Modern Islamic Central Fountain Basin (Octagonal)
    const fountainBasin = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.6, 0.45, 8),
      primaryEmeraldMat
    );
    fountainBasin.position.set(0, -0.15, 10);
    fountainBasin.castShadow = true;
    fountainBasin.receiveShadow = true;
    worldGroup.add(fountainBasin);

    const fountainWater = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, 0.46, 8),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.1,
        metalness: 0.9,
      })
    );
    fountainWater.position.set(0, -0.13, 10);
    worldGroup.add(fountainWater);

    // 4 Stylized Palm Trees
    const treePositions = [
      [-9, 0, 8],
      [-11, 0, 4],
      [9, 0, 8],
      [11, 0, 4],
    ];
    treePositions.forEach(([tx, ty, tz]) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, ty, tz);

      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.35, 3.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x785338, roughness: 0.9 })
      );
      trunk.position.y = 1.6;
      trunk.rotation.z = (Math.random() - 0.5) * 0.15;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Fronds (Low-poly palm crown)
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        const frond = new THREE.Mesh(
          new THREE.ConeGeometry(0.65, 2.2, 5),
          foliageMat
        );
        frond.position.set(
          Math.cos(angle) * 0.9,
          3.1 - Math.sin(0.4) * 0.2,
          Math.sin(angle) * 0.9
        );
        frond.rotation.z = Math.cos(angle) * 0.7;
        frond.rotation.x = Math.sin(angle) * 0.7;
        frond.castShadow = true;
        treeGroup.add(frond);
      }
      worldGroup.add(treeGroup);
    });

    // -----------------------------------------------------------
    // 2. ISLAMIC MODERN BUILDING: "GEDUNG MARKAZ ZAKY"
    // -----------------------------------------------------------
    const buildingGroup = new THREE.Group();
    buildingMeshGroupRef.current = buildingGroup;
    worldGroup.add(buildingGroup);

    // Plinth / Podium Step
    const podiumMesh = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.5, 12),
      whiteStoneMat
    );
    podiumMesh.position.set(0, 0.25, 0);
    podiumMesh.castShadow = true;
    podiumMesh.receiveShadow = true;
    buildingGroup.add(podiumMesh);

    // Floor 1 (Lobi & Pelayanan Asnaf - Cutaway)
    const floor1Ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(14.6, 0.3, 11.6),
      darkEmeraldMat
    );
    floor1Ceiling.position.set(0, 3.8, 0);
    floor1Ceiling.castShadow = true;
    buildingGroup.add(floor1Ceiling);

    // Floor 2 (Ruang Otorisasi & Penyaluran - Cutaway)
    const floor2Ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(14.6, 0.3, 11.6),
      darkEmeraldMat
    );
    floor2Ceiling.position.set(0, 7.3, 0);
    floor2Ceiling.castShadow = true;
    buildingGroup.add(floor2Ceiling);

    // Floor 3 (Ruang Server Kripto & Papan Silang - Cutaway)
    const roofMain = new THREE.Mesh(
      new THREE.BoxGeometry(14.6, 0.4, 11.6),
      whiteStoneMat
    );
    roofMain.position.set(0, 10.8, 0);
    roofMain.castShadow = true;
    buildingGroup.add(roofMain);

    // Modern Islamic Parapet & Mashrabiya Crest on Roof
    const parapet = new THREE.Mesh(
      new THREE.BoxGeometry(14.2, 0.6, 11.2),
      primaryEmeraldMat
    );
    parapet.position.set(0, 11.2, 0);
    buildingGroup.add(parapet);

    // Back & Side Walls for realism (cutaway open front)
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(14.6, 10.6, 0.4),
      whiteStoneMat
    );
    backWall.position.set(0, 5.5, -5.8);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    buildingGroup.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 10.6, 11.6),
      whiteStoneMat
    );
    leftWall.position.set(-7.3, 5.5, 0);
    leftWall.castShadow = true;
    buildingGroup.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 10.6, 11.6),
      whiteStoneMat
    );
    rightWall.position.set(7.3, 5.5, 0);
    rightWall.castShadow = true;
    buildingGroup.add(rightWall);

    // Center Dividing Pillar
    const centerDivider = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 10.6, 11.6),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
    );
    centerDivider.position.set(0, 5.5, 0);
    centerDivider.castShadow = true;
    buildingGroup.add(centerDivider);

    // Modern Minaret Tower on Roof (Islamic Spire with Golden Finial)
    const minaretBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 4.5, 8),
      whiteStoneMat
    );
    minaretBase.position.set(-5.2, 13.0, 3.8);
    minaretBase.castShadow = true;
    buildingGroup.add(minaretBase);

    const minaretBalcony = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.3, 0.4, 8),
      primaryEmeraldMat
    );
    minaretBalcony.position.set(-5.2, 15.3, 3.8);
    buildingGroup.add(minaretBalcony);

    const minaretSpire = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 3.2, 8),
      primaryEmeraldMat
    );
    minaretSpire.position.set(-5.2, 17.0, 3.8);
    minaretSpire.castShadow = true;
    buildingGroup.add(minaretSpire);

    // Golden Crescent Finial (Hilal Emas Modern)
    const crescentFinial = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.08, 16, 32, Math.PI * 1.5),
      accentGoldMat
    );
    crescentFinial.position.set(-5.2, 18.9, 3.8);
    crescentFinial.rotation.z = Math.PI * 0.25;
    buildingGroup.add(crescentFinial);

    // Bold 3D "Z A K Y" Name Sign on Rooftop Parapet
    const createLetterMesh = (char: string, x: number) => {
      const letterGroup = new THREE.Group();
      letterGroup.position.set(x, 11.6, 5.7);

      // Letter Geometry representation
      if (char === 'Z') {
        const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.15), accentGoldMat);
        const diagBar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.15, 0.15), accentGoldMat);
        diagBar.rotation.z = -Math.PI / 3.8;
        diagBar.position.y = -0.35;
        const botBar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.15), accentGoldMat);
        botBar.position.y = -0.7;
        letterGroup.add(topBar, diagBar, botBar);
      } else if (char === 'A') {
        const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.85, 0.15), accentGoldMat);
        leftLeg.rotation.z = 0.25;
        leftLeg.position.set(-0.2, -0.35, 0);
        const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.85, 0.15), accentGoldMat);
        rightLeg.rotation.z = -0.25;
        rightLeg.position.set(0.2, -0.35, 0);
        const cross = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.15), accentGoldMat);
        cross.position.y = -0.42;
        letterGroup.add(leftLeg, rightLeg, cross);
      } else if (char === 'K') {
        const spine = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.85, 0.15), accentGoldMat);
        spine.position.set(-0.25, -0.35, 0);
        const upArm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.15), accentGoldMat);
        upArm.rotation.z = Math.PI / 4;
        upArm.position.set(0.08, -0.18, 0);
        const downLeg = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.14, 0.15), accentGoldMat);
        downLeg.rotation.z = -Math.PI / 4;
        downLeg.position.set(0.1, -0.52, 0);
        letterGroup.add(spine, upArm, downLeg);
      } else if (char === 'Y') {
        const stem = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.15), accentGoldMat);
        stem.position.set(0, -0.55, 0);
        const leftBranch = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.15), accentGoldMat);
        leftBranch.rotation.z = -Math.PI / 4;
        leftBranch.position.set(-0.16, -0.18, 0);
        const rightBranch = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.15), accentGoldMat);
        rightBranch.rotation.z = Math.PI / 4;
        rightBranch.position.set(0.16, -0.18, 0);
        letterGroup.add(stem, leftBranch, rightBranch);
      }
      return letterGroup;
    };

    buildingGroup.add(createLetterMesh('Z', -1.5));
    buildingGroup.add(createLetterMesh('A', -0.5));
    buildingGroup.add(createLetterMesh('K', 0.5));
    buildingGroup.add(createLetterMesh('Y', 1.5));

    // Modern Delivery Logistics Van ("Armada Zaky") on Road
    const vanGroup = new THREE.Group();
    vanMeshRef.current = vanGroup;
    vanGroup.position.set(8.5, 0.25, 10.5);
    vanGroup.rotation.y = -Math.PI * 0.7;

    // Body
    const vanBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.1, 3.2),
      whiteStoneMat
    );
    vanBody.position.y = 0.65;
    vanBody.castShadow = true;
    vanGroup.add(vanBody);

    // Green Zaky Accent Stripe on Van
    const vanStripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.62, 0.25, 3.22),
      primaryEmeraldMat
    );
    vanStripe.position.y = 0.55;
    vanGroup.add(vanStripe);

    // Van Windshield
    const vanWindshield = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.5, 0.8),
      glassWindowMat
    );
    vanWindshield.position.set(0, 0.85, 1.25);
    vanGroup.add(vanWindshield);

    // Van Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const wheelPositions = [
      [-0.85, 0.22, 0.9],
      [0.85, 0.22, 0.9],
      [-0.85, 0.22, -0.9],
      [0.85, 0.22, -0.9],
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 16), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      vanGroup.add(wheel);
    });
    worldGroup.add(vanGroup);

    // -----------------------------------------------------------
    // 3. THE 6 INTERIOR ROOMS (ISOMETRIC CUTAWAYS)
    // -----------------------------------------------------------
    const roomsGroup = new THREE.Group();
    roomsGroupRef.current = roomsGroup;
    buildingGroup.add(roomsGroup);

    // Helper to create a stylish desk
    const createDesk = (x: number, y: number, z: number, rotationY = 0) => {
      const deskGroup = new THREE.Group();
      deskGroup.position.set(x, y, z);
      deskGroup.rotation.y = rotationY;

      // Desk top
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.2), woodFurnitureMat);
      top.position.y = 0.85;
      top.castShadow = true;

      // Legs
      const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.85, 8), legMat);
      leg1.position.set(-1.05, 0.42, 0.45);
      const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.85, 8), legMat);
      leg2.position.set(1.05, 0.42, 0.45);
      const leg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.85, 8), legMat);
      leg3.position.set(-1.05, 0.42, -0.45);
      const leg4 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.85, 8), legMat);
      leg4.position.set(1.05, 0.42, -0.45);

      // Laptop / Tablet on Desk
      const laptopBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.03, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
      );
      laptopBase.position.set(0, 0.92, 0);

      const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.32, 0.02), screenCyanMat);
      laptopScreen.position.set(0, 1.08, -0.16);
      laptopScreen.rotation.x = -0.15;

      deskGroup.add(top, leg1, leg2, leg3, leg4, laptopBase, laptopScreen);
      return deskGroup;
    };

    // Helper to create an office chair
    const createChair = (x: number, y: number, z: number, rotY = 0) => {
      const chairGroup = new THREE.Group();
      chairGroup.position.set(x, y, z);
      chairGroup.rotation.y = rotY;

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.7), primaryEmeraldMat);
      seat.position.y = 0.52;

      const back = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.08), primaryEmeraldMat);
      back.position.set(0, 0.9, -0.32);

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 })
      );
      stem.position.y = 0.25;

      chairGroup.add(seat, back, stem);
      return chairGroup;
    };

    // --- ROOM 1: LOBI PENERIMAAN & AKAD MUZAKKI (Floor 1, Left) ---
    const room1 = new THREE.Group();
    room1.position.set(-4.0, 0.5, 2.0);
    const desk1 = createDesk(0, 0, 0, Math.PI);
    const chair1 = createChair(0, 0, -1.0, 0);

    // Queue Ticket Kiosk / Safe
    const safeBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.4, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x0f5c4d, metalness: 0.7, roughness: 0.3 })
    );
    safeBox.position.set(-2.0, 0.7, -1.2);
    safeBox.castShadow = true;

    // Golden Dial on Safe
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), accentGoldMat);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(-2.0, 0.9, -0.73);

    // Digital Screen on Wall: "AKAD MUZAKKI"
    const wallScreen1 = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.0), screenCyanMat);
    wallScreen1.position.set(0, 2.2, -2.8);

    room1.add(desk1, chair1, safeBox, dial, wallScreen1);
    roomsGroup.add(room1);

    // --- ROOM 2: RUANG VALIDASI ASNAF & PRIVASI (Floor 1, Right) ---
    const room2 = new THREE.Group();
    room2.position.set(4.0, 0.5, 2.0);
    const desk2 = createDesk(0, 0, 0, Math.PI);
    const chair2 = createChair(0, 0, -1.0, 0);

    // Holographic Pillar for 8 Asnaf breakdown
    const holoPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16),
      new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.65 })
    );
    holoPillar.position.set(2.0, 0.9, -1.2);

    const holoRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.04, 16, 32),
      accentGoldMat
    );
    holoRing.rotation.x = Math.PI / 2;
    holoRing.position.set(2.0, 1.2, -1.2);

    room2.add(desk2, chair2, holoPillar, holoRing);
    roomsGroup.add(room2);

    // --- ROOM 3: RUANG OTORISASI SEGREGASI 4-MATA (Floor 2, Left) ---
    const room3 = new THREE.Group();
    room3.position.set(-4.0, 4.0, 0);
    const desk3 = createDesk(0, 0, 0, Math.PI);
    const chair3 = createChair(0, 0, -1.0, 0);

    // Executive Biometric Console on Desk
    const bioTerminal = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.25), primaryEmeraldMat);
    bioTerminal.position.set(-0.7, 0.96, 0.2);

    // Green indicator light
    const bioLight = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), glowPathMat);
    bioLight.position.set(-0.7, 1.08, 0.2);

    // Wall Status Board
    const wallBoard3 = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 1.1),
      new THREE.MeshBasicMaterial({ color: 0x0f5c4d })
    );
    wallBoard3.position.set(0, 2.0, -2.8);

    room3.add(desk3, chair3, bioTerminal, bioLight, wallBoard3);
    roomsGroup.add(room3);

    // --- ROOM 4: RUANG SERAH TERIMA & SAKSI LAPANGAN (Floor 2, Right) ---
    const room4 = new THREE.Group();
    room4.position.set(4.0, 4.0, 0);
    const desk4 = createDesk(0, 0, 0, Math.PI);

    // Stacked Relief Aid Boxes (Paket Sembako & Zakat)
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
    const createBox = (bx: number, by: number, bz: number) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.65), boxMat);
      box.position.set(bx, by, bz);
      box.castShadow = true;
      return box;
    };
    room4.add(
      desk4,
      createBox(1.8, 0.25, -0.8),
      createBox(1.8, 0.75, -0.8),
      createBox(1.8, 0.25, -0.1),
      createBox(2.5, 0.25, -0.8)
    );
    roomsGroup.add(room4);

    // --- ROOM 5: RUANG SERVER RANTAI KRIPTOGRAFIS (Floor 3, Left) ---
    const room5 = new THREE.Group();
    room5.position.set(-4.0, 7.5, -2.0);

    // Modern High-Tech Server Racks (2 Units)
    const rackMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const serverRack1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 0.9), rackMat);
    serverRack1.position.set(-1.8, 1.3, -0.5);

    const serverRack2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 0.9), rackMat);
    serverRack2.position.set(1.8, 1.3, -0.5);

    // Glowing LED status strip on server rack
    const ledStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    ledStrip.position.set(-1.8, 1.8, -0.04);

    // Holographic Chain of Blocks (Floating SHA-256 blocks)
    const chainGroup = new THREE.Group();
    cryptoChainRef.current = chainGroup;
    chainGroup.position.set(0, 1.5, 0);

    for (let c = 0; c < 4; c++) {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.42, 0.42),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.8,
          wireframe: false,
        })
      );
      block.position.set((c - 1.5) * 0.7, Math.sin(c * 0.8) * 0.2, 0);
      chainGroup.add(block);
    }
    room5.add(serverRack1, serverRack2, ledStrip, chainGroup);
    roomsGroup.add(room5);

    // --- ROOM 6: RUANG OBSERVATORIUM PAPAN SILANG (Floor 3, Right) ---
    const room6 = new THREE.Group();
    room6.position.set(4.0, 7.5, -2.0);

    // Round Holographic Federation Table
    const roundTable = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.8, 0.3, 32),
      primaryEmeraldMat
    );
    roundTable.position.set(0, 0.85, 0);

    // Federation Hologram (Globe / Radar Nodes connecting Jakarta, Bandung, Surabaya)
    const holoFedGroup = new THREE.Group();
    federationHoloRef.current = holoFedGroup;
    holoFedGroup.position.set(0, 1.8, 0);

    const holoGlobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.7 })
    );
    holoFedGroup.add(holoGlobe);

    // 3 City Beacon Nodes
    const nodeColors = [0x10b981, 0x38bdf8, 0xf59e0b];
    const cityOffsets = [
      [-0.45, 0.2, 0.3], // Jakarta
      [0.35, -0.1, 0.4], // Bandung
      [0.1, 0.35, -0.4], // Surabaya
    ];
    cityOffsets.forEach((offset, idx) => {
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshBasicMaterial({ color: nodeColors[idx] })
      );
      node.position.set(...(offset as [number, number, number]));
      holoFedGroup.add(node);
    });

    room6.add(roundTable, holoFedGroup);
    roomsGroup.add(room6);

    // -----------------------------------------------------------
    // 4. ANIMATED 3D STYLIZED CHARACTER (AMIL ZAKY)
    // -----------------------------------------------------------
    const charRoot = new THREE.Group();
    charRoot.position.copy(WAYPOINTS[0].charPos);
    worldGroup.add(charRoot);

    // Torso (White shirt + Green Zaky Vest)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.95;
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.35), primaryEmeraldMat);
    const shirtCollar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.36), whiteStoneMat);
    shirtCollar.position.y = 0.32;
    torsoGroup.add(bodyMesh, shirtCollar);

    // Head + Peci Hitam
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.62;
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.6 });
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinMat);
    const peciMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const peciMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.22, 16), peciMat);
    peciMesh.position.y = 0.18;
    headGroup.add(headMesh, peciMesh);
    torsoGroup.add(headGroup);

    // Arms
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.35, 0.25, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), primaryEmeraldMat);
    leftArmMesh.position.y = -0.25;
    leftArm.add(leftArmMesh);
    torsoGroup.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.35, 0.25, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), primaryEmeraldMat);
    rightArmMesh.position.y = -0.25;
    rightArm.add(rightArmMesh);
    torsoGroup.add(rightArm);

    charRoot.add(torsoGroup);

    // Legs
    const trouserMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.16, 0.65, 0);
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, 0.18), trouserMat);
    leftLegMesh.position.y = -0.32;
    leftLeg.add(leftLegMesh);
    charRoot.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.16, 0.65, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, 0.18), trouserMat);
    rightLegMesh.position.y = -0.32;
    rightLeg.add(rightLegMesh);
    charRoot.add(rightLeg);

    characterRigRef.current = {
      group: charRoot,
      torsoGroup,
      headGroup,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      targetPos: WAYPOINTS[0].charPos.clone(),
      isMoving: false,
    };

    // -----------------------------------------------------------
    // 5. ANIMATION & RENDER LOOP
    // -----------------------------------------------------------
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Slow floating rotation of the cryptographic chain
      if (cryptoChainRef.current) {
        cryptoChainRef.current.rotation.y = elapsedTime * 0.6;
        cryptoChainRef.current.position.y = 1.5 + Math.sin(elapsedTime * 2) * 0.12;
      }

      // Slow rotation of the federation hologram globe
      if (federationHoloRef.current) {
        federationHoloRef.current.rotation.y = elapsedTime * 0.4;
      }

      // Smooth camera interpolation towards current waypoint
      const currentWaypoint = WAYPOINTS[activeStep] || WAYPOINTS[0];
      if (cameraRef.current) {
        cameraRef.current.position.lerp(currentWaypoint.camPos, 0.05);

        // Calculate lookAt interpolation
        const currentTarget = new THREE.Vector3();
        cameraRef.current.getWorldDirection(currentTarget);
        // Instead of directly setting, smoothly lerp lookAt by updating orientation:
        cameraRef.current.lookAt(currentWaypoint.camLookAt);
      }

      // Smooth character movement & walk cycle
      if (characterRigRef.current) {
        const rig = characterRigRef.current;
        const dist = rig.group.position.distanceTo(rig.targetPos);

        if (dist > 0.08) {
          rig.isMoving = true;
          // Step towards target
          const dir = new THREE.Vector3().subVectors(rig.targetPos, rig.group.position).normalize();
          rig.group.position.addScaledVector(dir, Math.min(dist, delta * 3.5));

          // Rotate character to face movement direction
          const targetAngle = Math.atan2(dir.x, dir.z);
          rig.group.rotation.y = THREE.MathUtils.lerp(rig.group.rotation.y, targetAngle, 0.15);

          // Walk cycle animation (swing arms & legs)
          const walkSpeed = 9.0;
          const swing = Math.sin(elapsedTime * walkSpeed);
          rig.leftLeg.rotation.x = swing * 0.45;
          rig.rightLeg.rotation.x = -swing * 0.45;
          rig.leftArm.rotation.x = -swing * 0.45;
          rig.rightArm.rotation.x = swing * 0.45;
          rig.torsoGroup.position.y = 0.95 + Math.abs(Math.sin(elapsedTime * walkSpeed * 2)) * 0.04;
        } else {
          // Standing idle
          rig.isMoving = false;
          rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0, 0.2);
          rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0, 0.2);
          rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, 0, 0.2);
          rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, 0, 0.2);
          rig.torsoGroup.position.y = 0.95 + Math.sin(elapsedTime * 1.5) * 0.015;
          rig.group.rotation.y = THREE.MathUtils.lerp(rig.group.rotation.y, currentWaypoint.charRotY, 0.1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    // Resize Handler
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
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  // Sync active step changes with character target
  useEffect(() => {
    if (characterRigRef.current && WAYPOINTS[activeStep]) {
      characterRigRef.current.targetPos.copy(WAYPOINTS[activeStep].charPos);
    }
  }, [activeStep]);

  // GSAP ScrollTrigger to sync scroll progress with 3D step transitions
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const sections = containerRef.current.querySelectorAll('.journey-scroll-checkpoint');
    if (sections.length === 0) return;

    sections.forEach((section, idx) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setActiveStep(idx),
        onEnterBack: () => setActiveStep(idx),
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  const currentStepData = JOURNEY_STEPS[activeStep] || JOURNEY_STEPS[0];

  return (
    <section ref={containerRef} className="relative w-full bg-[#F4F7F5] selection:bg-primary-100 selection:text-primary-900">
      {/* 
        STICKY 3D CANVAS VIEWPORT (Right/Center on Desktop, Full background on Mobile)
      */}
      <div className="sticky top-0 h-screen w-full overflow-hidden pointer-events-none z-0">
        <div
          ref={canvasContainerRef}
          className="w-full h-full pointer-events-auto"
          style={{ touchAction: 'none' }}
        />

        {/* Ambient Top & Bottom Vignette / Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/90 via-[#F4F7F5]/40 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#F4F7F5] via-[#F4F7F5]/70 to-transparent pointer-events-none" />

        {/* Top-Right Badge: Active Room Indicator */}
        <div className="absolute top-24 right-4 sm:right-8 z-10 hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/85 backdrop-blur-md border border-neutral-200/90 shadow-sm pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-pulse" />
          <div className="text-left">
            <span className="block text-[10px] font-mono font-bold tracking-wider uppercase text-neutral-400">
              Kamera Aktif
            </span>
            <span className="block text-xs font-bold text-neutral-800">
              {currentStepData.roomName}
            </span>
          </div>
        </div>
      </div>

      {/* 
        SCROLLABLE CONTENT LAYER OVERLAY (Left Cards & Hero Header)
      */}
      <div className="relative z-10 -mt-[100vh] pointer-events-none">
        {/* CHECKPOINT 0: HERO SECTION OVERVIEW */}
        <div className="journey-scroll-checkpoint min-h-screen flex items-center px-4 sm:px-6 lg:px-12 py-20">
          <div className="max-w-xl text-left space-y-6 pointer-events-auto bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-neutral-200/90 shadow-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-bold border border-primary-200">
              <Building2 className="w-3.5 h-3.5" />
              <span>{JOURNEY_STEPS[0].badge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.15]">
              Setiap Lembaga Mencatat Sendiri,{' '}
              <span className="text-primary-700 block">Catatannya Saling Diperiksa.</span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              Infrastruktur amanah zakat nasional berlandaskan segregasi 4-unit kewenangan,
              konfirmasi langsung penerima (mustahik), dan konsensus saksi silang kriptografis antarlembaga.
            </p>

            {/* Quick Search Verification Bar */}
            <form onSubmit={handleQuickSearch} className="space-y-2">
              <div className="flex items-center gap-2 p-1.5 bg-neutral-50 rounded-2xl border border-neutral-200 focus-within:border-primary-700 transition-all">
                <Search className="w-4 h-4 text-neutral-400 ml-2.5 flex-shrink-0" />
                <input
                  type="text"
                  value={searchKode}
                  onChange={(e) => {
                    setSearchKode(e.target.value.toUpperCase());
                    setQuickError('');
                  }}
                  placeholder="Cek kode publik (mis. ZK4B8V2KNT9X)"
                  maxLength={14}
                  className="w-full bg-transparent text-xs sm:text-sm font-mono font-bold uppercase text-neutral-900 placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-neutral-400 focus:outline-none px-2 py-1.5"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-700 hover:bg-primary-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-all whitespace-nowrap cursor-pointer"
                >
                  Verifikasi
                </button>
              </div>
              {quickError && <p className="text-xs text-red-600 font-medium pl-2">{quickError}</p>}
            </form>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenAkadModal) onOpenAkadModal();
                  else goToStep(1);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-neutral-950 text-xs font-bold shadow-sm transition-all hover:scale-105 cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>Salurkan / Hitung Zakat</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Jelajahi Alur 3D</span>
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
          </div>
        </div>

        {/* CHECKPOINTS 1 TO 6: THE 6 STAGES OF ZAKY'S GOVERNANCE */}
        {JOURNEY_STEPS.slice(1).map((step) => (
          <div
            key={step.id}
            className="journey-scroll-checkpoint min-h-screen flex items-center px-4 sm:px-6 lg:px-12 py-20"
          >
            <div className="max-w-lg text-left space-y-5 pointer-events-auto bg-white/92 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-neutral-200/90 shadow-xl transition-all">
              {/* Header Badge & Unit Info */}
              <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                <span className="text-[11px] font-bold font-mono tracking-wider text-primary-700 uppercase bg-primary-100/70 px-2.5 py-1 rounded-lg">
                  {step.badge}
                </span>
                <span className="text-[11px] font-medium text-neutral-500 truncate max-w-[180px]">
                  {step.unit}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight leading-snug">
                  {step.title}
                </h2>
                <p className="text-xs font-semibold text-primary-700">
                  {step.subtitle}
                </p>
                <p className="text-xs text-neutral-600 leading-relaxed pt-1">
                  {step.description}
                </p>
              </div>

              {/* Live Interactive Metrics / Details Card */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-800 border-b border-neutral-200/60 pb-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                    <span>{step.metricLabel}</span>
                  </span>
                  <span className="font-mono text-primary-700 bg-white px-2 py-0.5 rounded-md border border-neutral-200 shadow-2xs">
                    {step.metricValue}
                  </span>
                </div>

                <div className="space-y-1 pt-0.5">
                  {step.details.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-center justify-between text-[11px] text-neutral-600">
                      <span>{detail.label}</span>
                      <span className="font-mono font-medium text-neutral-800">
                        {detail.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actor / Responsibility Banner */}
              <div className="flex items-center gap-2.5 text-[11px] text-neutral-500 bg-neutral-100/80 px-3 py-2 rounded-xl">
                <Users className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                <span>Pelaksana: <strong className="text-neutral-800">{step.actor}</strong></span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <Link
                  href={step.actionHref}
                  className="inline-flex items-center justify-center gap-2 flex-1 py-2 px-4 rounded-xl bg-primary-700 hover:bg-primary-600 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>{step.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {step.id < 6 && (
                  <button
                    type="button"
                    onClick={() => goToStep(step.id + 1)}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 transition-colors"
                    title="Lanjut ke langkah berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 
        BOTTOM PERSISTENT JOURNEY STEPPER (Exact match to the video's bottom navigation)
      */}
      <div className="fixed bottom-4 sm:bottom-6 inset-x-0 z-40 max-w-4xl mx-auto px-4 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-lg border border-neutral-200/90 shadow-xl rounded-2xl p-2 sm:p-2.5">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {JOURNEY_STEPS.map((step) => {
              const isActive = activeStep === step.id;
              const isPassed = activeStep > step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id)}
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
                      {step.id}
                    </span>
                    <span className="text-[11px] sm:text-xs truncate hidden md:inline">
                      {step.slug === 'overview'
                        ? 'Gedung Zaky'
                        : step.title.split(' ')[1] || step.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
