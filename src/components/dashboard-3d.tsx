'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import {
  X,
  Maximize2,
  Minimize2,
  Activity,
  Shield,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  Zap,
  LayoutDashboard,
  ShieldCheck,
  Lock,
  ArrowDownLeft,
  ExternalLink,
  Gamepad2,
  Compass,
  Crosshair,
  Award,
  Check,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Coins,
  FileText,
  RotateCcw,
  Play,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Footprints,
  HelpCircle,
  CheckCheck,
  TrendingUp,
} from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import {
  getSavedPosDana,
  getSavedPenyaluran,
  INITIAL_POS_DANA,
  PosDanaData,
  PenyaluranItem,
} from '@/lib/store';
import { useStoreSync } from '@/lib/use-store-sync';
import ZakyLogo from '@/components/zaky-logo';

interface StationInfo {
  id: string;
  title: string;
  actor: string;
  role: string;
  unit: string;
  currentTask: string;
  recentActivity: string;
  stats: string;
  statusColor: string;
  speechText: string;
}

const STATIONS: Record<string, StationInfo> = {
  pelayanan: {
    id: 'pelayanan',
    title: 'Meja Unit Pelayanan (Amil Budi)',
    actor: 'Amil Budi',
    role: 'Amil Operasional • Peci Hitam, Rompi Hijau & Kartu ID',
    unit: 'Unit Pelayanan',
    currentTask: 'Memproses Reservasi Draf Penyaluran Mustahik Asnaf Fakir',
    recentActivity: 'Mereservasi Rp 800.000 untuk Mustahik S*** (Kab. Sleman)',
    stats: '24 Transaksi dicatat • 0 Saldo negatif • FR-03 Terpenuhi',
    statusColor: 'emerald',
    speechText: 'Draf penyaluran siap diajukan ke Mustahik via SMS OTP!',
  },
  keuangan_hari: {
    id: 'keuangan_hari',
    title: 'Meja Unit Keuangan (Penyetuju Hari)',
    actor: 'Penyetuju Hari',
    role: 'Penyetuju Eksekutif • Jas Formal & Kacamata Tanduk',
    unit: 'Unit Keuangan',
    currentTask: 'Meninjau keabsahan berkas rekomendasi & tanda tangan multi-pihak',
    recentActivity: 'Menyetujui penyaluran Rp 1.200.000 (ZK4B8V2KNT9X)',
    stats: '18 Persetujuan diproses • 0 Pelanggaran unit pembuat',
    statusColor: 'blue',
    speechText: 'Alhamdulillah, berkas lengkap & disetujui secara syariah!',
  },
  keuangan_dewi: {
    id: 'keuangan_dewi',
    title: 'Meja Unit Keuangan (Saksi Dewi)',
    actor: 'Saksi Dewi',
    role: 'Saksi Independen 1 • Hijab Syar’i & Gamis Sage',
    unit: 'Unit Keuangan',
    currentTask: 'Validasi saksi pertama dokumentasi penyaluran mustahik',
    recentActivity: 'Menandatangani berita acara saksi 1 Bantul',
    stats: '15 Saksi diverifikasi • Bebas benturan kepentingan',
    statusColor: 'emerald',
    speechText: 'Tanda tangan saksi 1 terkonfirmasi sah pada ledger!',
  },
  kepegawaian: {
    id: 'kepegawaian',
    title: 'Meja Unit Kepegawaian (Saksi Rian)',
    actor: 'Saksi Rian',
    role: 'Saksi Independen 2 • Kemeja Batik Parang & Kacamata Kawat',
    unit: 'Unit Kepegawaian',
    currentTask: 'Verifikasi kesaksian amil lintas unit (Metode 4 Akun Independen)',
    recentActivity: 'Menandatangani berita acara saksi 2 penyaluran Bantul',
    stats: '12 Kesaksian selesai diverifikasi secara independen',
    statusColor: 'amber',
    speechText: 'Unit saksi berbeda dengan pembuat & penyetuju, sah!',
  },
  networkHub: {
    id: 'networkHub',
    title: 'Pusat Interkoneksi Jaringan (Papan Silang Hub)',
    actor: 'Protokol Konsensus Ed25519',
    role: 'Saksi Antarlembaga Otomatis (BAZNAS, PKPU, Dompet Dhuafa)',
    unit: 'Jaringan P2P Lembaga',
    currentTask: 'Sinkronisasi hash blok harian & multi-signature konsensus',
    recentActivity: 'Kesaksian Lembaga B dan C tersimpan valid (Hash 9f2c...e41a)',
    stats: '3/3 Lembaga terhubung konsisten • Latensi rata-rata 14ms',
    statusColor: 'teal',
    speechText: 'Konsensus kriptografis terverifikasi oleh Lembaga B & C.',
  },
  bigBoard: {
    id: 'bigBoard',
    title: 'Layar Monitoring Saldo & Audit Zaky (Klik Aktif)',
    actor: 'Database Ledger Constraint Engine',
    role: 'Penegak Invariant FR-03 Realtime',
    unit: 'Server Basis Data',
    currentTask: 'Menegakkan: Total Masuk = Tersedia + Dicadangkan + Tersalurkan',
    recentActivity: 'Zakat Maal: Tersedia Rp 1.000.000, Dicadangkan Rp 800.000',
    stats: '100% Invariant Terpenuhi • 0 Kebocoran Saldo',
    statusColor: 'emerald',
    speechText: 'Invariant database terjaga: Rp 7.400.000 balance sempurna.',
  },
};

export interface ProximityStation {
  id: string;
  name: string;
  actor: string;
  taskTitle: string;
  taskDesc: string;
  pos: [number, number, number];
  radius: number;
}

export const INTERACTIVE_STATIONS: ProximityStation[] = [
  {
    id: 'pelayanan',
    name: 'Meja Pelayanan Zakat',
    actor: 'Amil Budi',
    taskTitle: 'Pencatatan Penerimaan Zakat Baru',
    taskDesc: 'Muzakki menyetorkan donasi zakat. Catat nominal dan akad donasi untuk disahkan ke sistem.',
    pos: [-8, 0, -4.0],
    radius: 3.5,
  },
  {
    id: 'keuangan_hari',
    name: 'Meja Penyetuju Hari',
    actor: 'Penyetuju Hari',
    taskTitle: 'Persetujuan & Pencadangan Penyaluran Asnaf',
    taskDesc: 'Periksa kelengkapan berkas mustahik fakir miskin dan cadangkan saldo sesuai aturan FR-03.',
    pos: [-2, 0, -4.0],
    radius: 3.5,
  },
  {
    id: 'keuangan_dewi',
    name: 'Meja Saksi Dewi',
    actor: 'Saksi Dewi',
    taskTitle: 'Validasi Kesaksian Kepatuhan Fiqih',
    taskDesc: 'Verifikasi independensi 3-pihak: pastikan unit pembuat draf terpisah dari penyetuju.',
    pos: [4, 0, -4.0],
    radius: 3.5,
  },
  {
    id: 'bigBoard',
    name: 'Layar Dasbor Audit Realtime',
    actor: 'Database Ledger Engine',
    taskTitle: 'Audit Invariant FR-03 Realtime',
    taskDesc: 'Verifikasi matematis: Total Masuk = Saldo Tersedia + Saldo Dicadangkan + Total Tersalurkan.',
    pos: [0, 0, -11.5],
    radius: 5.0,
  },
  {
    id: 'networkHub',
    name: 'Hub Jaringan Konsensus P2P',
    actor: 'Federasi Antarlembaga',
    taskTitle: 'Konsensus Kriptografis Multi-Pihak',
    taskDesc: 'Kirim broadcast verifikasi silang Ed25519 ke simpul mitra Lembaga B dan Lembaga C.',
    pos: [12, 0, 4.0],
    radius: 4.2,
  },
  {
    id: 'islamicLibrary',
    name: 'Perpustakaan Kitab Fiqih Zakat',
    actor: 'Kitab Fiqih & Fatwa',
    taskTitle: 'Kajian Fiqih Syariah Batasan Hak Amil',
    taskDesc: 'Kaji dalil Al-Qur\'an QS. At-Taubah: 60 mengenai batasan hak amil (maksimal 1/8 atau 12.5%).',
    pos: [13.2, 0, -12.5],
    radius: 3.8,
  },
  {
    id: 'hospitalityBar',
    name: 'Pojok Rehat & Doa Amil',
    actor: 'Ruang Rehat',
    taskTitle: 'Rehat Sejenak & Doa Keberkahan',
    taskDesc: 'Mendoakan keberkahan harta para muzakki dan kelapangan bagi para mustahik.',
    pos: [-13.5, 0, 7.5],
    radius: 3.8,
  },
];

interface RealtimeEvent {
  id: string;
  actor: string;
  text: string;
  stationKey: string;
  time: string;
}

interface CharacterRig {
  id: string;
  group: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftKnee: THREE.Group;
  rightKnee: THREE.Group;
  homePos: THREE.Vector3;
  homeRotY: number;
  currentWaypoint: THREE.Vector3 | null;
  walkPath: THREE.Vector3[];
  pathIndex: number;
  isWalking: boolean;
  actionTimer: number;
  walkPhase: number;
  standing: boolean;
  targetLookY: number;
}

