// Simpanan data demonstrasi Zaky
// Invariant FR-03: total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan

export interface PosDanaData {
  id: string;
  nama: string;
  totalMasuk: number;
  saldoTersedia: number;
  saldoDicadangkan: number;
  totalTersalurkan: number;
}

export interface MustahikData {
  id: string;
  namaSamaran: string;
  kabupaten: string;
  asnaf: 'fakir' | 'miskin' | 'amil' | 'muallaf' | 'riqab' | 'gharimin' | 'fisabilillah' | 'ibnu_sabil';
  teleponMasked: string;
}

export interface PenyaluranItem {
  id: string;
  kodeUnik: string;
  posId: string;
  posNama: string;
  mustahikId: string;
  mustahikNama: string;
  kabupaten: string;
  asnaf: string;
  nominal: number;
  status: 'dibuat' | 'menunggu_konfirmasi' | 'ditolak_penerima' | 'dikonfirmasi' | 'disetujui' | 'tersalurkan' | 'kedaluwarsa' | 'dibatalkan';
  metode: 'mustahik' | 'saksi';
  dibuatOleh: string;
  dibuatUnit: string;
  dibuatPada: string;
  kedaluwarsaPada: string;
  namaBerkasBukti?: string;
  hashSha256?: string;
  tokenHash?: string;
  alasanTolak?: string;
  saksi1Nama?: string;
  saksi1Unit?: string;
  saksi1Waktu?: string;
  saksi2Nama?: string;
  saksi2Unit?: string;
  saksi2Waktu?: string;
  penyetujuNama?: string;
  penyetujuUnit?: string;
  penyetujuWaktu?: string;
}

export interface PenerimaanItem {
  id: string;
  kodeUnik: string;
  posId: string;
  posNama: string;
  bruto: number;
  hakAmil: number;
  masukPos: number;
  persenAmil: number;
  kanal: string;
  muzakkiNama: string;
  muzakkiTipe: 'terdaftar' | 'anonim';
  keterangan: string;
  dicatatOleh: string;
  dicatatUnit: string;
  dicatatPada: string;
  hashSha256: string;
}

// Data awal Pos Dana (Sesuai seed 002)
export const INITIAL_POS_DANA: PosDanaData[] = [
  {
    id: 'p1111111-1111-1111-1111-111111111111',
    nama: 'Zakat Maal',
    totalMasuk: 6000000,
    saldoTersedia: 1000000,
    saldoDicadangkan: 800000,
    totalTersalurkan: 4200000,
  },
  {
    id: 'p2222222-2222-2222-2222-222222222222',
    nama: 'Zakat Fitrah Uang',
    totalMasuk: 1400000,
    saldoTersedia: 400000,
    saldoDicadangkan: 0,
    totalTersalurkan: 1000000,
  },
];

// Data Mustahik terdaftar
export const DEMO_MUSTAHIK: MustahikData[] = [
  {
    id: 'm1111111-1111-1111-1111-111111111111',
    namaSamaran: 'S***',
    kabupaten: 'Kabupaten Sleman',
    asnaf: 'fakir',
    teleponMasked: '+62 812-****-3301',
  },
  {
    id: 'm2222222-2222-2222-2222-222222222222',
    namaSamaran: 'A***',
    kabupaten: 'Kabupaten Bantul',
    asnaf: 'miskin',
    teleponMasked: '+62 857-****-8819',
  },
  {
    id: 'm3333333-3333-3333-3333-333333333333',
    namaSamaran: 'M***',
    kabupaten: 'Kota Yogyakarta',
    asnaf: 'gharimin',
    teleponMasked: '+62 878-****-1244',
  },
];

