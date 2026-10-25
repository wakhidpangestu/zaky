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

// 7 Stasiun: Fasad 1 Bangunan Utuh (0) + 6 Ruangan Lembaga Berjajar Horizontal (1 s/d 6)
export const STATIONS: JourneyStation[] = [
  {
    id: 0,
    slug: 'overview',
    badge: 'MARKAZ PUSAT ZAKY',
    title: 'Gedung Markaz Zakat Nasional Zaky',
    subtitle: 'Arsitektur Fisik & Digital Berkelanjutan Berbasis Syariah',
    description:
      'Gedung markaz pusat terpadu. Scroll ke bawah untuk masuk melewati gerbang utama dan menjelajahi setiap ruangan lembaga di dalamnya.',
    unit: 'Gedung Utama',
    actor: 'Markaz Nasional',
    roomName: 'Fasad Utama & Gerbang Masuk',
    xPosition: 0,
    metricLabel: 'Lembaga Terhubung',
    metricValue: '3 Kota Federasi',
    actionText: 'Masuk ke Dalam Gedung',
    actionHref: '#step-1',
    details: [
      { label: 'Gaya Arsitektur', value: 'Islamic Modern (4 Lantai)' },
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
    xPosition: 88,
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
    title: 'Ruang Data Center Rantai Kriptografis',
    subtitle: 'Log Transaksi Append-Only & SHA-256 Kekal',
    description:
      'Setiap mutasi dicatat dalam tabel append-only yang tak bisa diubah maupun dihapus. Data dinormalisasi dengan kanonikalisasi RFC 8785 JCS dan dirantai secara kriptografis.',
    unit: 'Biro Teknologi & Kriptografi',
    actor: 'Sistem Rantai Otomatis',
    roomName: 'Ruang Server Kriptografi',
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
  const [searchKode, setSearchKode] = useState<string>('');
  const [quickError, setQuickError] = useState<string>('');

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const facadeDoorsRef = useRef<THREE.Group | null>(null);
  const facadeWallRef = useRef<THREE.Group | null>(null);
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
  const targetCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 11, 25));
  const targetCameraLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 3, 0));
  const targetCharPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.25, 9.5));

  // Handle jump directly to a step
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
    scene.fog = new THREE.FogExp2(0xf2f7f4, 0.010);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 11, 25);
    camera.lookAt(0, 3, 0);

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

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe8f5f1, 0xdde7e3, 0.55);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffcf5, 1.45);
    sunLight.position.set(35, 50, 30);
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

    // Dynamic accent spot/point lights for each interior room
    const accentColors = [0xc8962e, 0x0f5c4d, 0x10b981, 0x38bdf8, 0x10b981, 0x38bdf8];
    [22, 44, 66, 88, 110, 132].forEach((xPos, idx) => {
      const pLight = new THREE.PointLight(accentColors[idx], 1.7, 22);
      pLight.position.set(xPos, 5.5, 2.0);
      scene.add(pLight);
    });

    // -----------------------------------------------------------
    // MATERIALS (ZAKY ISLAMIC MODERN HIGH-DETAIL)
    // -----------------------------------------------------------
    const whiteStoneMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.25,
      metalness: 0.05,
    });
    const darkEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x0a3d33,
      roughness: 0.35,
      metalness: 0.2,
    });
    const brandEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x0f5c4d,
      roughness: 0.28,
      metalness: 0.35,
    });
    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xc8962e,
      roughness: 0.18,
      metalness: 0.9,
    });
    const glassCyanMat = new THREE.MeshStandardMaterial({
      color: 0x99f6e4,
      roughness: 0.08,
      metalness: 0.9,
      transparent: true,
      opacity: 0.55,
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
    // Base Plinth
    const longPlaza = new THREE.Mesh(
      new THREE.BoxGeometry(190, 0.8, 32),
      new THREE.MeshStandardMaterial({ color: 0xedf3f0, roughness: 0.7 })
    );
    longPlaza.position.set(65, -0.4, 0);
    longPlaza.receiveShadow = true;
    worldGroup.add(longPlaza);

    // Polished Terrazzo Interior Floor
    const longFloor = new THREE.Mesh(
      new THREE.BoxGeometry(184, 0.25, 18),
      whiteStoneMat
    );
    longFloor.position.set(65, 0.12, 0);
    longFloor.receiveShadow = true;
    worldGroup.add(longFloor);

    // Continuous Glowing Journey Path along the corridor
    const continuousPath = new THREE.Mesh(
      new THREE.BoxGeometry(165, 0.05, 0.5),
      glowPathMat
    );
    continuousPath.position.set(66, 0.26, 2.8);
    worldGroup.add(continuousPath);

    // Continuous Back Wall with Mashrabiya Crest
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(184, 9.5, 0.6),
      whiteStoneMat
    );
    backWall.position.set(65, 4.85, -8.5);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    worldGroup.add(backWall);

    const backAccentBand = new THREE.Mesh(
      new THREE.BoxGeometry(184, 0.6, 0.7),
      brandEmeraldMat
    );
    backAccentBand.position.set(65, 8.8, -8.48);
    worldGroup.add(backAccentBand);

    // Islamic Archway Portals between rooms with fluted columns & gold capitals
    const createArchwayPortal = (xPos: number) => {
      const portal = new THREE.Group();
      portal.position.set(xPos, 0, 0);

      const colL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 8.5, 16), whiteStoneMat);
      colL.position.set(0, 4.35, 0);
      colL.castShadow = true;
      colL.receiveShadow = true;

      const capGold = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 16.2), goldAccentMat);
      capGold.position.set(0, 8.0, 0);

      const archTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 7.0), brandEmeraldMat);
      archTop.position.set(0, 8.3, 0);

      portal.add(colL, capGold, archTop);
      return portal;
    };

    [11, 33, 55, 77, 99, 121, 143].forEach((xPos) => {
      worldGroup.add(createArchwayPortal(xPos));
    });

    // -----------------------------------------------------------
    // STATION 0: FULL MONOLITHIC BUILDING (1 BANGUNAN UTUH)
    // -----------------------------------------------------------
    const buildingFullGroup = new THREE.Group();
    buildingFullGroup.position.set(0, 0, 0);
    facadeWallRef.current = buildingFullGroup;

    // Grand Entrance Podium Steps (3 stepped terraces leading up)
    for (let s = 0; s < 4; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(18 - s * 1.0, 0.15, 6 - s * 0.8),
        whiteStoneMat
      );
      step.position.set(0, s * 0.15, 8.5 - s * 0.6);
      step.receiveShadow = true;
      buildingFullGroup.add(step);
    }

    // Main Facade Front Wall (Solid architectural presence)
    const frontFacadeWall = new THREE.Mesh(
      new THREE.BoxGeometry(18, 12.5, 1.4),
      whiteStoneMat
    );
    frontFacadeWall.position.set(0, 6.25, 5.5);
    frontFacadeWall.castShadow = true;
    buildingFullGroup.add(frontFacadeWall);

    // Grand Triple Islamic Arched Entrance (Portico)
    const entranceDoorsGroup = new THREE.Group();
    facadeDoorsRef.current = entranceDoorsGroup;
    entranceDoorsGroup.position.set(0, 0, 6.2);

    // Central Grand Archway
    const mainArchTrim = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.0, 0.4), brandEmeraldMat);
    mainArchTrim.position.set(0, 2.5, 0);
    const mainDoorGlass = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.4, 0.1), glassCyanMat);
    mainDoorGlass.position.set(0, 2.3, 0.05);

    // Left and Right Flanking Arches
    const leftArch = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.8, 0.3), brandEmeraldMat);
    leftArch.position.set(-4.5, 2.0, 0);
    const rightArch = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.8, 0.3), brandEmeraldMat);
    rightArch.position.set(4.5, 2.0, 0);

    entranceDoorsGroup.add(mainArchTrim, mainDoorGlass, leftArch, rightArch);
    buildingFullGroup.add(entranceDoorsGroup);

    // Upper Setback Tower & Glass Curtain Wall
    const upperTower = new THREE.Mesh(
      new THREE.BoxGeometry(14, 6.0, 10),
      new THREE.MeshStandardMaterial({ color: 0x0f5c4d, roughness: 0.2, metalness: 0.6 })
    );
    upperTower.position.set(0, 14.5, 2);
    upperTower.castShadow = true;
    buildingFullGroup.add(upperTower);

    // Glass Window Grid on Tower
    const glassGrid = new THREE.Mesh(new THREE.PlaneGeometry(13.5, 5.2), glassCyanMat);
    glassGrid.position.set(0, 14.5, 7.02);
    buildingFullGroup.add(glassGrid);

    // Islamic Modern Central Dome (Kubah Emas & Hijau Zamrud)
    const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.5, 0.8, 16), whiteStoneMat);
    domeBase.position.set(0, 17.8, 2);
    const domeHalfSphere = new THREE.Mesh(
      new THREE.SphereGeometry(3.0, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      brandEmeraldMat
    );
    domeHalfSphere.position.set(0, 18.2, 2);
    domeHalfSphere.castShadow = true;

    const domeFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.8, 8), goldAccentMat);
    domeFinial.position.set(0, 21.8, 2);
    buildingFullGroup.add(domeBase, domeHalfSphere, domeFinial);

    // Modern Minaret Tower on Left Corner
    const minaretBase = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 12, 8), whiteStoneMat);
    minaretBase.position.set(-8.5, 9.0, 5.5);
    minaretBase.castShadow = true;

    const minaretBalcony = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.6, 0.6, 8), brandEmeraldMat);
    minaretBalcony.position.set(-8.5, 15.3, 5.5);

    const minaretSpire = new THREE.Mesh(new THREE.ConeGeometry(1.4, 4.2, 8), brandEmeraldMat);
    minaretSpire.position.set(-8.5, 17.6, 5.5);
    minaretSpire.castShadow = true;

    const crescent = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.08, 16, 32, Math.PI * 1.5),
      goldAccentMat
    );
    crescent.position.set(-8.5, 20.2, 5.5);
    crescent.rotation.z = Math.PI * 0.25;

    buildingFullGroup.add(minaretBase, minaretBalcony, minaretSpire, crescent);

    // Bold 3D "Z A K Y" Name Sign in Pure Gold on Parapet
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 12.0, 6.3);
    const letters = ['Z', 'A', 'K', 'Y'];
    const letterSpacing = 1.6;
    letters.forEach((char, idx) => {
      const lMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.25), goldAccentMat);
      lMesh.position.x = (idx - 1.5) * letterSpacing;
      signGroup.add(lMesh);
    });
    buildingFullGroup.add(signGroup);

    // Plaza Forecourt: Octagonal Islamic Fountain with Water Spray
    const fountainBasin = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.6, 8), brandEmeraldMat);
    fountainBasin.position.set(0, 0.3, 11.5);
    fountainBasin.castShadow = true;

    const fountainWater = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.62, 8), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9 }));
    fountainWater.position.set(0, 0.31, 11.5);

    const fountainNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.4, 8), goldAccentMat);
    fountainNozzle.position.set(0, 0.9, 11.5);

    buildingFullGroup.add(fountainBasin, fountainWater, fountainNozzle);

    // 6 Palm Trees surrounding the forecourt
    [-10, -7, -4, 4, 7, 10].forEach((tx, idx) => {
      const pTree = new THREE.Group();
      pTree.position.set(tx, 0, 12.5 + (idx % 2) * 1.5);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.6, 8), warmWoodMat);
      trunk.position.y = 1.8;
      trunk.castShadow = true;
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.4, 7), new THREE.MeshStandardMaterial({ color: 0x137a66, roughness: 0.8 }));
      canopy.position.y = 4.2;
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

    // Persian/Islamic Rug Inlay on Floor
    const rug1 = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 0.02, 4.5),
      new THREE.MeshStandardMaterial({ color: 0x0f5c4d, roughness: 0.9 })
    );
    rug1.position.set(-1.0, 0.13, 0.5);
    room1.add(rug1);

    // Curved Marble Reception Desk with Gold Baseboard
    const counterDesk = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.1, 1.4), whiteStoneMat);
    counterDesk.position.set(0, 0.55, -2.2);
    counterDesk.castShadow = true;
    const counterTrim = new THREE.Mesh(new THREE.BoxGeometry(5.45, 0.1, 1.45), goldAccentMat);
    counterTrim.position.set(0, 1.08, -2.2);

    // Dual Touchscreen Terminals on counter
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
    const mBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), whiteStoneMat);
    mBody.position.y = 1.0;
    const mHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinToneMat);
    mHead.position.y = 1.5;
    muzakkiChar.add(mBody, mHead);
    room1.add(muzakkiChar);

    // Lounge Area: L-shaped Emerald Velvet Sofa with gold cushions
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

    // 2 Analyst Workstations with dual screens
    const desk2A = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1.4), warmWoodMat);
    desk2A.position.set(-3.0, 0.85, -2.8);
    const desk2B = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1.4), warmWoodMat);
    desk2B.position.set(3.0, 0.85, -2.8);

    // Central Holographic 8-Asnaf Pedestal (Floating Octagonal Prism & Rings)
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

    // Wall Demographic Screen
    const wallScreen2 = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.0), screenGlowMat);
    wallScreen2.position.set(0, 4.0, -8.1);

    room2.add(desk2A, desk2B, holoPedestal, holoPrism, holoRing, wallScreen2);
    worldGroup.add(room2);

    // -----------------------------------------------------------
    // ROOM 3 (X = 66): RUANG OTORISASI 4-MATA (HIGH DETAIL)
    // -----------------------------------------------------------
    const room3 = new THREE.Group();
    room3.position.set(66, 0, 0);

    // Executive Director's Desk in Dark Walnut & Emerald Leather
    const execDesk = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.85, 2.2), darkEmeraldMat);
    execDesk.position.set(0, 0.45, -2.5);
    execDesk.castShadow = true;
    const execLeather = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.08, 2.25), brandEmeraldMat);
    execLeather.position.set(0, 0.9, -2.5);

    // Seated Penyetuju Hari
    const execChair = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.8), darkEmeraldMat);
    execChair.position.set(0, 1.1, -4.2);

    const hariChar = new THREE.Group();
    hariChar.position.set(0, 0.6, -3.8);
    const hBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.38), darkSuitMat);
    hBody.position.y = 0.55;
    const hHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinToneMat);
    hHead.position.y = 1.05;
    hariChar.add(hBody, hHead);

    // Biometric scanner console with glowing emerald ring
    const bioStand = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.55), goldAccentMat);
    bioStand.position.set(1.5, 0.98, -2.0);
    const bioRing = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 16, 32), glowPathMat);
    bioRing.rotation.x = Math.PI / 2;
    bioRing.position.set(1.5, 1.18, -2.0);

    // Wall Matrix Display
    const wallMatrix = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.2), new THREE.MeshBasicMaterial({ color: 0x0a3d33 }));
    wallMatrix.position.set(0, 4.0, -8.1);

    room3.add(execDesk, execLeather, execChair, hariChar, bioStand, bioRing, wallMatrix);
    worldGroup.add(room3);

    // -----------------------------------------------------------
    // ROOM 4 (X = 88): RUANG SERAH TERIMA & SAKSI (HIGH DETAIL)
    // -----------------------------------------------------------
    const room4 = new THREE.Group();
    room4.position.set(88, 0, 0);

    // Logistics Handover Counter
    const handCounter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.0, 1.4), whiteStoneMat);
    handCounter.position.set(0, 0.5, -1.8);
    handCounter.castShadow = true;

    // Multi-tier metal warehouse shelving with stacked Zaky aid boxes
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

    // Saksi Dewi holding geotag verification phone
    const dewiChar = new THREE.Group();
    dewiChar.position.set(-1.0, 0, -0.4);
    const dBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), brandEmeraldMat);
    dBody.position.y = 0.95;
    const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), skinToneMat);
    dHead.position.y = 1.45;
    const dPhone = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.04), screenGlowMat);
    dPhone.position.set(0.3, 1.15, 0.25);
    dewiChar.add(dBody, dHead, dPhone);

    // Mustahik recipient character
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

    // 4 High-Density Server Racks with pulsating LEDs
    const serverMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.9 });
    [-4.5, -2.4, 2.4, 4.5].forEach((rx) => {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.7, 4.8, 1.5), serverMat);
      rack.position.set(rx, 2.4, -5.0);
      rack.castShadow = true;
      const led = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.12), glowPathMat);
      led.position.set(rx, 3.5, -4.23);
      room5.add(rack, led);
    });

    // Central Floating 3D SHA-256 Blockchain Ledger
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

    // Wall Cryptographic Stream Terminal
    const wallScreen5 = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.4), new THREE.MeshBasicMaterial({ color: 0x064e3b }));
    wallScreen5.position.set(0, 4.0, -8.1);
    room5.add(wallScreen5);

    worldGroup.add(room5);

    // -----------------------------------------------------------
    // ROOM 6 (X = 132): RUANG OBSERVATORIUM PAPAN SILANG
    // -----------------------------------------------------------
    const room6 = new THREE.Group();
    room6.position.set(132, 0, 0);

    // Circular Council Table
    const fedTable = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.7, 32), brandEmeraldMat);
    fedTable.position.set(0, 0.65, 0);

    // 3D Holographic Federation Globe
    const globeGroup = new THREE.Group();
    federationGlobeRef.current = globeGroup;
    globeGroup.position.set(0, 2.6, 0);

    const wireGlobe = new THREE.Mesh(
      new THREE.SphereGeometry(1.3, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.75 })
    );
    globeGroup.add(wireGlobe);

    // 3 City Beacon Nodes: Jakarta, Bandung, Surabaya
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

    // 3 Institutional Standards / Banners behind table
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
    charRoot.position.set(0, 0.25, 9.5);
    worldGroup.add(charRoot);
    characterGroupRef.current = charRoot;

    // Torso (White shirt + Green Zaky Vest)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.95;
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.38), brandEmeraldMat);
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.4), whiteStoneMat);
    collar.position.y = 0.35;
    torsoGroup.add(bodyMesh, collar);

    // Head + Peci Hitam
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.65;
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinToneMat);
    const peciMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.22, 16), darkEmeraldMat);
    peciMesh.position.y = 0.18;
    headGroup.add(headMesh, peciMesh);
    torsoGroup.add(headGroup);

    // Arms
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

    // Legs
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
    // RENDER & SMOOTH ANIMATION LOOP (Adaptive character catch-up)
    // -----------------------------------------------------------
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Rotate crypto cubes in room 5
      if (cryptoCubesRef.current) {
        cryptoCubesRef.current.rotation.y = time * 0.7;
        cryptoCubesRef.current.position.y = 2.5 + Math.sin(time * 2) * 0.15;
      }

      // Rotate federation globe in room 6
      if (federationGlobeRef.current) {
        federationGlobeRef.current.rotation.y = time * 0.5;
      }

      // Camera smooth 3D interpolation
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCameraPos.current, 0.08);

        // Calculate smooth lookAt target
        const currentTarget = new THREE.Vector3();
        cameraRef.current.getWorldDirection(currentTarget);
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

          // Face movement angle
          const moveAngle = Math.atan2(dirX, dirZ);
          char.rotation.y = THREE.MathUtils.lerp(char.rotation.y, moveAngle, 0.2);

          // Walk cycle animation frequency scales with speed
          const walkFreq = Math.min(20.0, 9.0 + distance * 2.5);
          const swing = Math.sin(time * walkFreq);
          parts.leftLeg.rotation.x = swing * 0.55;
          parts.rightLeg.rotation.x = -swing * 0.55;
          parts.leftArm.rotation.x = -swing * 0.55;
          parts.rightArm.rotation.x = swing * 0.55;
          parts.torso.position.y = 0.95 + Math.abs(Math.sin(time * walkFreq * 2)) * 0.06;
        } else {
          // Idle posture
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
  // GSAP SCROLLTRIGGER: PINNED HORIZONTAL JOURNEY WITH SMOOTH BUFFER
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

          // 1. Station index calculation
          const stepFloat = progress * 6;
          const currentIdx = Math.min(6, Math.floor(stepFloat + 0.25));
          setActiveStep(currentIdx);

          // 2. Cinematic Exterior to Interior transition
          if (progress < 0.14) {
            // Station 0: Full exterior building view
            const t0 = progress / 0.14; // 0 to 1
            // Camera moves from high exterior angle down into the grand entrance
            targetCameraPos.current.set(
              THREE.MathUtils.lerp(0, 8, t0),
              THREE.MathUtils.lerp(11, 6.5, t0),
              THREE.MathUtils.lerp(25, 17, t0)
            );
            targetCameraLookAt.current.set(
              THREE.MathUtils.lerp(0, 8, t0),
              THREE.MathUtils.lerp(3, 2.5, t0),
              0
            );

            // Character walks up the stairs into the entrance portal
            targetCharPos.current.set(
              0,
              0.25,
              THREE.MathUtils.lerp(10.5, 4.0, t0)
            );

            // Facade doors open smoothly
            if (facadeDoorsRef.current) {
              facadeDoorsRef.current.position.y = THREE.MathUtils.lerp(0, 3.5, t0);
            }
          } else {
            // Station 1 to 6: Horizontal tour through rooms
            const tInterior = (progress - 0.14) / (1 - 0.14); // 0 to 1
            const interiorX = 22 + tInterior * (132 - 22);

            targetCameraPos.current.set(interiorX, 6.8, 16.5);
            targetCameraLookAt.current.set(interiorX, 2.2, 0);

            // Character follows the glowing path at Z = 2.8
            targetCharPos.current.set(interiorX, 0.25, 2.8);

            if (facadeDoorsRef.current) {
              facadeDoorsRef.current.position.y = 3.5;
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
        <div className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-pulse" />
        <div className="text-left">
          <span className="block text-[10px] font-mono font-bold tracking-wider uppercase text-neutral-400">
            Kamera & Karakter Aktif
          </span>
          <span className="block text-xs font-bold text-neutral-800">
            {currentStation.roomName} (X: {Math.round(currentStation.xPosition)}m)
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
            <form onSubmit={handleQuickSearch} className="space-y-2 pt-1">
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
                        ? 'Gedung Zaky'
                        : station.title.split(' ')[1] || station.title}
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