// Procedural Canvas Textures Generator for Parquet and Batik
function createParquetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#C8B29E';
  ctx.fillRect(0, 0, 512, 512);

  const tileW = 64;
  const tileH = 32;
  for (let y = 0; y < 512; y += tileH) {
    for (let x = 0; x < 512; x += tileW) {
      const isAlt = (Math.floor(x / tileW) + Math.floor(y / tileH)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#D8C4B0' : '#BFA792';
      ctx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2);

      ctx.strokeStyle = isAlt ? '#C5B09B' : '#AE9681';
      ctx.lineWidth = 1;
      for (let g = 4; g < tileH - 4; g += 6) {
        ctx.beginPath();
        ctx.moveTo(x + 2, y + g);
        ctx.lineTo(x + tileW - 2, y + g + (isAlt ? 1 : -1));
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 5);
  return texture;
}

function createBatikTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#112233';
  ctx.fillRect(0, 0, 256, 256);

  const step = 64;
  for (let y = 0; y <= 256; y += step) {
    for (let x = 0; x <= 256; x += step) {
      ctx.fillStyle = '#C8962E';
      ctx.beginPath();
      ctx.ellipse(x, y - 18, 10, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(x, y + 18, 10, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 18, y, 18, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 18, y, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#E5C158';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

function createPersianRugTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#06372D';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#C8962E';
  ctx.lineWidth = 14;
  ctx.strokeRect(14, 14, 484, 484);

  ctx.strokeStyle = '#F3D27A';
  ctx.lineWidth = 4;
  ctx.strokeRect(28, 28, 456, 456);

  ctx.fillStyle = '#0F5C4D';
  ctx.beginPath();
  ctx.ellipse(256, 256, 140, 100, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#C8962E';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = '#C8962E';
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const r = 40;
    const px = 256 + Math.cos(angle) * r;
    const py = 256 + Math.sin(angle) * r;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

export default function Dashboard3D({
  onClose,
  user,
}: {
  onClose: () => void;
  user?: { nama: string; peran: string; email: string } | null;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const speechBubbleRef = useRef<HTMLDivElement>(null);
  const activeSpeechRef = useRef<{
    charId: string;
    actor: string;
    text: string;
    expireTime: number;
  } | null>(null);

  const [selectedStation, setSelectedStation] = useState<StationInfo | null>(null);
  const [webglFailed, setWebglFailed] = useState<boolean>(false);
  const officeVisibleRef = useRef<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'desks' | 'board' | 'network'>('all');
  const [activeSpeech, setActiveSpeech] = useState<{
    charId: string;
    actor: string;
    text: string;
    x?: number;
    y?: number;
  } | null>(null);
  const [latestToast, setLatestToast] = useState<RealtimeEvent | null>(null);

  // Character Controlled by Account
  const initialChar =
    user?.email?.toLowerCase().includes('hari') || user?.nama?.toLowerCase().includes('hari')
      ? 'hari'
      : user?.email?.toLowerCase().includes('dewi') || user?.nama?.toLowerCase().includes('dewi')
      ? 'dewi'
      : user?.email?.toLowerCase().includes('rian') || user?.nama?.toLowerCase().includes('rian')
      ? 'rian'
      : 'budi';

  const [controlledCharId, setControlledCharId] = useState<string>(initialChar);
  const controlledCharIdRef = useRef<string>(initialChar);
  const [followCamera, setFollowCamera] = useState<boolean>(true);
  const followCameraRef = useRef<boolean>(true);

  // Character Play Mode (Default false: characters walk automatically, controls hidden)
  const [isPlayingCharacter, setIsPlayingCharacter] = useState(false);
  const isPlayingCharacterRef = useRef(false);

  // Minecraft PE Style Virtual Analog Stick State & Refs
  const [joystickKnobPos, setJoystickKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const isDraggingJoystickRef = useRef(false);

  // Proximity & Task Modals
  const [activeNearStation, setActiveNearStation] = useState<ProximityStation | null>(null);
  const activeNearStationRef = useRef<ProximityStation | null>(null);
  const [activeTaskModal, setActiveTaskModal] = useState<ProximityStation | null>(null);

  // Task Completion Tracker
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
    pelayanan: false,
    keuangan_hari: false,
    keuangan_dewi: false,
    bigBoard: false,
    networkHub: false,
    islamicLibrary: false,
    hospitalityBar: false,
  });
  const [integrityScore, setIntegrityScore] = useState(70);
  const [isQuestListExpanded, setIsQuestListExpanded] = useState(true);

  // Movement keys & touch joystick refs
  const keysPressed = useRef<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    sprint: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });

  const joystickVector = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSprintingTouch, setIsSprintingTouch] = useState(false);
  const isSprintingTouchRef = useRef(false);

  // Task Forms State
  const [inputDonasiNominal, setInputDonasiNominal] = useState('5.000.000');
  const [inputDonasiMuzakki, setInputDonasiMuzakki] = useState('H. Sulaiman');
  const [inputDonasiPos, setInputDonasiPos] = useState('Zakat Maal');
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);

  useEffect(() => {
    controlledCharIdRef.current = controlledCharId;
  }, [controlledCharId]);

  useEffect(() => {
    isPlayingCharacterRef.current = isPlayingCharacter;
  }, [isPlayingCharacter]);

  useEffect(() => {
    followCameraRef.current = followCamera;
  }, [followCamera]);

  useEffect(() => {
    isSprintingTouchRef.current = isSprintingTouch;
  }, [isSprintingTouch]);

  // Collapse quest list by default on tablet & mobile devices (< 1024px) for cleaner 3D viewport
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsQuestListExpanded(false);
    }
  }, []);

  // Sync with user prop if it changes
  useEffect(() => {
    if (user) {
      const detected =
        user.email?.toLowerCase().includes('hari') || user.nama?.toLowerCase().includes('hari')
          ? 'hari'
          : user.email?.toLowerCase().includes('dewi') || user.nama?.toLowerCase().includes('dewi')
          ? 'dewi'
          : user.email?.toLowerCase().includes('rian') || user.nama?.toLowerCase().includes('rian')
          ? 'rian'
          : 'budi';
      setControlledCharId(detected);
      controlledCharIdRef.current = detected;
    }
  }, [user]);

  // Keyboard Event Listeners for Game Locomotion & Interaction (Only active in Play Mode!)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // If not in play mode, ignore locomotion keys
      if (!isPlayingCharacterRef.current) return;

      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keysPressed.current.forward = true;
      if (key === 's' || key === 'arrowdown') keysPressed.current.backward = true;
      if (key === 'a' || key === 'arrowleft') keysPressed.current.left = true;
      if (key === 'd' || key === 'arrowright') keysPressed.current.right = true;
      if (e.key === 'Shift') keysPressed.current.sprint = true;

      // Interaction key E or Space
      if (key === 'e' || key === ' ') {
        if (activeNearStationRef.current && !activeTaskModal) {
          e.preventDefault();
          setActiveTaskModal(activeNearStationRef.current);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isPlayingCharacterRef.current) return;
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keysPressed.current.forward = false;
      if (key === 's' || key === 'arrowdown') keysPressed.current.backward = false;
      if (key === 'a' || key === 'arrowleft') keysPressed.current.left = false;
      if (key === 'd' || key === 'arrowright') keysPressed.current.right = false;
      if (e.key === 'Shift') keysPressed.current.sprint = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTaskModal]);

  // Sync Analog Knob visual position with Keyboard presses
  useEffect(() => {
    if (!isPlayingCharacter) return;
    const interval = setInterval(() => {
      if (!isDraggingJoystickRef.current) {
        const kx = (keysPressed.current.right ? 1 : 0) - (keysPressed.current.left ? 1 : 0);
        const ky = (keysPressed.current.forward ? 1 : 0) - (keysPressed.current.backward ? 1 : 0);
        if (kx !== 0 || ky !== 0) {
          const mag = Math.hypot(kx, ky);
          const maxR = 30;
          setJoystickKnobPos({ x: (kx / mag) * maxR, y: -(ky / mag) * maxR });
        } else {
          setJoystickKnobPos((prev) => (prev.x !== 0 || prev.y !== 0 ? { x: 0, y: 0 } : prev));
        }
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isPlayingCharacter]);

  // Dynamic Store Data
  const [posDana, setPosDana] = useState<PosDanaData[]>(INITIAL_POS_DANA);
  const [penyaluranList, setPenyaluranList] = useState<PenyaluranItem[]>([]);
  const bigBoardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bigBoardTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Three.js References
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const charactersRef = useRef<Record<string, CharacterRig>>({});
  const holoCoreRef = useRef<THREE.Mesh | null>(null);
  const holoRingsRef = useRef<THREE.Group | null>(null);
  const peerNodesRef = useRef<THREE.Mesh[]>([]);
  const playerMarkerRef = useRef<THREE.Group | null>(null);

  const getCharName = (id: string) => {
    switch (id) {
      case 'budi':
        return 'Amil Budi';
      case 'hari':
        return 'Penyetuju Hari';
      case 'dewi':
        return 'Saksi Dewi';
      case 'rian':
        return 'Saksi Rian';
      default:
        return 'Amil Zaky';
    }
  };

  const handleStartPlaying = () => {
    setIsPlayingCharacter(true);
    isPlayingCharacterRef.current = true;
    const rig = charactersRef.current[controlledCharIdRef.current];
    if (rig) {
      rig.standing = true;
      rig.isWalking = false;
      if (controlsRef.current && cameraRef.current) {
        controlsRef.current.target.set(rig.group.position.x, 3.5, rig.group.position.z);
        controlsRef.current.update();
        if (followCameraRef.current) {
          cameraRef.current.position.x = rig.group.position.x + 35;
          cameraRef.current.position.z = rig.group.position.z + 33;
        }
      }
    }
    triggerCharacterSpeech(
      controlledCharIdRef.current,
      getCharName(controlledCharIdRef.current),
      `Bismillah! Saya ${getCharName(controlledCharIdRef.current)} siap bertugas. Gunakan joystick analog / tombol WASD untuk bergerak!`,
      4500
    );
  };

  const handleStopPlaying = () => {
    setIsPlayingCharacter(false);
    isPlayingCharacterRef.current = false;
    keysPressed.current = { forward: false, backward: false, left: false, right: false, sprint: false };
    joystickVector.current = { x: 0, y: 0 };
    setJoystickKnobPos({ x: 0, y: 0 });
    setActiveNearStation(null);
    activeNearStationRef.current = null;
    triggerCharacterSpeech(
      controlledCharIdRef.current,
      getCharName(controlledCharIdRef.current),
      `Mode kendali selesai. Semua amil kembali beraktivitas mandiri secara otomatis.`,
      3500
    );
  };

  const updateAnalogJoystick = (clientX: number, clientY: number) => {
    const base = joystickBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = rect.width / 2 - 14;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, maxRadius);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setJoystickKnobPos({ x: knobX, y: knobY });

    // Normalize: screen Up is -dy, so normY = -knobY / maxRadius
    const normX = knobX / maxRadius;
    const normY = -(knobY / maxRadius);
    joystickVector.current = { x: normX, y: normY };
  };

  const handleJoystickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingJoystickRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateAnalogJoystick(e.clientX, e.clientY);
  };

  const handleJoystickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingJoystickRef.current) return;
    e.preventDefault();
    updateAnalogJoystick(e.clientX, e.clientY);
  };

  const handleJoystickPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingJoystickRef.current = false;
    setJoystickKnobPos({ x: 0, y: 0 });
    joystickVector.current = { x: 0, y: 0 };
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const navigateToStation = (station: ProximityStation) => {
    if (!isPlayingCharacterRef.current) {
      setIsPlayingCharacter(true);
      isPlayingCharacterRef.current = true;
    }
    const rig = charactersRef.current[controlledCharIdRef.current];
    if (!rig) return;
    const targetPos = new THREE.Vector3(...station.pos);
    rig.group.position.set(targetPos.x, 0, targetPos.z + 1.2);
    rig.standing = true;
    rig.isWalking = false;
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.target.set(targetPos.x, 3.5, targetPos.z);
      controlsRef.current.update();
      if (followCameraRef.current) {
        cameraRef.current.position.x = targetPos.x + 35;
        cameraRef.current.position.z = targetPos.z + 33;
      }
    }
    setActiveNearStation(station);
    activeNearStationRef.current = station;
    triggerCharacterSpeech(
      controlledCharIdRef.current,
      getCharName(controlledCharIdRef.current),
      `Tiba di ${station.name}. Buka tugas untuk mengerjakannya!`,
      3500
    );
  };

  const handleCompleteTask = (stationId: string) => {
    setCompletedTasks((prev) => ({ ...prev, [stationId]: true }));
    setIntegrityScore((prev) => Math.min(100, prev + 5));

    if (stationId === 'pelayanan') {
      const nominalRaw = parseInt(inputDonasiNominal.replace(/[^0-9]/g, ''), 10) || 5000000;
      const currentPosList = getSavedPosDana();
      const updated = currentPosList.map((p) => {
        if (p.nama.toLowerCase().includes(inputDonasiPos.toLowerCase()) || p.id === 'pos-1') {
          return {
            ...p,
            totalMasuk: p.totalMasuk + nominalRaw,
            saldoTersedia: p.saldoTersedia + nominalRaw,
          };
        }
        return p;
      });
      localStorage.setItem('zaky_pos_dana', JSON.stringify(updated));
      window.dispatchEvent(new Event('zaky_store_updated'));
      triggerCharacterSpeech(
        controlledCharIdRef.current,
        getCharName(controlledCharIdRef.current),
        `Alhamdulillah! Donasi zakat ${formatRupiah(nominalRaw)} dari ${inputDonasiMuzakki} berhasil disahkan ke Ledger Zaky!`,
        5000
      );
    } else if (stationId === 'keuangan_hari') {
      const currentPosList = getSavedPosDana();
      const reserveAmount = 800000;
      const updated = currentPosList.map((p, idx) => {
        if (idx === 0 && p.saldoTersedia >= reserveAmount) {
          return {
            ...p,
            saldoTersedia: p.saldoTersedia - reserveAmount,
            saldoDicadangkan: p.saldoDicadangkan + reserveAmount,
          };
        }
        return p;
      });
      localStorage.setItem('zaky_pos_dana', JSON.stringify(updated));
      window.dispatchEvent(new Event('zaky_store_updated'));
      triggerCharacterSpeech(
        controlledCharIdRef.current,
        getCharName(controlledCharIdRef.current),
        'Draf mustahik disetujui! Saldo berhasil dicadangkan sesuai Invariant FR-03.',
        5000
      );
    } else if (stationId === 'keuangan_dewi') {
      triggerCharacterSpeech(
        controlledCharIdRef.current,
        getCharName(controlledCharIdRef.current),
        'Kesaksian 3-pihak independen berhasil diverifikasi & ditandatangani secara sah pada ledger.',
        5000
      );
    } else if (stationId === 'bigBoard') {
      triggerCharacterSpeech(
        controlledCharIdRef.current,
        getCharName(controlledCharIdRef.current),
        'Audit Invariant FR-03 selesai: 100% konsisten, Total Masuk = Tersedia + Dicadangkan + Tersalurkan!',
        5000
      );
    } else if (stationId === 'networkHub') {
      triggerCharacterSpeech(
        controlledCharIdRef.current,
        getCharName(controlledCharIdRef.current),
        'Broadcast Ed25519 sukses! Konsensus antarlembaga BAZNAS & mitra terkonfirmasi 100%.',
        5000
      );
    } else if (stationId === 'islamicLibrary') {
      triggerCharacterSpeech(
        controlledCharIdRef.current,
        getCharName(controlledCharIdRef.current),
        'Kajian Fiqih tuntas: Hak amil maksimal 1/8 (12.5%) sesuai QS. At-Taubah: 60.',
        5000
      );
    } else if (stationId === 'hospitalityBar') {
      triggerCharacterSpeech(
        controlledCharIdRef.current,
        getCharName(controlledCharIdRef.current),
        'Doa keberkahan dipanjatkan: Jazakallahu khairan atas keikhlasan para amil & muzakki.',
        5000
      );
    }

    setActiveTaskModal(null);
  };

  // Defined POIs for Walking Engine
  const POIS = {
    pelayananDesk: new THREE.Vector3(-8, 0, -3.0),
    hariDesk: new THREE.Vector3(-2, 0, -3.0),
    dewiDesk: new THREE.Vector3(4, 0, -3.0),
    rianDesk: new THREE.Vector3(-5, 0, 3.0),
    aisleCenter: new THREE.Vector3(0, 0, -0.5),
    bigBoardCenter: new THREE.Vector3(0, 0, -10.5),
    bigBoardLeft: new THREE.Vector3(-4, 0, -10.5),
    networkHubInspect: new THREE.Vector3(9.2, 0, 3.8),
    hospitalityBar: new THREE.Vector3(-13.5, 0, 7.5),
    islamicLibrary: new THREE.Vector3(12.0, 0, -11.5),
  };

  // FULLSCREEN TOGGLE
  const toggleFullscreen = async () => {
    const root = rootRef.current;
    if (!root) return;

    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (root.requestFullscreen) {
          await root.requestFullscreen();
        } else if ((root as any).webkitRequestFullscreen) {
          await (root as any).webkitRequestFullscreen();
        } else if ((root as any).msRequestFullscreen) {
          await (root as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Load Real Data from Store and subscribe
  const refreshStoreData = useCallback(() => {
    const savedPos = getSavedPosDana();
    const savedDist = getSavedPenyaluran();
    setPosDana(savedPos);
    setPenyaluranList(savedDist);
  }, []);

  useEffect(() => {
    refreshStoreData();
  }, [refreshStoreData]);

  // Auto-sinkron: perubahan store dari halaman/tab lain ikut menggerakkan HUD 3D
  useStoreSync(refreshStoreData);

  // Synchronize Three.js renderer and camera viewport on fullscreen state change
  useEffect(() => {
    const handleViewportResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      if (w === 0 || h === 0) return;

      const asp = w / h;
      const adaptiveD = asp >= 1.6 ? 14.5 : (asp >= 1.0 ? 17.0 : 20.0 / asp);
      const camera = cameraRef.current;
      camera.left = -adaptiveD * asp;
      camera.right = adaptiveD * asp;
      camera.top = adaptiveD;
      camera.bottom = -adaptiveD;
      camera.updateProjectionMatrix();

      if (controlsRef.current) {
        controlsRef.current.target.set(0, 4.0, -1.5);
        controlsRef.current.update();
      }

      rendererRef.current.setSize(w, h, true);
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    };

    handleViewportResize();
    const t1 = setTimeout(handleViewportResize, 30);
    const t2 = setTimeout(handleViewportResize, 100);
    const t3 = setTimeout(handleViewportResize, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isFullscreen]);

  // FAITHFUL REALISTIC 2048x1024 ZAKY DASHBOARD PAINTER
  const updateBigBoardDisplay = useCallback(() => {
    const canvas = bigBoardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Authentic Zaky Light/Neutral Design Surface Background (#F3F5F4)
    ctx.fillStyle = '#F1F4F2';
    ctx.fillRect(0, 0, 2048, 1024);

    // Outer subtle border
    ctx.strokeStyle = '#D1DCD6';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 2040, 1016);

    // 1. TOP HEADER & METADATA BAR
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(36, 24, 1976, 96);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 24, 1976, 96);

    // Simpul Status Pill
    ctx.fillStyle = '#D1FAE5';
    ctx.beginPath();
    ctx.roundRect(56, 40, 260, 32, 16);
    ctx.fill();

    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(74, 56, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#065F46';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Lembaga Zakat A • Simpul Aktif', 88, 61);

    ctx.fillStyle = '#64748B';
    ctx.font = '14px monospace';
    ctx.fillText('Consensus: Online', 330, 61);

    // Realtime Digital Clock with Live Pulsing Indicator
    const nowStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0F5C4D';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`🕒 ${nowStr} WIB • SINKRON 100%`, 1980, 61);

    // Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0E1F1B';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('Dasbor Penyaluran & Saldo Dana — Protokol Kriptografi Zaky', 56, 98);

    // Subtitle
    ctx.fillStyle = '#4E625E';
    ctx.font = '14px sans-serif';
    ctx.fillText('Setiap catatan saling disaksikan antarlembaga • Constraint invariant FR-03 aktif di server basis data', 850, 98);

    // 2. SECTION: GLOBAL 4-NUMBER INVARIANT STATS (y: 136 to 340)
    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect(36, 136, 1976, 210, 16);
    ctx.fill();
    ctx.strokeStyle = '#D1DCD6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Invariant Card Header
    ctx.fillStyle = '#0F5C4D';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('🛡️ Ringkasan Konsolidasi Seluruh Pos Dana', 60, 172);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748B';
    ctx.font = '14px monospace';
    ctx.fillText('FR-03 Invariant: Total Masuk = Tersedia + Dicadangkan + Tersalurkan', 1980, 172);

    // Calculate real numbers from posDana
    const totalSemuaMasuk = posDana.reduce((acc, p) => acc + p.totalMasuk, 0);
    const totalSemuaTersedia = posDana.reduce((acc, p) => acc + p.saldoTersedia, 0);
    const totalSemuaDicadangkan = posDana.reduce((acc, p) => acc + p.saldoDicadangkan, 0);
    const totalSemuaTersalurkan = posDana.reduce((acc, p) => acc + p.totalTersalurkan, 0);

    const pctTersedia = Math.round((totalSemuaTersedia / totalSemuaMasuk) * 100) || 19;
    const pctDicadangkan = Math.round((totalSemuaDicadangkan / totalSemuaMasuk) * 100) || 11;
    const pctTersalurkan = 100 - pctTersedia - pctDicadangkan;

    // 4 Primary Metric Cards
    const cardW = 472;
    const cardsData = [
      {
        label: 'Total Dana Masuk',
        val: formatRupiah(totalSemuaMasuk),
        sub: 'Akumulasi penerimaan zakat',
        bg: '#F8FAFC',
        border: '#E2E8F0',
        col: '#0E1F1B',
      },
      {
        label: `Saldo Tersedia (${pctTersedia}%)`,
        val: formatRupiah(totalSemuaTersedia),
        sub: 'Siap dialokasikan untuk draf baru',
        bg: '#ECFDF5',
        border: '#A7F3D0',
        col: '#0F5C4D',
      },
      {
        label: `Dicadangkan (${pctDicadangkan}%)`,
        val: formatRupiah(totalSemuaDicadangkan),
        sub: 'Terkunci dalam draf aktif (FR-04)',
        bg: '#FFFBEB',
        border: '#FDE68A',
        col: '#C8962E',
      },
      {
        label: `Tersalurkan Sah (${pctTersalurkan}%)`,
        val: formatRupiah(totalSemuaTersalurkan),
        sub: 'Konfirmasi penerima & disetujui unit lain',
        bg: '#F0FDF4',
        border: '#BBF7D0',
        col: '#15803D',
      },
    ];

    cardsData.forEach((c, idx) => {
      const cx = 56 + idx * (cardW + 16);
      ctx.fillStyle = c.bg;
      ctx.roundRect(cx, 190, cardW, 95, 12);
      ctx.fill();
      ctx.strokeStyle = c.border;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(c.label, cx + 18, 214);

      ctx.fillStyle = c.col;
      ctx.font = 'bold 24px monospace';
      ctx.fillText(c.val, cx + 18, 248);

      ctx.fillStyle = '#64748B';
      ctx.font = '12px sans-serif';
      ctx.fillText(c.sub, cx + 18, 272);
    });

    // Tri-color Invariant Progress Bar
    const barX = 56;
    const barY = 302;
    const barW = 1936;
    const barH = 16;

    ctx.fillStyle = '#E2E8F0';
    ctx.roundRect(barX, barY, barW, barH, 8);
    ctx.fill();

    const wTersedia = (pctTersedia / 100) * barW;
    const wDicadangkan = (pctDicadangkan / 100) * barW;
    const wTersalurkan = barW - wTersedia - wDicadangkan;

    // Green
    ctx.fillStyle = '#0F5C4D';
    ctx.beginPath();
    ctx.roundRect(barX, barY, wTersedia, barH, [8, 0, 0, 8]);
    ctx.fill();

    // Gold
    ctx.fillStyle = '#C8962E';
    ctx.fillRect(barX + wTersedia, barY, wDicadangkan, barH);

    // Emerald
    ctx.fillStyle = '#16A34A';
    ctx.beginPath();
    ctx.roundRect(barX + wTersedia + wDicadangkan, barY, wTersalurkan, barH, [0, 8, 8, 0]);
    ctx.fill();

    // Progress Bar Legend
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0F5C4D';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`■ Tersedia (${pctTersedia}%)`, 60, 336);

    ctx.fillStyle = '#C8962E';
    ctx.fillText(`■ Dicadangkan (${pctDicadangkan}%)`, 220, 336);

    ctx.fillStyle = '#16A34A';
    ctx.fillText(`■ Tersalurkan (${pctTersalurkan}%)`, 410, 336);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0F5C4D';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('✓ Formula Invariant FR-03 100% Terjaga Valid', 1980, 336);

    // 3. SECTION: RINCIAN POS DANA PROGRAM (y: 360 to 570)
    const posW = 976;
    const posMaal = posDana[0] || INITIAL_POS_DANA[0];
    const posFitrah = posDana[1] || INITIAL_POS_DANA[1];

    // Card Zakat Maal
    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect(36, 360, posW, 210, 16);
    ctx.fill();
    ctx.strokeStyle = '#D1DCD6';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0E1F1B';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Zakat Maal', 60, 396);
    ctx.fillStyle = '#64748B';
    ctx.font = '13px sans-serif';
    ctx.fillText('Total Penerimaan:', 60, 424);
    ctx.fillStyle = '#0E1F1B';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(formatRupiah(posMaal.totalMasuk), 200, 424);

    // Sub breakdown box
    ctx.fillStyle = '#F8FAFC';
    ctx.roundRect(60, 442, 928, 110, 10);
    ctx.fill();

    ctx.fillStyle = '#0F5C4D';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Saldo Tersedia', 80, 474);
    ctx.font = 'bold 24px monospace';
    ctx.fillText(formatRupiah(posMaal.saldoTersedia), 80, 510);
    ctx.fillStyle = '#64748B';
    ctx.font = '12px sans-serif';
    ctx.fillText('Siap dialokasikan', 80, 534);

    ctx.fillStyle = '#C8962E';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Dicadangkan', 400, 474);
    ctx.font = 'bold 24px monospace';
    ctx.fillText(formatRupiah(posMaal.saldoDicadangkan), 400, 510);
    ctx.fillStyle = '#64748B';
    ctx.font = '12px sans-serif';
    ctx.fillText('Draf mustahik aktif', 400, 534);

    ctx.fillStyle = '#16A34A';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Tersalurkan Sah', 710, 474);
    ctx.font = 'bold 24px monospace';
    ctx.fillText(formatRupiah(posMaal.totalTersalurkan), 710, 510);
    ctx.fillStyle = '#64748B';
    ctx.font = '12px sans-serif';
    ctx.fillText('Selesai diverifikasi', 710, 534);

    // Card Zakat Fitrah
    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect(1036, 360, posW, 210, 16);
    ctx.fill();
    ctx.strokeStyle = '#D1DCD6';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0E1F1B';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Zakat Fitrah Uang', 1060, 396);
    ctx.fillStyle = '#64748B';
    ctx.font = '13px sans-serif';
    ctx.fillText('Total Penerimaan:', 1060, 424);
    ctx.fillStyle = '#0E1F1B';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(formatRupiah(posFitrah.totalMasuk), 1210, 424);

    // Sub breakdown box
    ctx.fillStyle = '#F8FAFC';
    ctx.roundRect(1060, 442, 928, 110, 10);
    ctx.fill();

    ctx.fillStyle = '#0F5C4D';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Saldo Tersedia', 1080, 474);
    ctx.font = 'bold 24px monospace';
    ctx.fillText(formatRupiah(posFitrah.saldoTersedia), 1080, 510);
    ctx.fillStyle = '#64748B';
    ctx.font = '12px sans-serif';
    ctx.fillText('Siap dialokasikan', 1080, 534);

    ctx.fillStyle = '#C8962E';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Dicadangkan', 1400, 474);
    ctx.font = 'bold 24px monospace';
    ctx.fillText(formatRupiah(posFitrah.saldoDicadangkan), 1400, 510);
    ctx.fillStyle = '#64748B';
    ctx.font = '12px sans-serif';
    ctx.fillText('Draf mustahik aktif', 1400, 534);

    ctx.fillStyle = '#16A34A';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Tersalurkan Sah', 1710, 474);
    ctx.font = 'bold 24px monospace';
    ctx.fillText(formatRupiah(posFitrah.totalTersalurkan), 1710, 510);
    ctx.fillStyle = '#64748B';
    ctx.font = '12px sans-serif';
    ctx.fillText('Selesai diverifikasi', 1710, 534);

    // 4. SECTION: ALIRAN AUDIT LOG TRANSAKSI TERAKHIR (y: 590 to 920)
    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect(36, 590, 1976, 330, 16);
    ctx.fill();
    ctx.strokeStyle = '#D1DCD6';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0E1F1B';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('📋 Aliran Audit Log Transaksi Terakhir (Append-Only Chained)', 60, 626);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0F5C4D';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('SHA-256 Hash Chained • Immutability Trigger Database', 1980, 626);

    // 3 Authentic Audit Log Rows
    const auditStream = [
      {
        nomor: '#24',
        waktu: '27 Okt 09.10',
        aksi: 'RESERVASI_DRAF',
        rincian: 'Draf penyaluran Rp 800.000 (ZK7H3Q9PLM2A) untuk Mustahik S*** (Asnaf Fakir)',
        pelaku: 'Amil Budi (Unit Pelayanan)',
        hash: 'Hash: 9f2c8d1e...e41a',
      },
      {
        nomor: '#23',
        waktu: '25 Okt 14.45',
        aksi: 'SETUJUI_TERSALURKAN',
        rincian: 'Penyetujuan penyaluran Rp 1.200.000 (ZK4B8V2KNT9X) telah disahkan',
        pelaku: 'Penyetuju Hari (Unit Keuangan)',
        hash: 'Hash: 7ab01f3e...33d1',
      },
      {
        nomor: '#22',
        waktu: '25 Okt 14.00',
        aksi: 'KONFIRMASI_SAKSI_2',
        rincian: 'Saksi 2 mengonfirmasi penyaluran mustahik tanpa ponsel Kabupaten Bantul',
        pelaku: 'Saksi Rian (Unit Kepegawaian)',
        hash: 'Hash: 1a4d8c90...56fe',
      },
    ];

    auditStream.forEach((log, idx) => {
      const ly = 648 + idx * 72;
      ctx.fillStyle = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
      ctx.roundRect(60, ly, 1928, 62, 10);
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#0E1F1B';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(log.nomor, 80, ly + 28);

      ctx.fillStyle = '#0F5C4D';
      ctx.beginPath();
      ctx.roundRect(140, ly + 14, 180, 22, 6);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(log.aksi, 152, ly + 29);

      ctx.fillStyle = '#64748B';
      ctx.font = '13px monospace';
      ctx.fillText(log.waktu, 340, ly + 28);

      ctx.fillStyle = '#0E1F1B';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(log.rincian, 80, ly + 50);

      ctx.fillStyle = '#64748B';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Pelaku: ${log.pelaku}`, 680, ly + 50);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#0F5C4D';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(log.hash, 1960, ly + 36);
    });

    // 5. CLICKABLE INTERACTION CALLOUT BANNER (y: 938 to 1000)
    ctx.fillStyle = '#0F5C4D';
    ctx.roundRect(36, 936, 1976, 68, 12);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('👆 LAYAR INTERAKTIF AKTIF — KLIK LAYAR INI DENGAN MOUSE UNTUK ZOOM & MEMBUKA RINCIAN AUDIT LENGKAP', 60, 977);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Buka Rincian Panel Audit →', 1980, 977);

    if (bigBoardTextureRef.current) {
      bigBoardTextureRef.current.needsUpdate = true;
    }
  }, [posDana, penyaluranList]);

  // Periodic Big Board Clock update
  useEffect(() => {
    updateBigBoardDisplay();
    const clockInterval = setInterval(() => {
      updateBigBoardDisplay();
    }, 1000);
    return () => clearInterval(clockInterval);
  }, [updateBigBoardDisplay]);

  // TRIGGER FLOATING SPEECH BUBBLE DIRECTLY ABOVE CHARACTER'S HEAD
  const triggerCharacterSpeech = (charId: string, actor: string, text: string, duration = 4800) => {
    activeSpeechRef.current = {
      charId,
      actor,
      text,
      expireTime: Date.now() + duration,
    };
    setActiveSpeech({
      charId,
      actor,
      text,
    });
  };

  // DISPATCH CHARACTER TO WALK TO DESTINATION
  const dispatchCharacterWalk = (
    charId: string,
    target: THREE.Vector3,
    speech: string,
    durationAtTarget = 5000
  ) => {
    // If character is currently being controlled by player, skip autonomous routine
    if (isPlayingCharacterRef.current && charId === controlledCharIdRef.current) return;

    const rig = charactersRef.current[charId];
    if (!rig) return;

    const currentPos = rig.group.position.clone();
    const route: THREE.Vector3[] = [];

    const aisleZ = -0.5;
    route.push(new THREE.Vector3(currentPos.x, 0, aisleZ));
    route.push(new THREE.Vector3(target.x, 0, aisleZ));
    route.push(new THREE.Vector3(target.x, 0, target.z));

    rig.walkPath = route;
    rig.pathIndex = 0;
    rig.currentWaypoint = route[0];
    rig.isWalking = true;
    rig.standing = true;
    rig.actionTimer = 0;

    const actorName =
      rig.id === 'budi'
        ? 'Amil Budi'
        : rig.id === 'hari'
        ? 'Penyetuju Hari'
        : rig.id === 'dewi'
        ? 'Saksi Dewi'
        : 'Developer Rian';

    triggerCharacterSpeech(charId, actorName, speech, 4800);

    setTimeout(() => {
      if (rig) {
        const returnRoute: THREE.Vector3[] = [
          new THREE.Vector3(target.x, 0, aisleZ),
          new THREE.Vector3(rig.homePos.x, 0, aisleZ),
          rig.homePos.clone(),
        ];
        rig.walkPath = returnRoute;
        rig.pathIndex = 0;
        rig.currentWaypoint = returnRoute[0];
        rig.isWalking = true;
      }
    }, durationAtTarget);
  };

  // TRIGGER REALTIME ACTIVITY EVENT
  const triggerRealtimeActivity = (eventKey: 'verif' | 'persetujuan' | 'kesaksian') => {
    let newEvt: RealtimeEvent;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (eventKey === 'verif') {
      newEvt = {
        id: `evt-${Date.now()}`,
        actor: 'Amil Budi',
        text: 'Amil Budi memeriksa OTP SMS Mustahik di Layar Dasbor: Draf terkonfirmasi sah!',
        stationKey: 'pelayanan',
        time: nowTime,
      };
      dispatchCharacterWalk('budi', POIS.bigBoardLeft, 'Memeriksa OTP SMS Mustahik di Layar Dasbor Utama!');
    } else if (eventKey === 'persetujuan') {
      newEvt = {
        id: `evt-${Date.now()}`,
        actor: 'Penyetuju Hari',
        text: 'Penyetuju Hari mengesahkan penyaluran di konsol utama: FR-03 terjaga!',
        stationKey: 'keuangan_hari',
        time: nowTime,
      };
      dispatchCharacterWalk('hari', POIS.bigBoardCenter, 'Bismillah, berkas sah dan saldo resmi dicadangkan.');
    } else {
      newEvt = {
        id: `evt-${Date.now()}`,
        actor: 'Saksi Dewi & Hub P2P',
        text: 'Lembaga B dan C memvalidasi tanda tangan Ed25519 pada Papan Silang.',
        stationKey: 'networkHub',
        time: nowTime,
      };
      dispatchCharacterWalk('dewi', POIS.networkHubInspect, 'Mengecek kesaksian multi-pihak Lembaga B & C.');
    }

    setLatestToast(newEvt);
    updateBigBoardDisplay();
  };

  // Autonomous office life simulation (Every 14 seconds an amil roams naturally)
  useEffect(() => {
    const autonomousRoutines = [
      () => dispatchCharacterWalk('budi', POIS.bigBoardCenter, 'Memeriksa ringkasan konsolidasi saldo zakat.'),
      () => dispatchCharacterWalk('dewi', POIS.networkHubInspect, 'Melihat status latensi simpul Lembaga B.'),
      () => dispatchCharacterWalk('hari', POIS.islamicLibrary, 'Mengambil kitab fiqh zakat di rak perpustakaan.'),
      () => dispatchCharacterWalk('rian', POIS.hospitalityBar, 'Istirahat sejenak menikmati teh hangat.'),
    ];

    let rIdx = 0;
    const interval = setInterval(() => {
      autonomousRoutines[rIdx]();
      rIdx = (rIdx + 1) % autonomousRoutines.length;
    }, 14000);

    return () => clearInterval(interval);
  }, []);

  // GSAP Drawer entry
  useEffect(() => {
    if (selectedStation && drawerRef.current) {
      gsap.fromTo(
        drawerRef.current,
        { x: 380, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [selectedStation]);

  // CAMERA TRANSITIONS WITH GSAP
  const switchCameraView = (view: 'all' | 'desks' | 'board' | 'network') => {
    setActiveTab(view);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    controls.enabled = false;

    if (view === 'all') {
      gsap.to(camera.position, {
        x: 35,
        y: 32,
        z: 33,
        duration: 1.2,
        ease: 'power3.inOut',
      });
      gsap.to(controls.target, {
        x: 0,
        y: 4.0,
        z: -1.5,
        duration: 1.2,
        ease: 'power3.inOut',
      });
      gsap.to(camera, {
        zoom: 1,
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => camera.updateProjectionMatrix(),
        onComplete: () => {
          controls.enabled = true;
        },
      });
    } else if (view === 'desks') {
      setSelectedStation(STATIONS.pelayanan);
      gsap.to(camera.position, {
        x: 14,
        y: 18,
        z: 22,
        duration: 1.2,
        ease: 'power3.inOut',
      });
      gsap.to(controls.target, {
        x: -2,
        y: 2.2,
        z: -1.5,
        duration: 1.2,
        ease: 'power3.inOut',
      });
      gsap.to(camera, {
        zoom: 1.5,
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => camera.updateProjectionMatrix(),
        onComplete: () => {
          controls.enabled = true;
        },
      });
    } else if (view === 'board') {
      setSelectedStation(STATIONS.bigBoard);
      gsap.to(camera.position, {
        x: 0,
        y: 11,
        z: 16,
        duration: 1.2,
        ease: 'power3.inOut',
      });
      gsap.to(controls.target, {
        x: 0,
        y: 8.0,
        z: -15.2,
        duration: 1.2,
        ease: 'power3.inOut',
      });
      gsap.to(camera, {
        zoom: 1.85,
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => camera.updateProjectionMatrix(),
        onComplete: () => {
          controls.enabled = true;
        },
      });
    } else if (view === 'network') {
      setSelectedStation(STATIONS.networkHub);
      gsap.to(camera.position, {
        x: 26,
        y: 16,
        z: 20,
        duration: 1.2,
        ease: 'power3.inOut',
      });
      gsap.to(controls.target, {
        x: 12,
        y: 3.2,
        z: 4,
        duration: 1.2,
        ease: 'power3.inOut',
      });
      gsap.to(camera, {
        zoom: 1.55,
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => camera.updateProjectionMatrix(),
        onComplete: () => {
          controls.enabled = true;
        },
      });
    }
  };

  // THREE.JS SCENE INITIALIZATION
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3efe3);
    scene.fog = new THREE.Fog(0xf3efe3, 80, 220);
    sceneRef.current = scene;

    // 2. ISOMETRIC CAMERA
    const aspect = width / height;
    const adaptiveD = aspect >= 1.6 ? 14.5 : (aspect >= 1.0 ? 17.0 : 20.0 / aspect);
    const camera = new THREE.OrthographicCamera(
      -adaptiveD * aspect,
      adaptiveD * aspect,
      adaptiveD,
      -adaptiveD,
      1,
      180
    );
    camera.position.set(35, 32, 33);
    camera.lookAt(0, 4.0, -1.5);
    cameraRef.current = camera;

    // 3. RENDERER WITH LOGARITHMIC DEPTH BUFFER (Eliminates Z-fighting across all planes)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, logarithmicDepthBuffer: true });
    } catch {
      setWebglFailed(true);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    renderer.domElement.style.display = 'block';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    // Jeda render saat kantor virtual di luar layar
    let officeVisObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      officeVisObserver = new IntersectionObserver(
        (entries) => {
          officeVisibleRef.current = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.02 }
      );
      officeVisObserver.observe(container);
    }

    // 4. ORBIT CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minZoom = 0.55;
    controls.maxZoom = 2.4;
    controls.target.set(0, 4.0, -1.5);
    controlsRef.current = controls;

    // 5. SHADOW ACNE-FREE LIGHTING (Cures back wall flickering completely!)
    const ambientLight = new THREE.AmbientLight(0xfffef7, 1.05);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaea, 1.45);
    sunLight.position.set(25, 45, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 100;
    const shadowD = 25;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    // POSITIVE BIAS + NORMAL BIAS COMPLETELY PREVENTS SHADOW ACNE FLICKERING ON WALLS!
    sunLight.shadow.bias = 0.0001;
    sunLight.shadow.normalBias = 0.035;
    scene.add(sunLight);

    const emeraldFill = new THREE.DirectionalLight(0xd1fae5, 0.45);
    emeraldFill.position.set(-20, 25, -20);
    scene.add(emeraldFill);

    // 6. HD MATERIALS
    const parquetTexture = createParquetTexture();
    const parquetFloorMat = new THREE.MeshStandardMaterial({
      map: parquetTexture,
      roughness: 0.6,
      metalness: 0.05,
    });

    const whiteWallMat = new THREE.MeshStandardMaterial({
      color: 0xfcfcfc,
      roughness: 0.85,
    });

    const woodTrimMat = new THREE.MeshStandardMaterial({
      color: 0x4a3224,
      roughness: 0.55,
    });

    const primaryEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x0f5c4d,
      roughness: 0.35,
    });

    const islamicGoldMat = new THREE.MeshStandardMaterial({
      color: 0xc8962e,
      metalness: 0.55,
      roughness: 0.2,
    });

    const deskWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
    });

    // 7. ROOM ARCHITECTURE & FLOORS
    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(38, 0.8, 32), parquetFloorMat);
    floorMesh.position.y = -0.4;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const floorBevel = new THREE.Mesh(
      new THREE.BoxGeometry(38.6, 0.25, 32.6),
      new THREE.MeshStandardMaterial({ color: 0x1e2e28, roughness: 0.85 })
    );
    floorBevel.position.set(0, -0.85, 0);
    floorBevel.receiveShadow = true;
    scene.add(floorBevel);

    // 7b. FLOATING 3D PLAYER CHARACTER INDICATOR MARKER
    const playerMarker = new THREE.Group();
    const markerCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.38, 0),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 1.3,
        metalness: 0.8,
        roughness: 0.2,
      })
    );
    markerCrystal.position.y = 0.45;
    playerMarker.add(markerCrystal);

    const markerHaloRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.035, 12, 32),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 1.0,
      })
    );
    markerHaloRing.rotation.x = Math.PI / 2;
    playerMarker.add(markerHaloRing);
    scene.add(playerMarker);
    playerMarkerRef.current = playerMarker;

    // 8-Pointed Rub el Hizb Star Inlay
    const starInlayGroup = new THREE.Group();
    starInlayGroup.position.set(-2, 0.02, 0);

    const square1 = new THREE.Mesh(new THREE.BoxGeometry(7, 0.02, 7), primaryEmeraldMat);
    square1.receiveShadow = true;
    starInlayGroup.add(square1);

    const square2 = new THREE.Mesh(new THREE.BoxGeometry(7, 0.02, 7), primaryEmeraldMat);
    square2.rotation.y = Math.PI / 4;
    square2.receiveShadow = true;
    starInlayGroup.add(square2);

    const goldMedallion = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 2.3, 0.03, 32),
      islamicGoldMat
    );
    goldMedallion.position.y = 0.01;
    goldMedallion.receiveShadow = true;
    starInlayGroup.add(goldMedallion);

    scene.add(starInlayGroup);

    // Islamic Persian Hospitality Rug (Left corner)
    const rugTexture = createPersianRugTexture();
    const rugMat = new THREE.MeshStandardMaterial({
      map: rugTexture,
      roughness: 0.85,
    });
    const rugMesh = new THREE.Mesh(new THREE.BoxGeometry(11, 0.06, 9), rugMat);
    rugMesh.position.set(-11, 0.04, 7);
    rugMesh.receiveShadow = true;
    scene.add(rugMesh);

    // ZERO Z-FIGHTING WALL SYSTEM (Non-overlapping Corner Geometries)
    // Back Wall: Width 37.2 (Leaves 0.8 at corners to prevent left wall overlap)
    // receiveShadow = false completely cures shadow acne flickering on the brown wall!
    const backWallLower = new THREE.Mesh(new THREE.BoxGeometry(37.2, 4.2, 0.8), woodTrimMat);
    backWallLower.position.set(0.4, 2.1, -16);
    backWallLower.receiveShadow = false;
    scene.add(backWallLower);

    const backWallUpper = new THREE.Mesh(new THREE.BoxGeometry(37.2, 9.8, 0.8), whiteWallMat);
    backWallUpper.position.set(0.4, 9.1, -16);
    backWallUpper.receiveShadow = true;
    scene.add(backWallUpper);

    const backChairRail = new THREE.Mesh(new THREE.BoxGeometry(37.25, 0.16, 0.86), islamicGoldMat);
    backChairRail.position.set(0.4, 4.2, -15.97);
    scene.add(backChairRail);

    // Left Wall
    const leftWallLower = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.2, 32), woodTrimMat);
    leftWallLower.position.set(-18.6, 2.1, 0);
    leftWallLower.receiveShadow = true;
    scene.add(leftWallLower);

    const leftWallUpper = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9.8, 32), whiteWallMat);
    leftWallUpper.position.set(-18.6, 9.1, 0);
    leftWallUpper.receiveShadow = true;
    scene.add(leftWallUpper);

    const leftChairRail = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.16, 32.05), islamicGoldMat);
    leftChairRail.position.set(-18.57, 4.2, 0);
    scene.add(leftChairRail);

    // 8. MODERN LUXURY HALO RING CHANDELIERS (Lampu Gantung Mewah Putih & Kuning Emas Orang Kaya)
    function createModernLuxuryChandelier(x: number, y: number, z: number) {
      const chandelierGroup = new THREE.Group();
      chandelierGroup.position.set(x, y, z);

      // Polished Champagne Gold Ceiling Rose
      const canopy = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, 0.08, 32),
        new THREE.MeshStandardMaterial({ color: 0xfde68a, metalness: 0.95, roughness: 0.1 })
      );
      canopy.position.y = 4.4;
      chandelierGroup.add(canopy);

      // Minimalist Stainless Aircraft Cables
      const cablePositions = [-0.9, 0.9];
      cablePositions.forEach((cx) => {
        const cable = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.015, 4.4, 8),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
        );
        cable.position.set(cx, 2.2, 0);
        chandelierGroup.add(cable);
      });

      // Outer Halo Ring (Champagne Gold with Frosted Warm-White LED Light Diffuser)
      const outerRingFrame = new THREE.Mesh(
        new THREE.TorusGeometry(1.6, 0.06, 16, 64),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.15 })
      );
      outerRingFrame.rotation.x = Math.PI / 2;
      chandelierGroup.add(outerRingFrame);

      const outerRingLed = new THREE.Mesh(
        new THREE.TorusGeometry(1.6, 0.035, 16, 64),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xfff7ed,
          emissiveIntensity: 2.8,
        })
      );
      outerRingLed.rotation.x = Math.PI / 2;
      chandelierGroup.add(outerRingLed);

      // Inner Floating Halo Ring (Angled Sculptural Ring)
      const innerRingFrame = new THREE.Mesh(
        new THREE.TorusGeometry(1.0, 0.05, 16, 64),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.15 })
      );
      innerRingFrame.rotation.x = Math.PI / 2.3;
      innerRingFrame.position.y = -0.3;
      chandelierGroup.add(innerRingFrame);

      const innerRingLed = new THREE.Mesh(
        new THREE.TorusGeometry(1.0, 0.03, 16, 64),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xfff7ed,
          emissiveIntensity: 2.8,
        })
      );
      innerRingLed.rotation.x = Math.PI / 2.3;
      innerRingLed.position.y = -0.3;
      chandelierGroup.add(innerRingLed);

      // Crystal Center Sphere Drop
      const crystalCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 16, 16),
        new THREE.MeshPhysicalMaterial({
          color: 0xfffbeb,
          transmission: 0.9,
          roughness: 0.05,
          emissive: 0xffedd5,
          emissiveIntensity: 1.2,
        })
      );
      crystalCore.position.y = -0.15;
      chandelierGroup.add(crystalCore);

      // Bright Warm-White/Golden Luxury Light Source (castShadow = false prevents swinging point-light shadow strobing)
      const luxuryLight = new THREE.PointLight(0xfff5dd, 2.4, 30, 1.4);
      luxuryLight.position.y = -0.3;
      luxuryLight.castShadow = false;
      chandelierGroup.add(luxuryLight);

      // Soft Ambient Downlight Beam
      const downlightCone = new THREE.Mesh(
        new THREE.ConeGeometry(3.6, 9.0, 32, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xffedd5,
          transparent: true,
          opacity: 0.07,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      downlightCone.position.y = -4.5;
      chandelierGroup.add(downlightCone);

      scene.add(chandelierGroup);

      gsap.to(chandelierGroup.rotation, {
        z: 0.04,
        duration: 4.5 + Math.random(),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }

    createModernLuxuryChandelier(10, 9.5, 4);
    createModernLuxuryChandelier(-10, 9.5, 6);

    // 9. OPEN-FRONT ARCHITECTURAL BOOKCASE FULL OF HUNDREDS OF BOOKS (Buku yang Banyak & Terlihat Jelas!)
    // Positioned safely forward at z: -14.6 (44cm in front of chair rail & 50cm in front of wall, ZERO Z-fighting!)
    const bookcase = new THREE.Group();
    bookcase.position.set(13.2, 4.8, -14.6);

    // Slim Open-Front Framework (Back, sides, canopy, plinth — NOT A SOLID CUBE!)
    const woodCabinetMat = new THREE.MeshStandardMaterial({ color: 0x2e1d13, roughness: 0.65 });

    // Back Panel (Contained cleanly within bookcase frame, zero overlap with back wall)
    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(8.4, 9.6, 0.08), woodCabinetMat);
    backPanel.position.set(0, 0, -0.46);
    bookcase.add(backPanel);

    // Left Side Panel
    const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.2, 9.6, 1.0), woodCabinetMat);
    leftSide.position.set(-4.1, 0, 0);
    bookcase.add(leftSide);

    // Right Side Panel
    const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.2, 9.6, 1.0), woodCabinetMat);
    rightSide.position.set(4.1, 0, 0);
    bookcase.add(rightSide);

    // Center Vertical Divider
    const centerDivider = new THREE.Mesh(new THREE.BoxGeometry(0.16, 9.2, 0.95), woodCabinetMat);
    centerDivider.position.set(0, 0, 0);
    bookcase.add(centerDivider);

    // Top Crown Cornice
    const crownCornice = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.35, 1.15), islamicGoldMat);
    crownCornice.position.set(0, 4.8, 0.05);
    bookcase.add(crownCornice);

    // 4 Open Shelf Levels with Warm LED Strip & Packed Full of Books
    const bookColors = [
      0x881337, // Oxblood red leather
      0x064e3b, // Islamic forest green
      0x1e3a8a, // Midnight navy
      0xb45309, // Ochre gold leather
      0x312e81, // Royal indigo
      0x701a75, // Rich magenta
      0x14532d, // Emerald green
      0x78350f, // Antique teak
    ];

    const shelfLevels = [-3.0, -0.9, 1.2, 3.3];

    shelfLevels.forEach((sy, sIdx) => {
      // Golden Shelf Plank
      const shelfPlank = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.12, 0.95), islamicGoldMat);
      shelfPlank.position.set(0, sy, 0);
      bookcase.add(shelfPlank);

      // Warm LED Under-Shelf Light Strip
      const ledStrip = new THREE.Mesh(
        new THREE.BoxGeometry(7.8, 0.04, 0.06),
        new THREE.MeshBasicMaterial({ color: 0xfff3c4 })
      );
      ledStrip.position.set(0, sy - 0.06, 0.38);
      bookcase.add(ledStrip);

      // PACKED BOOKS: Left Bay (x: -3.8 to -0.2) and Right Bay (x: 0.2 to 3.8)
      const fillBay = (startX: number, endX: number) => {
        let currX = startX;
        while (currX < endX - 0.25) {
          const bW = 0.18 + Math.random() * 0.16;
          const bH = 1.2 + Math.random() * 0.45;
          const bD = 0.65 + Math.random() * 0.18;
          const bCol = bookColors[Math.floor(Math.random() * bookColors.length)];

          const bookMesh = new THREE.Mesh(
            new THREE.BoxGeometry(bW, bH, bD),
            new THREE.MeshStandardMaterial({ color: bCol, roughness: 0.5 })
          );
          bookMesh.position.set(currX + bW / 2, sy + bH / 2 + 0.06, 0.02);

          // Gold spine accent stripe
          const spineStripe = new THREE.Mesh(
            new THREE.BoxGeometry(bW * 0.9, 0.06, 0.02),
            islamicGoldMat
          );
          spineStripe.position.set(currX + bW / 2, sy + bH * 0.7 + 0.06, 0.02 + bD / 2 + 0.01);
          bookcase.add(spineStripe);

          // Occasional tilted book at end of bay
          if (currX > endX - 0.7 && Math.random() > 0.4) {
            bookMesh.rotation.z = -0.25;
            bookMesh.position.y -= 0.08;
          }

          bookcase.add(bookMesh);
          currX += bW + 0.02;
        }
      };

      fillBay(-3.85, -0.15);
      fillBay(0.15, 3.85);

      // Curated Special Ornaments on Shelves
      if (sIdx === 3) {
        const trophy = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 1.3, 8), islamicGoldMat);
        trophy.position.set(-2.0, sy + 0.7, 0.3);
        bookcase.add(trophy);
      } else if (sIdx === 2) {
        const sphereRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.45, 0.035, 12, 32),
          new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
        );
        sphereRing.position.set(2.0, sy + 0.6, 0.3);
        bookcase.add(sphereRing);
      } else if (sIdx === 1) {
        const certFrame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 0.06), islamicGoldMat);
        certFrame.position.set(-1.8, sy + 0.5, 0.3);
        bookcase.add(certFrame);
      }
    });

    scene.add(bookcase);

    // 10. MODERN LUXURY INDOOR DECORATIVE PLANTS (Tanaman Hias Mewah — NO ROTATING SOIL!)
    function createLuxuryHouseplant(x: number, z: number, type: 'monstera' | 'ficus') {
      const plantGroup = new THREE.Group();
      plantGroup.position.set(x, 0, z);

      // Fluted Matte White Nordic Ceramic Planter
      const planter = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 0.9, 2.2, 32),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
      );
      planter.position.y = 1.1;
      planter.castShadow = true;
      plantGroup.add(planter);

      // Polished Gold Pedestal Ring
      const goldRing = new THREE.Mesh(
        new THREE.CylinderGeometry(1.22, 1.22, 0.15, 32),
        islamicGoldMat
      );
      goldRing.position.y = 2.12;
      plantGroup.add(goldRing);

      // STATIC RICH SOIL (Tanah Statis Paten — Zero Rotation!)
      const staticSoil = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.15, 0.15, 24),
        new THREE.MeshStandardMaterial({ color: 0x1c120c, roughness: 0.98 })
      );
      staticSoil.position.y = 2.05;
      plantGroup.add(staticSoil);

      if (type === 'monstera') {
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.4 });

        const leafCount = 7;
        for (let i = 0; i < leafCount; i++) {
          const angle = (i * Math.PI * 2) / leafCount;
          const stemCurve = new THREE.Group();
          stemCurve.position.set(0, 2.1, 0);
          stemCurve.rotation.y = angle;

          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.8, 8), stemMat);
          stem.position.set(0.6, 1.2, 0);
          stem.rotation.z = -0.45;
          stemCurve.add(stem);

          const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 1.6), leafMat);
          leaf.position.set(1.4, 2.3, 0);
          leaf.rotation.x = 0.35;
          leaf.rotation.z = -0.55;
          stemCurve.add(leaf);

          plantGroup.add(stemCurve);
        }
      } else {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.22, 3.8, 12),
          new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 })
        );
        trunk.position.y = 3.6;
        plantGroup.add(trunk);

        const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.35 });
        for (let j = 0; j < 9; j++) {
          const ly = 2.8 + j * 0.35;
          const leafAngle = j * 1.2;
          const leafBranch = new THREE.Group();
          leafBranch.position.set(0, ly, 0);
          leafBranch.rotation.y = leafAngle;

          const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 1.3), leafMat);
          leaf.position.set(0.8, 0.1, 0);
          leaf.rotation.z = -0.3;
          leafBranch.add(leaf);

          plantGroup.add(leafBranch);
        }
      }

      scene.add(plantGroup);
    }

    createLuxuryHouseplant(-16.5, -13, 'monstera');
    createLuxuryHouseplant(16.5, 11, 'ficus');

    // 11. HOSPITALITY TEA LOUNGE (Arabian Dallah & Water Cooler)
    const loungeCredenza = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 1.8), woodTrimMat);
    loungeCredenza.position.set(-15.5, 0.9, 7.5);
    scene.add(loungeCredenza);

    const dallahGroup = new THREE.Group();
    dallahGroup.position.set(-15, 1.8, 7.5);

    const dallahBody = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 0.9, 16), islamicGoldMat);
    dallahBody.position.y = 0.45;
    dallahGroup.add(dallahBody);

    const dallahLid = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 16), islamicGoldMat);
    dallahLid.position.y = 1.1;
    dallahGroup.add(dallahLid);
    scene.add(dallahGroup);

    const coolerBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 1.2), deskWhiteMat);
    coolerBase.position.set(-17, 1.1, 7.5);
    scene.add(coolerBase);

    const waterBottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 1.2, 16),
      new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transmission: 0.8,
        roughness: 0.1,
      })
    );
    waterBottle.position.set(-17, 2.8, 7.5);
    scene.add(waterBottle);

    const sofa = new THREE.Mesh(
      new THREE.BoxGeometry(7, 1.2, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x094337, roughness: 0.75 })
    );
    sofa.position.set(-11, 0.6, 5);
    sofa.castShadow = true;
    scene.add(sofa);

    const sofaBack = new THREE.Mesh(
      new THREE.BoxGeometry(7, 1.8, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x094337, roughness: 0.75 })
    );
    sofaBack.position.set(-11, 1.5, 3.8);
    scene.add(sofaBack);

    // 12. DYNAMIC BIG BOARD (FAITHFUL REAL-TIME ZAKY DASHBOARD — CLICKABLE & INTERACTIVE!)
    const boardGroup = new THREE.Group();
    boardGroup.name = 'bigBoard';

    // Mounting Bezel Frame (Clean Depth Hierarchy: Frame at z: -15.4, Depth: 0.2)
    const screenFrame = new THREE.Mesh(
      new THREE.BoxGeometry(18.2, 9.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0b1329, roughness: 0.25, metalness: 0.6 })
    );
    screenFrame.position.set(0, 8.0, -15.4);
    screenFrame.castShadow = true;
    boardGroup.add(screenFrame);

    // High Resolution Dynamic Canvas (Single Plane placed safely in front at z: -15.18, 0.12 gap prevents any Z-fighting!)
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 2048;
    screenCanvas.height = 1024;
    bigBoardCanvasRef.current = screenCanvas;

    const screenTex = new THREE.CanvasTexture(screenCanvas);
    bigBoardTextureRef.current = screenTex;

    const screenFace = new THREE.Mesh(
      new THREE.PlaneGeometry(17.8, 8.8),
      new THREE.MeshBasicMaterial({ map: screenTex })
    );
    screenFace.name = 'bigBoard';
    screenFace.position.set(0, 8.0, -15.18);
    boardGroup.add(screenFace);
    scene.add(boardGroup);

    updateBigBoardDisplay();

    // 13. DISTINCT INDIVIDUAL FACES & BEAUTIFUL FEMALE RIG (Saksi Dewi)
    const batikTex = createBatikTexture();
    const batikMat = new THREE.MeshStandardMaterial({ map: batikTex, roughness: 0.6 });

    function buildArticulatedCharacter(
      id: string,
      charType: 'budi' | 'hari' | 'dewi' | 'rian',
      stationKey: string,
      homePos: THREE.Vector3,
      homeRotY: number
    ): CharacterRig {
      const charGroup = new THREE.Group();
      charGroup.name = stationKey;
      charGroup.position.copy(homePos);
      charGroup.rotation.y = homeRotY;

      // Unique skin tones per character (Saksi Dewi has radiant porcelain skin)
      const skinMat = new THREE.MeshStandardMaterial({
        color: charType === 'dewi' ? 0xfeebe0 : charType === 'hari' ? 0xe8bc96 : 0xf5cda7,
        roughness: charType === 'dewi' ? 0.38 : 0.55,
      });

      const torsoGroup = new THREE.Group();
      torsoGroup.position.y = 1.9;
      charGroup.add(torsoGroup);

      let torsoMat: THREE.Material;
      if (charType === 'budi') {
        torsoMat = primaryEmeraldMat;
      } else if (charType === 'hari') {
        torsoMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
      } else if (charType === 'dewi') {
        torsoMat = new THREE.MeshStandardMaterial({ color: 0xa7f3d0, roughness: 0.6 });
      } else {
        torsoMat = batikMat;
      }

      // Torso Mesh
      const torsoMesh = new THREE.Mesh(
        new THREE.BoxGeometry(charType === 'dewi' ? 0.76 : 0.85, 1.25, 0.45),
        torsoMat
      );
      torsoMesh.castShadow = true;
      torsoGroup.add(torsoMesh);

      if (charType === 'budi') {
        const lanyard = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.3, 0.05),
          new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        lanyard.position.set(0, -0.1, 0.25);
        torsoGroup.add(lanyard);
      } else if (charType === 'hari') {
        const tie = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.65, 0.04),
          new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.3 })
        );
        tie.position.set(0, 0.1, 0.24);
        torsoGroup.add(tie);
      } else if (charType === 'dewi') {
        // Gold Brooch Pin on Hijab
        const brooch = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), islamicGoldMat);
        brooch.position.set(0, 0.38, 0.26);
        torsoGroup.add(brooch);
      }

      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(charType === 'dewi' ? 0.12 : 0.14, 0.16, 0.3, 16),
        skinMat
      );
      neck.position.y = 0.75;
      torsoGroup.add(neck);

      const headGroup = new THREE.Group();
      headGroup.position.y = 1.05;
      torsoGroup.add(headGroup);

      // Distinct Sculpted Head
      const headMesh = new THREE.Mesh(new THREE.SphereGeometry(charType === 'dewi' ? 0.36 : 0.38, 24, 24), skinMat);
      headMesh.scale.set(charType === 'dewi' ? 0.88 : 0.9, 1.05, 0.95);
      headMesh.castShadow = true;
      headGroup.add(headMesh);

      // SAKSI DEWI: GORGEOUS, RADIANT FEMININE FACE & CLEAN HIJAB SYAR'I (Face 100% Unobscured & Beautiful)
      if (charType === 'dewi') {
        const hijabMat = new THREE.MeshStandardMaterial({
          color: 0x86efac, // Elegant light pastel mint-green
          roughness: 0.65,
        });

        // 1. HIJAB BACK & TOP COWL (Sits strictly behind the face, never covers facial features!)
        const hijabBackCowl = new THREE.Mesh(
          new THREE.SphereGeometry(0.39, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.62),
          hijabMat
        );
        hijabBackCowl.position.set(0, 0.06, -0.09);
        headGroup.add(hijabBackCowl);

        // 2. INNER HIJAB UNDERCAP (CIPUT) — Clean cream/white band framing the upper forehead
        const ciputBand = new THREE.Mesh(
          new THREE.TorusGeometry(0.33, 0.025, 12, 32, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 })
        );
        ciputBand.rotation.x = -Math.PI / 2.35;
        ciputBand.position.set(0, 0.23, 0.17);
        headGroup.add(ciputBand);

        // 3. ELEGANT HIJAB FACE-FRAMING SILHOUETTE (Frames cheeks & jaw like real Syar'i hijab)
        const hijabFaceRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.34, 0.045, 16, 32),
          hijabMat
        );
        hijabFaceRing.scale.set(0.92, 1.15, 0.45);
        hijabFaceRing.rotation.x = 0.22;
        hijabFaceRing.position.set(0, 0.02, 0.15);
        headGroup.add(hijabFaceRing);

        // 4. FLOWING HIJAB SHOULDER DRAPE (From under chin down over shoulders)
        const hijabShoulderDrape = new THREE.Mesh(
          new THREE.ConeGeometry(0.68, 0.82, 24, 1, true),
          hijabMat
        );
        hijabShoulderDrape.position.set(0, -0.42, 0.04);
        hijabShoulderDrape.rotation.x = 0.08;
        headGroup.add(hijabShoulderDrape);

        // 5. ISLAMIC GOLD & EMERALD BROOCH PIN ON HIJAB
        const brooch = new THREE.Mesh(
          new THREE.TorusGeometry(0.05, 0.015, 12, 24),
          islamicGoldMat
        );
        brooch.position.set(0.18, -0.26, 0.32);
        brooch.rotation.y = -0.25;
        headGroup.add(brooch);

        const broochGem = new THREE.Mesh(
          new THREE.SphereGeometry(0.028, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.1, metalness: 0.8 })
        );
        broochGem.position.set(0.18, -0.26, 0.33);
        headGroup.add(broochGem);

        // 6. CLEAR, RADIANT, UNCLIPPED FACIAL FEATURES
        const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0x603813 }); // Warm hazel brown
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x090503 }); // Deep pupil
        const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        [-0.125, 0.125].forEach((ex, idx) => {
          // Almond Eye Sclera (White)
          const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14), eyeWhiteMat);
          eyeWhite.scale.set(1.15, 0.88, 0.9);
          eyeWhite.position.set(ex, 0.05, 0.315);
          headGroup.add(eyeWhite);

          // Warm Hazel Iris
          const iris = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 14), irisMat);
          iris.scale.set(1.0, 0.95, 0.6);
          iris.position.set(ex, 0.05, 0.345);
          headGroup.add(iris);

          // Deep Pupil
          const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), pupilMat);
          pupil.position.set(ex, 0.05, 0.362);
          headGroup.add(pupil);

          // Sparkling Highlights (Star Catchlights)
          const shineMain = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), shineMat);
          shineMain.position.set(ex + 0.014, 0.068, 0.375);
          headGroup.add(shineMain);

          const shineSecondary = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), shineMat);
          shineSecondary.position.set(ex - 0.01, 0.035, 0.37);
          headGroup.add(shineSecondary);

          // Winged Curled Eyelashes
          const lash = new THREE.Mesh(
            new THREE.BoxGeometry(0.11, 0.018, 0.018),
            new THREE.MeshBasicMaterial({ color: 0x18181b })
          );
          lash.position.set(ex, 0.095, 0.335);
          lash.rotation.z = idx === 0 ? 0.22 : -0.22;
          headGroup.add(lash);

          // Soft Arched Eyebrow
          const brow = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.02, 0.018),
            new THREE.MeshBasicMaterial({ color: 0x451a03 })
          );
          brow.position.set(ex, 0.14, 0.32);
          brow.rotation.z = idx === 0 ? 0.12 : -0.12;
          headGroup.add(brow);
        });

        // Soft Translucent Rosy Pink Blush Cheeks
        const blushMat = new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.45 });
        [-0.165, 0.165].forEach((bx) => {
          const blush = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), blushMat);
          blush.scale.set(1.2, 0.6, 0.5);
          blush.position.set(bx, -0.045, 0.315);
          headGroup.add(blush);
        });

        // Dainty Sculpted Button Nose (Smooth, NO blocky box!)
        const cuteNose = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 12), skinMat);
        cuteNose.scale.set(0.9, 0.85, 1.25);
        cuteNose.position.set(0, 0.005, 0.355);
        headGroup.add(cuteNose);

        // Sweet Natural Rosy Lips (Warm natural smile, NOT protruding!)
        const upperLip = new THREE.Mesh(
          new THREE.BoxGeometry(0.10, 0.02, 0.025),
          new THREE.MeshBasicMaterial({ color: 0xe11d48 })
        );
        upperLip.position.set(0, -0.088, 0.335);
        headGroup.add(upperLip);

        const lowerLip = new THREE.Mesh(
          new THREE.SphereGeometry(0.03, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0xf43f5e })
        );
        lowerLip.scale.set(1.35, 0.6, 0.65);
        lowerLip.position.set(0, -0.106, 0.332);
        headGroup.add(lowerLip);

        // Turn head gracefully towards camera & office
        headGroup.rotation.y = 0.55;
        headGroup.rotation.x = -0.06;
      } else {
        // MALE AMILS: BUDI, HARI, RIAN
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
        [-0.13, 0.13].forEach((ex) => {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
          eye.position.set(ex, 0.04, 0.34);
          headGroup.add(eye);
        });

        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.08), skinMat);
        nose.position.set(0, 0, 0.38);
        headGroup.add(nose);

        if (charType === 'budi' || charType === 'hari') {
          const peci = new THREE.Mesh(
            new THREE.CylinderGeometry(0.39, 0.41, 0.35, 20),
            new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.95 })
          );
          peci.position.set(0, 0.32, 0);
          headGroup.add(peci);

          if (charType === 'hari') {
            // Executive Glasses
            const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.08), islamicGoldMat);
            glasses.position.set(0, 0.05, 0.36);
            headGroup.add(glasses);
          }
        } else {
          // Saksi Rian Hair & Glasses
          const hair = new THREE.Mesh(
            new THREE.SphereGeometry(0.41, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8),
            new THREE.MeshStandardMaterial({ color: 0x262626, roughness: 0.9 })
          );
          hair.position.set(0, 0.1, 0);
          headGroup.add(hair);

          const glasses = new THREE.Mesh(
            new THREE.BoxGeometry(0.46, 0.1, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
          );
          glasses.position.set(0, 0.05, 0.36);
          headGroup.add(glasses);
        }
      }

      // Articulated Arms
      const armMat = torsoMat;

      const leftArm = new THREE.Group();
      leftArm.position.set(charType === 'dewi' ? -0.46 : -0.52, 0.45, 0);
      torsoGroup.add(leftArm);

      const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.6, 12), armMat);
      leftUpperArm.position.y = -0.3;
      leftArm.add(leftUpperArm);

      const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.55, 12), armMat);
      leftForearm.position.y = -0.7;
      leftArm.add(leftForearm);

      const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), skinMat);
      leftHand.position.y = -1.0;
      leftArm.add(leftHand);

      const rightArm = new THREE.Group();
      rightArm.position.set(charType === 'dewi' ? 0.46 : 0.52, 0.45, 0);
      torsoGroup.add(rightArm);

      const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.6, 12), armMat);
      rightUpperArm.position.y = -0.3;
      rightArm.add(rightUpperArm);

      const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.55, 12), armMat);
      rightForearm.position.y = -0.7;
      rightArm.add(rightForearm);

      const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), skinMat);
      rightHand.position.y = -1.0;
      rightArm.add(rightHand);

      // Articulated Legs
      const pantMat = new THREE.MeshStandardMaterial({
        color: charType === 'dewi' ? 0x065f46 : 0x1e293b,
        roughness: 0.8,
      });
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });

      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.24, -0.6, 0);
      torsoGroup.add(leftLeg);

      const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.7, 12), pantMat);
      leftThigh.position.y = -0.35;
      leftLeg.add(leftThigh);

      const leftKnee = new THREE.Group();
      leftKnee.position.y = -0.7;
      leftLeg.add(leftKnee);

      const leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.65, 12), pantMat);
      leftCalf.position.y = -0.32;
      leftKnee.add(leftCalf);

      const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.36), shoeMat);
      leftShoe.position.set(0, -0.65, 0.06);
      leftKnee.add(leftShoe);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.24, -0.6, 0);
      torsoGroup.add(rightLeg);

      const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.7, 12), pantMat);
      rightThigh.position.y = -0.35;
      rightLeg.add(rightThigh);

      const rightKnee = new THREE.Group();
      rightKnee.position.y = -0.7;
      rightLeg.add(rightKnee);

      const rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.65, 12), pantMat);
      rightCalf.position.y = -0.32;
      rightKnee.add(rightCalf);

      const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.36), shoeMat);
      rightShoe.position.set(0, -0.65, 0.06);
      rightKnee.add(rightShoe);

      scene.add(charGroup);

      return {
        id,
        group: charGroup,
        torsoGroup,
        headGroup,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        leftKnee,
        rightKnee,
        homePos: homePos.clone(),
        homeRotY,
        currentWaypoint: null,
        walkPath: [],
        pathIndex: 0,
        isWalking: false,
        actionTimer: 0,
        walkPhase: Math.random() * Math.PI,
        standing: false,
        targetLookY: homeRotY,
      };
    }

    // 14. WORKSTATIONS BUILDER (CORRECT FORWARD SITTING LEGS & LAPTOPS)
    function buildWorkstation(
      x: number,
      z: number,
      ry: number,
      stationKey: string,
      charId: string,
      charType: 'budi' | 'hari' | 'dewi' | 'rian'
    ) {
      const stationGroup = new THREE.Group();
      stationGroup.name = stationKey;
      stationGroup.position.set(x, 0, z);
      stationGroup.rotation.y = ry;

      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.22, 2.3), deskWhiteMat);
      deskTop.position.set(0, 1.8, 0);
      deskTop.castShadow = true;
      stationGroup.add(deskTop);

      const legPositions = [
        [-2.0, 0.9, -0.95],
        [2.0, 0.9, -0.95],
        [-2.0, 0.9, 0.95],
        [2.0, 0.9, 0.95],
      ];
      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), islamicGoldMat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        stationGroup.add(leg);
      });

      // Sleek Ultra-Thin Executive Laptop
      const laptopGroup = new THREE.Group();
      laptopGroup.position.set(0, 1.92, -0.2);

      const laptopBase = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.04, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 })
      );
      laptopGroup.add(laptopBase);

      const keyboardPad = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.01, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
      );
      keyboardPad.position.set(0, 0.025, 0.1);
      laptopGroup.add(keyboardPad);

      const laptopLid = new THREE.Group();
      laptopLid.position.set(0, 0.02, -0.38);
      laptopLid.rotation.x = -0.35;

      const screenBack = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.78, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 })
      );
      screenBack.position.y = 0.39;
      laptopLid.add(screenBack);

      const screenPanel = new THREE.Mesh(
        new THREE.PlaneGeometry(1.14, 0.72),
        new THREE.MeshBasicMaterial({
          color: charType === 'budi' ? 0x10b981 : charType === 'hari' ? 0x38bdf8 : 0xf59e0b,
        })
      );
      screenPanel.position.set(0, 0.39, 0.018);
      laptopLid.add(screenPanel);

      laptopGroup.add(laptopLid);
      stationGroup.add(laptopGroup);

      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.25, 16), deskWhiteMat);
      mug.position.set(1.4, 2.05, 0.3);
      stationGroup.add(mug);

      // Ergonomic Swivel Task Chair
      const chairGroup = new THREE.Group();
      chairGroup.position.set(0, 0, 1.0);

      const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 1.2), primaryEmeraldMat);
      seatMesh.position.y = 1.1;
      seatMesh.castShadow = true;
      chairGroup.add(seatMesh);

      const backMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.15), primaryEmeraldMat);
      backMesh.position.set(0, 1.7, 0.55);
      backMesh.castShadow = true;
      chairGroup.add(backMesh);

      const chairStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1.0, 8),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
      );
      chairStem.position.y = 0.55;
      chairGroup.add(chairStem);

      stationGroup.add(chairGroup);

      // Position character seated on chair facing desk
      const charWorldZ = ry === 0 ? z + 1.0 : z - 1.0;
      const charWorldRotY = ry === 0 ? Math.PI : 0;
      const charWorldPos = new THREE.Vector3(x, 0, charWorldZ);

      const charRig = buildArticulatedCharacter(charId, charType, stationKey, charWorldPos, charWorldRotY);
      charactersRef.current[charId] = charRig;

      scene.add(stationGroup);
    }

    buildWorkstation(-8, -4, 0, 'pelayanan', 'budi', 'budi');
    buildWorkstation(-2, -4, 0, 'keuangan_hari', 'hari', 'hari');
    buildWorkstation(4, -4, 0, 'keuangan_dewi', 'dewi', 'dewi');
    buildWorkstation(-5, 4, Math.PI, 'kepegawaian', 'rian', 'rian');

    // 15. PAPAN SILANG HOLOGRAPHIC CONSENSUS HUB
    const hubGroup = new THREE.Group();
    hubGroup.name = 'networkHub';
    hubGroup.position.set(12, 0, 4);

    const platformBase = new THREE.Mesh(
      new THREE.CylinderGeometry(5.4, 5.6, 0.3, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 })
    );
    platformBase.position.y = 0.15;
    platformBase.receiveShadow = true;
    hubGroup.add(platformBase);

    const platformRing = new THREE.Mesh(
      new THREE.TorusGeometry(5.2, 0.08, 16, 64),
      islamicGoldMat
    );
    platformRing.rotation.x = Math.PI / 2;
    platformRing.position.y = 0.32;
    hubGroup.add(platformRing);

    const roundConsole = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.6, 1.4, 32),
      primaryEmeraldMat
    );
    roundConsole.position.y = 0.85;
    hubGroup.add(roundConsole);

    const holoCoreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.85,
    });
    const holoCore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85), holoCoreMat);
    holoCore.position.y = 3.0;
    hubGroup.add(holoCore);
    holoCoreRef.current = holoCore;

    const ringsGroup = new THREE.Group();
    ringsGroup.position.y = 3.0;

    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.04, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0xc8962e, emissive: 0xd97706, emissiveIntensity: 0.8 })
    );
    ringsGroup.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.04, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x059669, emissiveIntensity: 0.8 })
    );
    ring2.rotation.x = Math.PI / 3;
    ringsGroup.add(ring2);

    hubGroup.add(ringsGroup);
    holoRingsRef.current = ringsGroup;

    const sphereGeo = new THREE.SphereGeometry(0.42, 20, 20);
    const nodeA = new THREE.Mesh(
      sphereGeo,
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 1.0 })
    );
    nodeA.position.set(0, 4.4, 1.8);
    hubGroup.add(nodeA);

    const nodeB = new THREE.Mesh(
      sphereGeo,
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.0 })
    );
    nodeB.position.set(1.6, 4.4, -0.9);
    hubGroup.add(nodeB);

    const nodeC = new THREE.Mesh(
      sphereGeo,
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 1.0 })
    );
    nodeC.position.set(-1.6, 4.4, -0.9);
    hubGroup.add(nodeC);

    peerNodesRef.current = [nodeA, nodeB, nodeC];
    scene.add(hubGroup);

    // 16. RAYCASTING INTERACTION (Screen and Stations are fully Clickable!)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        let curr: THREE.Object3D | null = intersects[0].object;
        while (curr && curr !== scene) {
          if (curr.name === 'bigBoard') {
            // Clicked the Big Board Screen: Zoom to board and open interactive dashboard ledger drawer!
            switchCameraView('board');
            setSelectedStation(STATIONS.bigBoard);
            return;
          }
          if (curr.name && STATIONS[curr.name]) {
            const station = STATIONS[curr.name];
            setSelectedStation(station);

            // Trigger floating speech bubble directly above the clicked character's head
            const stationToChar: Record<string, { id: string; name: string }> = {
              pelayanan: { id: 'budi', name: 'Amil Budi' },
              keuangan_hari: { id: 'hari', name: 'Penyetuju Hari' },
              keuangan_dewi: { id: 'dewi', name: 'Saksi Dewi' },
              kepegawaian: { id: 'rian', name: 'Developer Rian' },
            };
            const mapped = stationToChar[curr.name];
            if (mapped) {
              triggerCharacterSpeech(mapped.id, mapped.name, station.speechText, 4800);
            }
            return;
          }
          curr = curr.parent;
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // 17. MAIN ANIMATION & WALKING LOOP (With 100% Correct Seated Leg Geometry!)
    let animationFrameId: number;
    const timer = new THREE.Timer();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      timer.update();
      if (!officeVisibleRef.current || document.hidden) {
        return;
      }
      const delta = Math.min(timer.getDelta(), 0.1);
      const elapsedTime = timer.getElapsed();

      // Spin Hologram in P2P Hub
      if (holoCoreRef.current) {
        holoCoreRef.current.rotation.y += 0.012;
        holoCoreRef.current.rotation.x = Math.sin(elapsedTime * 0.8) * 0.15;
      }
      if (holoRingsRef.current) {
        holoRingsRef.current.rotation.y -= 0.009;
        holoRingsRef.current.rotation.z = Math.cos(elapsedTime * 0.6) * 0.2;
      }
      peerNodesRef.current.forEach((node, idx) => {
        node.position.y = 4.4 + Math.sin(elapsedTime * 2 + idx * 1.5) * 0.15;
      });

      // Character Walking Engine & Posture Controller
      Object.values(charactersRef.current).forEach((rig) => {
        if (isPlayingCharacterRef.current && rig.id === controlledCharIdRef.current) {
          // PLAYER CONTROLLED LOCOMOTION
          let inX = (keysPressed.current.right ? 1 : 0) - (keysPressed.current.left ? 1 : 0) + joystickVector.current.x;
          let inY = (keysPressed.current.forward ? 1 : 0) - (keysPressed.current.backward ? 1 : 0) + joystickVector.current.y;

          const inputMag = Math.hypot(inX, inY);
          if (inputMag > 1) {
            inX /= inputMag;
            inY /= inputMag;
          }

          const isMoving = inputMag > 0.08;
          const isSprinting = keysPressed.current.sprint || isSprintingTouchRef.current;
          const speed = isSprinting ? 9.2 : 5.8;

          if (isMoving) {
            rig.standing = true;
            rig.isWalking = true;
            rig.walkPhase += delta * (isSprinting ? 14 : 9.5);

            // Screen-aligned isometric world projection
            const dirX = (inX - inY) * 0.7071;
            const dirZ = (-inX - inY) * 0.7071;

            const moveStep = speed * delta * Math.min(inputMag, 1);
            rig.group.position.x += dirX * moveStep;
            rig.group.position.z += dirZ * moveStep;

            // Room boundary limits
            rig.group.position.x = Math.max(-16.0, Math.min(16.0, rig.group.position.x));
            rig.group.position.z = Math.max(-13.0, Math.min(13.0, rig.group.position.z));

            // Smooth yaw interpolation
            const targetYaw = Math.atan2(dirX, dirZ);
            let angleDiff = targetYaw - rig.group.rotation.y;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            rig.group.rotation.y += angleDiff * 0.22;

            // Walking & running limb cycles
            const swingAmp = isSprinting ? 0.85 : 0.62;
            const legSwing = Math.sin(rig.walkPhase) * swingAmp;
            rig.leftLeg.rotation.x = legSwing;
            rig.rightLeg.rotation.x = -legSwing;

            rig.leftKnee.rotation.x = legSwing < 0 ? -legSwing * 0.9 : 0;
            rig.rightKnee.rotation.x = legSwing > 0 ? legSwing * 0.9 : 0;

            rig.leftArm.rotation.x = -legSwing * 0.6;
            rig.rightArm.rotation.x = legSwing * 0.6;

            rig.torsoGroup.position.y = 1.9 + Math.abs(Math.sin(rig.walkPhase)) * 0.1;
            rig.group.rotation.z = Math.sin(rig.walkPhase) * 0.025;
          } else {
            rig.isWalking = false;
            const distHome = rig.group.position.distanceTo(rig.homePos);
            if (distHome < 0.75) {
              // Seated at desk
              rig.standing = false;
              rig.torsoGroup.position.y = 1.45;
              rig.group.rotation.z = 0;
              rig.group.rotation.y = THREE.MathUtils.lerp(rig.group.rotation.y, rig.homeRotY, 0.1);

              rig.leftLeg.rotation.x = -Math.PI / 2.1;
              rig.rightLeg.rotation.x = -Math.PI / 2.1;
              rig.leftKnee.rotation.x = Math.PI / 2.1;
              rig.rightKnee.rotation.x = Math.PI / 2.1;

              const typeWiggle = Math.sin(elapsedTime * 4) * 0.08;
              rig.leftArm.rotation.x = -Math.PI / 4.2 + typeWiggle;
              rig.rightArm.rotation.x = -Math.PI / 4.2 - typeWiggle;
              rig.headGroup.rotation.x = Math.sin(elapsedTime * 1.5) * 0.05;
            } else {
              // Idle standing
              rig.standing = true;
              rig.torsoGroup.position.y = 1.9 + Math.sin(elapsedTime * 2.5) * 0.02;
              rig.group.rotation.z = 0;
              rig.leftLeg.rotation.x = 0;
              rig.rightLeg.rotation.x = 0;
              rig.leftKnee.rotation.x = 0;
              rig.rightKnee.rotation.x = 0;
              rig.leftArm.rotation.x = -0.2 + Math.sin(elapsedTime * 1.5) * 0.05;
              rig.rightArm.rotation.x = -0.2 - Math.sin(elapsedTime * 1.5) * 0.05;
              rig.headGroup.rotation.x = Math.sin(elapsedTime * 1.2) * 0.03;
            }
          }

          // Camera Follow
          if (followCameraRef.current) {
            controls.target.x = THREE.MathUtils.lerp(controls.target.x, rig.group.position.x, 0.08);
            controls.target.z = THREE.MathUtils.lerp(controls.target.z, rig.group.position.z, 0.08);
            camera.position.x = controls.target.x + 35;
            camera.position.z = controls.target.z + 33;
          }

          // Check proximity to interactive stations
          let closestStation: ProximityStation | null = null;
          let minDist = Infinity;
          for (const st of INTERACTIVE_STATIONS) {
            const sPos = new THREE.Vector3(...st.pos);
            const d = rig.group.position.distanceTo(sPos);
            if (d < st.radius && d < minDist) {
              minDist = d;
              closestStation = st;
            }
          }

          if (closestStation?.id !== activeNearStationRef.current?.id) {
            activeNearStationRef.current = closestStation;
            setActiveNearStation(closestStation);
          }
        } else {
          // NPC AUTONOMOUS BEHAVIOR
          if (rig.isWalking && rig.currentWaypoint) {
            rig.standing = true;
            rig.walkPhase += delta * 7.5;

            const toTarget = new THREE.Vector3().subVectors(rig.currentWaypoint, rig.group.position);
            toTarget.y = 0;
            const dist = toTarget.length();

            if (dist > 0.15) {
              toTarget.normalize();
              const step = Math.min(dist, 2.6 * delta);
              rig.group.position.addScaledVector(toTarget, step);

              const targetYaw = Math.atan2(toTarget.x, toTarget.z);
              rig.group.rotation.y = THREE.MathUtils.lerp(rig.group.rotation.y, targetYaw, 0.15);

              const legSwing = Math.sin(rig.walkPhase) * 0.6;
              rig.leftLeg.rotation.x = legSwing;
              rig.rightLeg.rotation.x = -legSwing;

              rig.leftKnee.rotation.x = legSwing < 0 ? -legSwing * 0.85 : 0;
              rig.rightKnee.rotation.x = legSwing > 0 ? legSwing * 0.85 : 0;

              rig.leftArm.rotation.x = -legSwing * 0.55;
              rig.rightArm.rotation.x = legSwing * 0.55;

              rig.torsoGroup.position.y = 1.9 + Math.abs(Math.sin(rig.walkPhase)) * 0.08;
              rig.group.rotation.z = Math.sin(rig.walkPhase) * 0.02;
            } else {
              rig.pathIndex++;
              if (rig.pathIndex < rig.walkPath.length) {
                rig.currentWaypoint = rig.walkPath[rig.pathIndex];
              } else {
                rig.isWalking = false;
                rig.currentWaypoint = null;

                const distHome = rig.group.position.distanceTo(rig.homePos);
                if (distHome < 0.8) {
                  rig.standing = false;
                  rig.group.position.copy(rig.homePos);
                  rig.group.rotation.y = rig.homeRotY;
                }
              }
            }
          } else {
            if (!rig.standing) {
              rig.torsoGroup.position.y = 1.45;
              rig.group.rotation.z = 0;
              rig.group.rotation.y = rig.homeRotY;

              rig.leftLeg.rotation.x = -Math.PI / 2.1;
              rig.rightLeg.rotation.x = -Math.PI / 2.1;
              rig.leftKnee.rotation.x = Math.PI / 2.1;
              rig.rightKnee.rotation.x = Math.PI / 2.1;

              const typeWiggle = Math.sin(elapsedTime * 4 + rig.walkPhase) * 0.08;
              rig.leftArm.rotation.x = -Math.PI / 4.2 + typeWiggle;
              rig.rightArm.rotation.x = -Math.PI / 4.2 - typeWiggle;

              rig.headGroup.rotation.x = Math.sin(elapsedTime * 1.5 + rig.walkPhase) * 0.05;
              if (rig.id === 'dewi') {
                rig.headGroup.rotation.y = 0.55 + Math.sin(elapsedTime * 1.0) * 0.04;
              } else if (rig.id === 'budi') {
                rig.headGroup.rotation.y = 0.25 + Math.sin(elapsedTime * 0.9) * 0.03;
              } else if (rig.id === 'hari') {
                rig.headGroup.rotation.y = 0.15 + Math.sin(elapsedTime * 0.8) * 0.03;
              }
            } else {
              rig.torsoGroup.position.y = 1.9;
              rig.leftLeg.rotation.x = 0;
              rig.rightLeg.rotation.x = 0;
              rig.leftKnee.rotation.x = 0;
              rig.rightKnee.rotation.x = 0;

              rig.leftArm.rotation.x = -0.3;
              rig.rightArm.rotation.x = -0.6 + Math.sin(elapsedTime * 2) * 0.1;
              rig.headGroup.rotation.y = Math.sin(elapsedTime * 1.2) * 0.15;
            }
          }
        }
      });

      // Update 3D Floating Player Crystal Marker (Only visible when player is controlling character)
      const controlledRig = charactersRef.current[controlledCharIdRef.current];
      if (isPlayingCharacterRef.current && controlledRig && playerMarkerRef.current) {
        playerMarkerRef.current.visible = true;
        playerMarkerRef.current.position.set(
          controlledRig.group.position.x,
          controlledRig.torsoGroup.position.y + 1.85 + Math.sin(elapsedTime * 3.5) * 0.1,
          controlledRig.group.position.z
        );
        playerMarkerRef.current.rotation.y += delta * 2.5;
      } else if (playerMarkerRef.current) {
        playerMarkerRef.current.visible = false;
      }

      // Update Floating Speech Bubble position directly above the speaking character's head in real time
      if (activeSpeechRef.current && speechBubbleRef.current && containerRef.current) {
        if (Date.now() > activeSpeechRef.current.expireTime) {
          activeSpeechRef.current = null;
          setActiveSpeech(null);
        } else {
          const speakerId = activeSpeechRef.current.charId;
          const rig = charactersRef.current[speakerId];
          if (rig) {
            const headPos = new THREE.Vector3();
            rig.headGroup.getWorldPosition(headPos);
            headPos.y += 0.95; // Positioned right above the character's head

            headPos.project(camera);

            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;

            const screenX = ((headPos.x + 1) * w) / 2;
            const screenY = ((-headPos.y + 1) * h) / 2;

            const isVisible =
              headPos.z < 1.0 &&
              screenX >= -120 &&
              screenX <= w + 120 &&
              screenY >= -120 &&
              screenY <= h + 120;

            if (isVisible) {
              speechBubbleRef.current.style.opacity = '1';
              speechBubbleRef.current.style.transform = `translate3d(calc(${screenX}px - 50%), calc(${screenY}px - 100%), 0)`;
            } else {
              speechBubbleRef.current.style.opacity = '0';
            }
          }
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 18. RESIZE OBSERVER
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      if (w === 0 || h === 0) return;

      const asp = w / h;
      const adaptiveD = asp >= 1.6 ? 14.5 : (asp >= 1.0 ? 17.0 : 20.0 / asp);
      camera.left = -adaptiveD * asp;
      camera.right = adaptiveD * asp;
      camera.top = adaptiveD;
      camera.bottom = -adaptiveD;
      camera.updateProjectionMatrix();

      controls.target.set(0, 4.0, -1.5);
      controls.update();

      renderer.setSize(w, h, true);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (officeVisObserver) {
        officeVisObserver.disconnect();
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      controls.dispose();
      renderer.dispose();
      rendererRef.current = null;
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglFailed) {
    return (
      <div className="relative w-full h-[420px] rounded-2xl border border-neutral-300 bg-[#F7F4ED] flex flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="z-eyebrow text-primary-700">Mode 3D Tidak Tersedia</p>
        <h3 className="z-display-3 text-neutral-900">Kantor virtual butuh WebGL2</h3>
        <p className="text-sm text-neutral-600 max-w-md leading-relaxed">
          Browser atau perangkat ini tidak dapat menjalankan tampilan 3D. Mode standar dasbor tetap
          berfungsi penuh untuk seluruh pekerjaan amil.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="z-touch mt-2 inline-flex items-center px-6 rounded-full bg-primary-800 hover:bg-primary-700 text-white text-sm font-bold cursor-pointer"
        >
          Kembali ke Mode Standar
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`overflow-hidden bg-[#f3efe3] ${
        isFullscreen
          ? 'fixed inset-0 z-[100] w-full h-full min-h-screen rounded-none'
          : 'relative z-0 w-full h-[600px] sm:h-[660px] rounded-2xl shadow-2xl border border-neutral-300'
      }`}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      />

      {/* FLOATING SPEECH BUBBLE DIRECTLY ABOVE CHARACTER'S HEAD */}
      {activeSpeech && (
        <div
          ref={speechBubbleRef}
          className="absolute left-0 top-0 z-40 pointer-events-none transition-opacity duration-150"
          style={{ willChange: 'transform', transform: 'translate3d(-9999px, -9999px, 0)' }}
        >
          <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-[0_4px_18px_-2px_rgba(0,0,0,0.12)] px-3.5 py-2 rounded-2xl flex items-center gap-2.5 max-w-[240px] min-[400px]:max-w-xs sm:max-w-sm text-xs font-semibold text-neutral-900">
            <span className="text-base shrink-0">💬</span>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-primary-700 block leading-tight">
                {activeSpeech.actor}:
              </span>
              <span className="text-[11px] leading-tight text-neutral-800 font-medium block">
                {activeSpeech.text}
              </span>
            </div>
          </div>
          {/* Downward indicator pointer aimed straight at character's head */}
          <div className="w-2.5 h-2.5 bg-white/95 border-r border-b border-neutral-200/90 transform rotate-45 mx-auto -mt-1.5 shadow-xs" />
        </div>
      )}

      {/* TOP FLOATING HUD BAR */}
      <div
        className={`absolute inset-x-0 pointer-events-none z-30 transition-all duration-300 ${
          isFullscreen
            ? 'top-3 sm:top-6 px-3 sm:px-8'
            : 'top-2 sm:top-4 px-2 sm:px-4'
        }`}
      >
        <div className="relative w-full flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Left: Identity Badge (Responsive for mobile & tablet) */}
          <div className={`pointer-events-auto bg-white/95 backdrop-blur-md border border-neutral-200/90 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl items-center gap-2 sm:gap-3 shadow-xs shrink-0 ${isPlayingCharacter ? 'hidden min-[500px]:flex' : 'flex'}`}>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-700 text-white flex items-center justify-center font-bold text-xs border border-primary-800 shadow-xs shrink-0">
              <ZakyLogo size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="font-bold text-neutral-900 text-xs sm:text-sm">
                  <span className="hidden sm:inline">Zaky Virtual HQ</span>
                  <span className="sm:hidden">Virtual HQ</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-300/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  <span className="hidden xs:inline">Live</span>
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-neutral-600 font-mono hidden md:block">
                Pusat Kendali Amil & Ledger FR-03
              </p>
            </div>
          </div>

          {/* Center: Camera Transitions — Desktop Only (xl:flex) to prevent collisions on tablet/mobile */}
          <div className="pointer-events-auto hidden xl:flex absolute left-1/2 -translate-x-1/2 items-center bg-white/95 backdrop-blur-md border border-neutral-200/90 p-1 rounded-xl text-xs shadow-xs">
            {[
              { id: 'all', label: 'Semua Ruangan', icon: Layers },
              { id: 'desks', label: 'Meja Amil', icon: Users },
              { id: 'board', label: 'Layar', icon: Activity },
              { id: 'network', label: 'Hub Jaringan', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchCameraView(tab.id as any)}
                  className={`h-7.5 flex items-center gap-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-700 text-white border border-primary-800 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 border border-transparent'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-white' : 'text-neutral-500'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Play Character Action Button, Fullscreen & Mode Switcher */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Play Character Action Button */}
            {!isPlayingCharacter ? (
              <button
                type="button"
                onClick={handleStartPlaying}
                className="h-8 sm:h-9 px-2.5 sm:px-4 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs border border-primary-800 transition-all cursor-pointer whitespace-nowrap transform hover:scale-105 active:scale-95"
                title={`Mulai mainkan karakter ${getCharName(controlledCharId)}`}
              >
                <Gamepad2 size={14} />
                <span className="hidden sm:inline">Mulai: {getCharName(controlledCharId)}</span>
                <span className="sm:hidden">Main</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-emerald-950/95 text-white backdrop-blur-md px-2 sm:px-2.5 py-1 rounded-xl text-xs border border-emerald-500/50 shadow-xs whitespace-nowrap h-8 sm:h-9">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="font-bold text-[11px] hidden md:inline">{getCharName(controlledCharId)}</span>
                <button
                  type="button"
                  onClick={() => setFollowCamera((prev) => !prev)}
                  title={followCamera ? 'Kamera Mengikuti Karakter (Aktif)' : 'Kamera Bebas (Manual)'}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    followCamera ? 'bg-emerald-700 text-white' : 'bg-emerald-900 text-neutral-300'
                  }`}
                >
                  <Crosshair size={11} />
                  <span className="hidden lg:inline">{followCamera ? 'Ikuti' : 'Bebas'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleStopPlaying}
                  className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Kembali ke Pantau Otomatis"
                >
                  <RotateCcw size={11} />
                  <span>Keluar</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white/95 backdrop-blur-md border border-neutral-200 hover:border-neutral-300 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0"
              title={isFullscreen ? 'Keluar Fullscreen (Esc)' : 'Layar Penuh'}
              aria-label={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            <button
              onClick={onClose}
              className="h-8 sm:h-9 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-semibold text-xs shadow-xs transition-all cursor-pointer shrink-0"
              title="Kembali ke Mode Standar (2D)"
            >
              <LayoutDashboard size={14} className="text-primary-700 shrink-0" />
              <span className="hidden md:inline">Mode Standar</span>
              <X size={13} className="text-neutral-400 hidden sm:inline ml-0.5" />
            </button>
          </div>
        </div>

        {/* Sub-bar for Camera Views on Mobile / Tablet (< xl) — Positioned cleanly without overlapping */}
        <div className="xl:hidden pointer-events-auto flex justify-center mt-2 px-1">
          <div className="flex items-center bg-white/95 backdrop-blur-md border border-neutral-200/90 p-1 rounded-xl text-xs shadow-md max-w-full overflow-x-auto gap-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: 'all', label: 'Semua', icon: Layers },
              { id: 'desks', label: 'Meja', icon: Users },
              { id: 'board', label: 'Layar', icon: Activity },
              { id: 'network', label: 'Hub', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchCameraView(tab.id as any)}
                  className={`h-7 flex items-center gap-1 px-2 sm:px-3 rounded-lg font-semibold text-[11px] sm:text-xs transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-700 text-white border border-primary-800 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 border border-transparent'
                  }`}
                >
                  <Icon size={12} className={isActive ? 'text-white' : 'text-neutral-500'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MOBILE COMPACT TRIGGER (md:hidden) — Discreet floating pill to preserve 3D office view */}
      <div
        className={`md:hidden pointer-events-auto absolute z-30 transition-all duration-300 ${
          isFullscreen ? 'top-26 right-2 sm:right-4' : 'top-24 right-2 sm:right-4'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsQuestListExpanded(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-md hover:bg-neutral-50 active:scale-95 transition-all text-xs cursor-pointer select-none"
          title="Buka Misi Harian Amil"
        >
          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Award size={12} />
          </span>
          <span className="text-[11px] font-bold text-neutral-900">
            Misi {Object.values(completedTasks).filter(Boolean).length}/7
          </span>
          <span className="text-[10px] font-bold text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/60">
            {integrityScore}%
          </span>
          <ChevronDown size={13} className="text-neutral-400" />
        </button>
      </div>

      {/* MOBILE BOTTOM SHEET MODAL (md:hidden) — Elegant drawer layout for phone screens */}
      {isQuestListExpanded && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-neutral-950/45 backdrop-blur-xs animate-in fade-in duration-200 pointer-events-auto">
          {/* Backdrop click to dismiss */}
          <div
            className="absolute inset-0"
            onClick={() => setIsQuestListExpanded(false)}
            aria-label="Tutup overlay misi"
          />

          <div className="relative z-10 bg-white rounded-t-3xl border-t border-neutral-200/90 shadow-2xl p-4 max-h-[82vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Drawer Handle */}
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mb-3 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 leading-tight">Misi Harian Amil</h4>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    {Object.values(completedTasks).filter(Boolean).length}/7 Tugas Diselesaikan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestListExpanded(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Tutup Misi Harian"
              >
                <X size={16} />
              </button>
            </div>

            {/* Integrity Score Progress Bar */}
            <div className="py-2.5 border-b border-neutral-100 space-y-1.5 shrink-0">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-700 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  Integritas Syariah
                </span>
                <span className="text-emerald-700 font-bold font-mono">{integrityScore}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/60">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${integrityScore}%` }}
                />
              </div>
            </div>

            {/* Missions List */}
            <div className="flex-1 overflow-y-auto py-2.5 space-y-2 pr-0.5">
              {INTERACTIVE_STATIONS.map((st) => {
                const isDone = completedTasks[st.id];
                return (
                  <div
                    key={st.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                      isDone
                        ? 'bg-emerald-50/70 border-emerald-200/70 text-emerald-950'
                        : 'bg-neutral-50/80 border-neutral-200/80 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-neutral-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`text-xs font-bold block truncate leading-tight ${
                            isDone ? 'line-through text-emerald-800' : 'text-neutral-900'
                          }`}
                        >
                          {st.taskTitle}
                        </span>
                        <span className="text-[11px] text-neutral-500 block truncate">
                          {st.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuestListExpanded(false);
                          navigateToStation(st);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-neutral-200 text-neutral-700 active:bg-neutral-100 shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <Footprints size={11} />
                        <span>Pergi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuestListExpanded(false);
                          setActiveTaskModal(st);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold shadow-2xs cursor-pointer ${
                          isDone
                            ? 'bg-emerald-600 active:bg-emerald-700 text-white'
                            : 'bg-primary-700 active:bg-primary-800 text-white'
                        }`}
                      >
                        {isDone ? 'Ulang' : 'Buka'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TABLET & DESKTOP FLOATING HUD (hidden md:block) — Flexible width and collapsible */}
      <div
        className={`hidden md:block absolute pointer-events-auto transition-all duration-300 z-30 ${
          isFullscreen
            ? 'top-[7.5rem] xl:top-24 right-4 lg:right-6 w-72 lg:w-80'
            : 'top-[7rem] xl:top-20 right-3 lg:right-6 w-72 lg:w-80'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-2xl shadow-lg p-3 lg:p-3.5 space-y-2.5">
          {/* Header */}
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setIsQuestListExpanded((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Award size={14} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-neutral-900 leading-tight">Misi Harian Amil</h4>
                <p className="text-[10px] text-neutral-500 font-mono">
                  {Object.values(completedTasks).filter(Boolean).length}/7 Tugas Diselesaikan
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsQuestListExpanded((prev) => !prev);
              }}
              className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 cursor-pointer transition-colors"
              title={isQuestListExpanded ? 'Perkecil Misi' : 'Buka Daftar Misi'}
            >
              {isQuestListExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Integrity Score Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-semibold">
              <span className="text-neutral-600 flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-600" />
                Integritas Syariah
              </span>
              <span className="text-emerald-700 font-bold font-mono">{integrityScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/60">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${integrityScore}%` }}
              />
            </div>
          </div>

          {/* Collapsible Station Tasks List */}
          {isQuestListExpanded && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 pt-1 border-t border-neutral-100 text-xs">
              {INTERACTIVE_STATIONS.map((st) => {
                const isDone = completedTasks[st.id];
                return (
                  <div
                    key={st.id}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      isDone
                        ? 'bg-emerald-50/70 border-emerald-200/70 text-emerald-950'
                        : 'bg-neutral-50/70 border-neutral-200/70 text-neutral-800 hover:bg-neutral-100/70'
                    }`}
                  >
                    <div className="flex items-start gap-2 overflow-hidden">
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-neutral-300" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <span
                          className={`text-[11px] font-bold block truncate leading-tight ${
                            isDone ? 'line-through text-emerald-800' : 'text-neutral-900'
                          }`}
                        >
                          {st.taskTitle}
                        </span>
                        <span className="text-[10px] text-neutral-500 block truncate">
                          {st.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => navigateToStation(st)}
                        title="Pergi ke stasiun ini"
                        className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 shadow-2xs cursor-pointer flex items-center gap-0.5"
                      >
                        <Footprints size={10} />
                        <span>Pergi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTaskModal(st)}
                        title="Buka tugas stasiun"
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-2xs cursor-pointer ${
                          isDone
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-primary-700 hover:bg-primary-800 text-white'
                        }`}
                      >
                        {isDone ? 'Ulang' : 'Buka'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MINECRAFT PE STYLE VIRTUAL ANALOG CONTROLLER (Hanya muncul saat Mode Kendali Aktif!) */}
      {isPlayingCharacter && (
        <div
          className={`absolute pointer-events-auto transition-all duration-300 z-30 animate-in fade-in zoom-in-95 duration-200 ${
            isFullscreen
              ? 'bottom-8 sm:bottom-10 left-6 sm:left-12'
              : 'bottom-4 left-4'
          }`}
        >
          <div className="flex items-end gap-3 select-none">
            {/* Minecraft PE Analog Touch Disk Base */}
            <div className="flex flex-col items-center gap-1">
              <div
                ref={joystickBaseRef}
                onPointerDown={handleJoystickPointerDown}
                onPointerMove={handleJoystickPointerMove}
                onPointerUp={handleJoystickPointerUp}
                onPointerCancel={handleJoystickPointerUp}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-neutral-900/40 backdrop-blur-md border-2 border-white/40 shadow-2xl relative flex items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing"
              >
                {/* Subtle directional indicators like Minecraft PE */}
                <div className="absolute top-1.5 text-white/60 text-[10px] pointer-events-none font-bold">▲</div>
                <div className="absolute bottom-1.5 text-white/60 text-[10px] pointer-events-none font-bold">▼</div>
                <div className="absolute left-2 text-white/60 text-[10px] pointer-events-none font-bold">◀</div>
                <div className="absolute right-2 text-white/60 text-[10px] pointer-events-none font-bold">▶</div>

                {/* Center crosshair dot */}
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 pointer-events-none" />

                {/* Floating Analog Knob (Thumbstick) */}
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-white to-neutral-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] border-2 border-emerald-600/80 flex items-center justify-center text-primary-900 absolute pointer-events-none transition-transform will-change-transform"
                  style={{
                    transform: `translate3d(${joystickKnobPos.x}px, ${joystickKnobPos.y}px, 0)`,
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-emerald-600/20 border border-emerald-600/50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                  </div>
                </div>
              </div>

              {/* Desktop keyboard hint */}
              <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-900/60 backdrop-blur-xs text-[9px] text-white/80 font-mono">
                <span>WASD / Analog Touch</span>
              </div>
            </div>

            {/* Sprint & Task Action buttons (Minecraft Style) */}
            <div className="flex flex-col gap-2 pb-1">
              {/* Sprint Button */}
              <button
                type="button"
                onClick={() => {
                  const next = !isSprintingTouch;
                  setIsSprintingTouch(next);
                  isSprintingTouchRef.current = next;
                }}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex flex-col items-center justify-center font-bold text-[9px] shadow-lg border backdrop-blur-md transition-all cursor-pointer ${
                  isSprintingTouch
                    ? 'bg-amber-500 text-white border-amber-400 ring-2 ring-amber-300 animate-pulse'
                    : 'bg-neutral-900/50 hover:bg-neutral-900/70 text-white/90 border-white/30'
                }`}
                title="Lari Cepat (Shift)"
              >
                <Zap size={14} className={isSprintingTouch ? 'fill-white' : ''} />
                <span>{isSprintingTouch ? 'LARI' : 'JALAN'}</span>
              </button>

              {/* Proximity Action Button if near station */}
              {activeNearStation && (
                <button
                  type="button"
                  onClick={() => setActiveTaskModal(activeNearStation)}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex flex-col items-center justify-center font-bold text-[9px] shadow-lg border border-primary-400 ring-2 ring-primary-300 animate-bounce cursor-pointer"
                  title="Kerjakan Tugas (E)"
                >
                  <span className="text-xs font-mono font-bold">E</span>
                  <span>TUGAS</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PROXIMITY ACTION BAR (When Player is Near Station & Playing) */}
      {isPlayingCharacter && activeNearStation && !activeTaskModal && (
        <div className="absolute bottom-[10.5rem] sm:bottom-24 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto max-w-[calc(100vw-2rem)]">
          <button
            onClick={() => setActiveTaskModal(activeNearStation)}
            className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs sm:text-sm shadow-xl border border-primary-600 transition-all cursor-pointer transform hover:scale-105 active:scale-95 max-w-full"
          >
            <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-mono text-xs border border-white/30 shrink-0">
              E
            </span>
            <div className="text-left min-w-0">
              <span className="text-[10px] text-primary-200 block uppercase tracking-wider font-semibold truncate">
                {activeNearStation.name}
              </span>
              <span className="block leading-tight line-clamp-2">{activeNearStation.taskTitle}</span>
            </div>
            <ChevronRight size={16} className="text-primary-200 ml-1 shrink-0" />
          </button>
        </div>
      )}

      {/* REALTIME TOAST POPUP */}
      {latestToast && (
        <div
          className={`absolute z-40 max-w-[calc(100vw-2rem)] sm:max-w-sm pointer-events-auto animate-in slide-in-from-bottom duration-200 transition-all ${
            isFullscreen
              ? 'bottom-24 sm:bottom-28 right-6 sm:right-12'
              : 'bottom-16 right-4'
          }`}
        >
          <div className="liquid-glass-panel p-3.5 rounded-2xl border border-emerald-500/50 shadow-2xl flex items-start gap-3 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping mt-1 flex-shrink-0" />
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-neutral-900">{latestToast.actor}</span>
                <span className="text-[10px] text-neutral-500 font-mono">{latestToast.time}</span>
              </div>
              <p className="text-neutral-700 text-[11px] leading-relaxed">{latestToast.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM TICKER HUD */}
      <div
        className={`absolute flex items-center justify-between gap-3 pointer-events-none transition-all duration-300 z-30 ${
          isPlayingCharacter
            ? isFullscreen
              ? 'bottom-8 sm:bottom-10 left-48 sm:left-56 right-6 sm:right-12'
              : 'bottom-4 left-44 sm:left-48 right-4'
            : isFullscreen
            ? 'bottom-8 sm:bottom-10 left-6 sm:left-12 right-6 sm:right-12'
            : 'bottom-4 left-4 right-4'
        }`}
      >
        <div className="pointer-events-auto w-full sm:max-w-xl liquid-glass-panel px-4 py-2 rounded-2xl flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary-700 shrink-0">
            <Clock size={14} />
            <span>AKTIVITAS:</span>
          </div>
          <div className="flex-1 overflow-hidden text-xs text-neutral-800 font-medium truncate">
            <span>
              {isPlayingCharacter
                ? `Mode Kendali Aktif: Anda mengendalikan ${getCharName(controlledCharId)}. Jelajahi kantor & kerjakan tugas!`
                : 'Pantau Otomatis Aktif: Para amil beraktivitas mandiri. Klik tombol "Mulai" untuk mengendalikan karakter akun Anda.'}
            </span>
          </div>
        </div>

        <div className="pointer-events-auto hidden sm:flex items-center gap-2 liquid-glass-btn px-3.5 py-1.5 rounded-xl text-[11px] font-semibold text-neutral-800 shadow-sm">
          <ZakyLogo size={15} />
          <span>Kantor Virtual 3D HD • {isPlayingCharacter ? 'Mode Kendali Amil' : 'Pantau Otomatis'}</span>
        </div>
      </div>

      {/* INTERACTIVE TASK MODAL DIALOG */}
      {activeTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200/90 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-primary-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl">
                  {activeTaskModal.id === 'pelayanan' && '💰'}
                  {activeTaskModal.id === 'keuangan_hari' && '✍️'}
                  {activeTaskModal.id === 'keuangan_dewi' && '🛡️'}
                  {activeTaskModal.id === 'bigBoard' && '📊'}
                  {activeTaskModal.id === 'networkHub' && '🌐'}
                  {activeTaskModal.id === 'islamicLibrary' && '📖'}
                  {activeTaskModal.id === 'hospitalityBar' && '☕'}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary-200 block">
                    {activeTaskModal.name} • {activeTaskModal.actor}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold leading-tight">
                    {activeTaskModal.taskTitle}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveTaskModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-200/70">
                {activeTaskModal.taskDesc}
              </p>

              {/* Station Specific Forms */}
              {activeTaskModal.id === 'pelayanan' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Nama Muzakki:</label>
                    <input
                      type="text"
                      value={inputDonasiMuzakki}
                      onChange={(e) => setInputDonasiMuzakki(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Pos Dana Zakat:</label>
                    <select
                      value={inputDonasiPos}
                      onChange={(e) => setInputDonasiPos(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                    >
                      <option value="Zakat Maal">Zakat Maal (Emas & Tabungan)</option>
                      <option value="Infaq Operasional">Infaq Operasional Dakwah</option>
                      <option value="Fidyah & Kaffarah">Fidyah & Kaffarah</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Nominal Donasi (Rp):</label>
                    <input
                      type="text"
                      value={inputDonasiNominal}
                      onChange={(e) => setInputDonasiNominal(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold text-primary-800 border border-neutral-300 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                    />
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      Akad Donasi:
                    </span>
                    <p className="italic font-serif">
                      "Nawaitu an ukhrija zakaata maali fardhan lillahi ta'ala. Sah tercatat pada Ledger Zaky."
                    </p>
                  </div>
                </div>
              )}

              {activeTaskModal.id === 'keuangan_hari' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-2 text-xs">
                    <span className="font-bold text-blue-950 block">Draf Penyaluran Mustahik Menunggu Persetujuan:</span>
                    <div className="bg-white p-2.5 rounded-xl border border-blue-100 space-y-1">
                      <div className="flex justify-between font-bold text-neutral-900">
                        <span>Paket Sembako Fakir Sleman</span>
                        <span className="text-primary-700 font-mono">Rp 800.000</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-mono">ID Draf: ZK4B8V2KNT9X • Rekomendasi Unit Pelayanan</p>
                    </div>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700 space-y-1">
                    <span className="font-bold text-neutral-900">Klausul Invariant FR-03:</span>
                    <p className="text-[11px] text-neutral-600 leading-relaxed">
                      Penyetuju mengesahkan reservasi saldo sebesar Rp 800.000 ke 'Saldo Dicadangkan'. Tidak akan terjadi pengurangan saldo riil sebelum pencairan diverifikasi oleh Saksi.
                    </p>
                  </div>
                </div>
              )}

              {activeTaskModal.id === 'keuangan_dewi' && (
                <div className="space-y-3">
                  <div className="space-y-2 text-xs">
                    <span className="font-bold text-neutral-900 block">Pemeriksaan Independensi 3-Pihak:</span>
                    {[
                      'Pembuat Draf: Unit Pelayanan (Amil Budi) — Terisolasi',
                      'Penyetuju: Unit Keuangan (Penyetuju Hari) — Terverifikasi',
                      'Saksi 1: Saksi Dewi — Bebas benturan kepentingan',
                      'Kriptografi: Ed25519 Segregated Ledger — Konsisten',
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 border border-neutral-200/80 text-[11px] text-neutral-800">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900">
                    <span>✓ Syarat sah fiqih 3-pihak terpenuhi. Kesaksian independen siap dibubuhkan.</span>
                  </div>
                </div>
              )}

              {activeTaskModal.id === 'bigBoard' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1 font-mono text-[11px]">
                    <div className="text-neutral-500">Persamaan Invariant:</div>
                    <div className="font-bold text-neutral-900">Total Masuk = Saldo Tersedia + Saldo Dicadangkan + Total Tersalurkan</div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-semibold text-neutral-700">
                      <span>Progres Verifikasi Audit:</span>
                      <span className="font-mono text-primary-700">{auditRunning ? `${auditProgress}%` : completedTasks.bigBoard ? '100% Selesai' : 'Siap'}</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${completedTasks.bigBoard ? 100 : auditProgress}%` }}
                      />
                    </div>
                  </div>

                  {!auditRunning && !completedTasks.bigBoard && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuditRunning(true);
                        setAuditProgress(10);
                        setTimeout(() => setAuditProgress(40), 300);
                        setTimeout(() => setAuditProgress(75), 600);
                        setTimeout(() => {
                          setAuditProgress(100);
                          setAuditRunning(false);
                          handleCompleteTask('bigBoard');
                        }, 900);
                      }}
                      className="w-full py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                    >
                      <Play size={14} />
                      <span>Jalankan Audit Otomatis Sekarang</span>
                    </button>
                  )}
                </div>
              )}

              {activeTaskModal.id === 'networkHub' && (
                <div className="space-y-3 text-xs">
                  <div className="space-y-2">
                    <span className="font-bold text-neutral-900 block">Status Federasi Antarlembaga (P2P Mesh):</span>
                    {[
                      { node: 'Simpul Lembaga A (Internal HQ)', status: 'Online • 0 ms', color: 'emerald' },
                      { node: 'Simpul BAZNAS Pusat (Mitra B)', status: 'Online • 14 ms', color: 'emerald' },
                      { node: 'Simpul PKPU / Dompet Dhuafa (Mitra C)', status: 'Online • 18 ms', color: 'emerald' },
                    ].map((n, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px]">
                        <span className="font-semibold text-neutral-800">{n.node}</span>
                        <span className="font-mono font-bold text-emerald-700">{n.status}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-neutral-600 bg-teal-50 p-3 rounded-xl border border-teal-200">
                    Kirim broadcast paket hash kesaksian Ed25519 untuk menyegel blok transaksi ke 3 simpul konsensus secara otomatis.
                  </p>
                </div>
              )}

              {activeTaskModal.id === 'islamicLibrary' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 space-y-1">
                    <span className="font-bold block">Soal Kajian Fiqih Zakat:</span>
                    <p className="leading-relaxed">
                      "Berapakah batasan porsi maksimal hak amil (asnaf amilin) atas dana zakat yang dihimpun menurut mayoritas fatwa ulama kontemporer dan QS. At-Taubah: 60?"
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { idx: 0, text: 'Maksimal 1/8 bagian (12.5%) dari total zakat' },
                      { idx: 1, text: 'Maksimal 20% (Kaidah seperlima / khums)' },
                      { idx: 2, text: 'Maksimal sepertiga bagian (33.3%)' },
                      { idx: 3, text: 'Bebas tanpa batasan sesuai kemauan amil' },
                    ].map((opt) => (
                      <button
                        key={opt.idx}
                        type="button"
                        onClick={() => {
                          setQuizSelectedOption(opt.idx);
                          setQuizSubmitted(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs font-semibold ${
                          quizSelectedOption === opt.idx
                            ? 'bg-primary-50 border-primary-600 text-primary-950 font-bold'
                            : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-50'
                        }`}
                      >
                        <span>{opt.text}</span>
                        {quizSelectedOption === opt.idx && (
                          <div className="w-4 h-4 rounded-full bg-primary-700 text-white flex items-center justify-center shrink-0">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {quizSubmitted && quizSelectedOption === 0 && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-[11px] text-emerald-950 space-y-1 animate-in fade-in">
                      <span className="font-bold flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 size={13} /> Jawaban Tepat! Maa syaa Allah!
                      </span>
                      <p>
                        Berdasarkan pembagian 8 asnaf di QS. At-Taubah ayat 60, porsi satu asnaf (amilin) adalah maksimal 1/8 (12.5%) dan tidak boleh melampaui batas tersebut demi menjaga hak fakir miskin.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTaskModal.id === 'hospitalityBar' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-center space-y-2 text-emerald-950">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Doa Amil untuk Para Muzakki
                    </span>
                    <p className="font-serif text-base sm:text-lg leading-relaxed text-emerald-900 font-medium py-1">
                      آجَرَكَ اللهُ فِيْمَا أَعْطَيْتَ، وَبَارَكَ لَكَ فِيْمَا أَبْقَيْتَ، وَجَعَلَهُ لَكَ طَهُوْرًا
                    </p>
                    <p className="text-[11px] italic text-emerald-800">
                      "Ajarakallahu fiima a'thaita, wa baaraka laka fiima abqaita, wa ja'alahu laka thahuura."
                    </p>
                    <p className="text-[10px] text-emerald-700 leading-relaxed border-t border-emerald-200/60 pt-2">
                      Semoga Allah memberikan pahala atas apa yang engkau berikan, melimpahkan berkah atas apa yang masih tersisa, dan menjadikannya pembersih harta & jiwa bagimu.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTaskModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-200/60 transition-colors cursor-pointer"
              >
                Batal / Tutup
              </button>

              {activeTaskModal.id === 'islamicLibrary' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (quizSelectedOption === 0) {
                      setQuizSubmitted(true);
                      setTimeout(() => handleCompleteTask('islamicLibrary'), 800);
                    } else {
                      alert('Jawaban kurang tepat. Coba periksa kembali pembagian asnaf di QS. At-Taubah: 60!');
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Kirim Jawaban Kajian</span>
                </button>
              ) : activeTaskModal.id !== 'bigBoard' ? (
                <button
                  type="button"
                  onClick={() => handleCompleteTask(activeTaskModal.id)}
                  className="px-5 py-2 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>
                    {activeTaskModal.id === 'pelayanan' && 'Sahkan & Simpan Donasi'}
                    {activeTaskModal.id === 'keuangan_hari' && 'Sahkan & Cadangkan Saldo FR-03'}
                    {activeTaskModal.id === 'keuangan_dewi' && 'Tandatangani Kesaksian Syariah'}
                    {activeTaskModal.id === 'networkHub' && 'Broadcast Konsensus Ed25519'}
                    {activeTaskModal.id === 'hospitalityBar' && 'Aminkan Doa & Selesai'}
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* GSAP-ANIMATED INTERACTIVE STATION DRAWER */}
      {selectedStation && (
        <div
          ref={drawerRef}
          className={`absolute inset-y-0 right-0 w-full sm:w-96 z-50 bg-white/95 backdrop-blur-2xl border-l border-white/60 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto transition-all ${
            isFullscreen ? 'sm:my-8 sm:mr-8 sm:rounded-3xl sm:border' : ''
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b border-neutral-200/80 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700">
                  {selectedStation.unit}
                </span>
                <h3 className="text-lg font-bold text-neutral-900 leading-snug">
                  {selectedStation.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStation(null)}
                className="p-1.5 rounded-lg liquid-glass-btn text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Officer Profile */}
            <div className="p-3.5 bg-neutral-50/80 rounded-2xl border border-neutral-200/80 space-y-1">
              <span className="text-[11px] text-neutral-500 font-medium">Petugas / Sistem Aktif:</span>
              <p className="font-bold text-neutral-900 text-sm">{selectedStation.actor}</p>
              <p className="text-xs text-neutral-600">{selectedStation.role}</p>
            </div>

            {/* Current Active Task */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                <Activity size={14} className="text-primary-700" />
                <span>Pekerjaan Saat Ini:</span>
              </span>
              <p className="text-xs text-neutral-700 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 font-medium leading-relaxed">
                {selectedStation.currentTask}
              </p>
            </div>

            {/* Recent Transaction */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Catatan Log Terakhir:</span>
              </span>
              <p className="text-xs text-neutral-600 bg-neutral-50/80 p-3 rounded-xl border border-neutral-200/80 leading-relaxed font-mono">
                {selectedStation.recentActivity}
              </p>
            </div>

            {/* Stat Tag */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs font-medium text-amber-900">
              ⚡ {selectedStation.stats}
            </div>

            {selectedStation.id === 'bigBoard' && (
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs space-y-2 text-emerald-950">
                <span className="font-bold block">Status Invariant FR-03 Database:</span>
                <p className="font-mono text-[11px] leading-relaxed">
                  total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan
                </p>
                <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <span>✓ 100% Saldo Konsisten & Terlindungi</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-neutral-200/80 flex gap-2">
            <button
              onClick={() => setSelectedStation(null)}
              className="flex-1 py-2.5 liquid-glass-active rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