// Data awal Penerimaan untuk demo (FR-09 s/d FR-13)
export const INITIAL_PENERIMAAN: PenerimaanItem[] = [
  {
    id: 'rcv-1',
    kodeUnik: 'RC8K3N9PL2MA',
    posId: 'p1111111-1111-1111-1111-111111111111',
    posNama: 'Zakat Maal',
    bruto: 4000000,
    hakAmil: 500000,
    masukPos: 3500000,
    persenAmil: 12.5,
    kanal: 'Transfer Bank Syariah (BSI)',
    muzakkiNama: 'H. Ahmad Syafii',
    muzakkiTipe: 'terdaftar',
    keterangan: 'Zakat perniagaan toko grosir berkah',
    dicatatOleh: 'Amil Budi',
    dicatatUnit: 'Unit Pelayanan',
    dicatatPada: '24 Okt 08:30 WIB',
    hashSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
  },
  {
    id: 'rcv-2',
    kodeUnik: 'RC7V2M8KQ9XT',
    posId: 'p1111111-1111-1111-1111-111111111111',
    posNama: 'Zakat Maal',
    bruto: 2857143,
    hakAmil: 357143,
    masukPos: 2500000,
    persenAmil: 12.5,
    kanal: 'QRIS Dinamis Counter',
    muzakkiNama: 'Hamba Allah',
    muzakkiTipe: 'anonim',
    keterangan: 'Zakat tabungan & simpanan emas',
    dicatatOleh: 'Amil Budi',
    dicatatUnit: 'Unit Pelayanan',
    dicatatPada: '24 Okt 14:15 WIB',
    hashSha256: '4f92bc30a84d93021be04721adbf902834710dbaf0192348aef0192837461928',
  },
  {
    id: 'rcv-3',
    kodeUnik: 'RC4B9W1XZ5KL',
    posId: 'p2222222-2222-2222-2222-222222222222',
    posNama: 'Zakat Fitrah Uang',
    bruto: 1600000,
    hakAmil: 200000,
    masukPos: 1400000,
    persenAmil: 12.5,
    kanal: 'Tunai Counter Kantor Layanan',
    muzakkiNama: 'Keluarga Bpk. Hartono',
    muzakkiTipe: 'terdaftar',
    keterangan: 'Zakat fitrah 32 jiwa setara beras premium',
    dicatatOleh: 'Amil Budi',
    dicatatUnit: 'Unit Pelayanan',
    dicatatPada: '25 Okt 09:00 WIB',
    hashSha256: '7c89a012de34bc56fa780912bcde34567890abcdef1234567890abcdef123456',
  },
];

// Data awal Penyaluran untuk demo
export const INITIAL_PENYALURAN: PenyaluranItem[] = [
  {
    id: 'dist-1',
    kodeUnik: 'ZK7H3Q9PLM2A',
    posId: 'p1111111-1111-1111-1111-111111111111',
    posNama: 'Zakat Maal',
    mustahikId: 'm1111111-1111-1111-1111-111111111111',
    mustahikNama: 'S***',
    kabupaten: 'Kabupaten Sleman',
    asnaf: 'fakir',
    nominal: 800000,
    status: 'menunggu_konfirmasi',
    metode: 'mustahik',
    dibuatOleh: 'Amil Budi',
    dibuatUnit: 'Unit Pelayanan',
    dibuatPada: '27 Okt 09.10',
    kedaluwarsaPada: '30 Okt 09.10',
    namaBerkasBukti: 'berita-acara-sleman.pdf',
    hashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    tokenHash: 'tok-zk7h3q9p',
  },
  {
    id: 'dist-2',
    kodeUnik: 'ZK4B8V2KNT9X',
    posId: 'p1111111-1111-1111-1111-111111111111',
    posNama: 'Zakat Maal',
    mustahikId: 'm2222222-2222-2222-2222-222222222222',
    mustahikNama: 'A***',
    kabupaten: 'Kabupaten Bantul',
    asnaf: 'miskin',
    nominal: 1200000,
    status: 'tersalurkan',
    metode: 'saksi',
    dibuatOleh: 'Amil Budi',
    dibuatUnit: 'Unit Pelayanan',
    dibuatPada: '25 Okt 11.30',
    kedaluwarsaPada: '28 Okt 11.30',
    namaBerkasBukti: 'dokumentasi-bantul.jpg',
    hashSha256: '9f83c605d4c82b3e925bce3269f14e491a0c7148582103714f7b4e8391ac697c',
    saksi1Nama: 'Saksi Dewi',
    saksi1Unit: 'Unit Penyaluran',
    saksi1Waktu: '25 Okt 13.15',
    saksi2Nama: 'Saksi Rian',
    saksi2Unit: 'Unit Pengawasan',
    saksi2Waktu: '25 Okt 14.00',
    penyetujuNama: 'Penyetuju Hari',
    penyetujuUnit: 'Unit Keuangan',
    penyetujuWaktu: '25 Okt 14.45',
  },
  {
    id: 'dist-3',
    kodeUnik: 'ZKHTNU9L6XKD',
    posId: 'p1111111-1111-1111-1111-111111111111',
    posNama: 'Zakat Maal',
    mustahikId: 'm3333333-3333-3333-3333-333333333333',
    mustahikNama: 'M*** (Keluarga Dhuafa)',
    kabupaten: 'Kota Bandung',
    asnaf: 'fakir',
    nominal: 1500000,
    status: 'tersalurkan',
    metode: 'saksi',
    dibuatOleh: 'Amil Budi',
    dibuatUnit: 'Unit Pelayanan',
    dibuatPada: '25 Okt 14.00',
    kedaluwarsaPada: '28 Okt 14.00',
    namaBerkasBukti: 'berita-acara-bandung.pdf',
    hashSha256: '4a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
    saksi1Nama: 'Saksi Dewi',
    saksi1Unit: 'Unit Penyaluran',
    saksi1Waktu: '25 Okt 15.10',
    saksi2Nama: 'Saksi Rian',
    saksi2Unit: 'Unit Pengawasan',
    saksi2Waktu: '25 Okt 15.30',
    penyetujuNama: 'Penyetuju Hari',
    penyetujuUnit: 'Unit Keuangan',
    penyetujuWaktu: '25 Okt 16.00',
  },
];

// Helper Storage State (Browser LocalStorage Sync)
export function getSavedPosDana(): PosDanaData[] {
  if (typeof window === 'undefined') return INITIAL_POS_DANA;
  try {
    const saved = localStorage.getItem('zaky_pos_dana');
    return saved ? JSON.parse(saved) : INITIAL_POS_DANA;
  } catch {
    return INITIAL_POS_DANA;
  }
}

export function savePosDana(posList: PosDanaData[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('zaky_pos_dana', JSON.stringify(posList));
    window.dispatchEvent(new Event('zaky_store_updated'));
  } catch (e) {
    console.error('Failed to save pos dana', e);
  }
}

export function getSavedPenerimaan(): PenerimaanItem[] {
  if (typeof window === 'undefined') return INITIAL_PENERIMAAN;
  try {
    const saved = localStorage.getItem('zaky_penerimaan');
    return saved ? JSON.parse(saved) : INITIAL_PENERIMAAN;
  } catch {
    return INITIAL_PENERIMAAN;
  }
}

export function savePenerimaan(items: PenerimaanItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('zaky_penerimaan', JSON.stringify(items));
    window.dispatchEvent(new Event('zaky_store_updated'));
  } catch (e) {
    console.error('Failed to save penerimaan', e);
  }
}

export function getSavedPenyaluran(): PenyaluranItem[] {
  if (typeof window === 'undefined') return INITIAL_PENYALURAN;
  try {
    const saved = localStorage.getItem('zaky_penyaluran');
    return saved ? JSON.parse(saved) : INITIAL_PENYALURAN;
  } catch {
    return INITIAL_PENYALURAN;
  }
}

export function savePenyaluran(items: PenyaluranItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('zaky_penyaluran', JSON.stringify(items));
    window.dispatchEvent(new Event('zaky_store_updated'));
  } catch (e) {
    console.error('Failed to save penyaluran', e);
  }
}

/**
 * Reset seluruh basis data simulasi & cache lokal ke kondisi awal (seperti baru)
 */
export function resetDatabaseStore(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('zaky_pos_dana');
    localStorage.removeItem('zaky_penerimaan');
    localStorage.removeItem('zaky_penyaluran');
    localStorage.removeItem('zaky_user_nama');
    localStorage.removeItem('zaky_user_email');
    localStorage.removeItem('zaky_pref_gamemode');

    // Hapus seluruh kunci yang diawali zaky_
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('zaky_')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    window.dispatchEvent(new Event('zaky_store_updated'));
    window.dispatchEvent(new Event('zaky_profile_updated'));
  } catch (e) {
    console.error('Failed to reset store', e);
  }
}
