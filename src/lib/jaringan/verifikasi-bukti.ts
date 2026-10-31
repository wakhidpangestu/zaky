import { kanonikalJson } from '../../infrastructure/kripto/jcs.ts';

/**
 * Verifikator bukti publik. Hanya memakai WebCrypto (crypto.subtle), sehingga berjalan
 * sama di browser pengguna dan di Node: tidak ada langkah yang dipercayakan ke server.
 *
 *   1. rantai     : setiap entri = SHA-256(payload UTF-8 ‖ hash_sebelumnya), dan saling bersambung.
 *   2. catatan    : entri milik kode ini ada di dalam rantai yang diperiksa.
 *   3. tanda_tangan: hash harian ditandatangani Ed25519 oleh lembaga penerbit.
 *   4. kepala     : hash kepala dan jumlah entri pada hash harian = ujung rantai yang dihitung.
 *   5. kesaksian  : minimal dua lembaga lain menandatangani hash kepala yang sama.
 */
export interface EntriBukti {
  nomor: number;
  payload: string;
  hash_sebelumnya: string;
  hash_saat_ini: string;
}
export interface KesaksianBukti {
  saksi_lembaga_id: string;
  nama: string;
  kunci_publik: string;
  hash_disaksikan: string;
  diamati_pada: string;
  tanda_tangan: string;
}
export interface BuktiPublik {
  versi: 1;
  kode: string;
  jenis: 'penyaluran' | 'penerimaan';
  catatan_id: string;
  lembaga_id: string;
  nomor_catatan: number[];
  entri: EntriBukti[];
  hash_harian: { tanggal: string; payload_jcs: string; tanda_tangan: string; kunci_publik: string } | null;
  kesaksian: KesaksianBukti[];
  keterangan: string | null;
}

export type StatusCek = 'lulus' | 'gagal' | 'lewati';
export interface Cek {
  id: 'rantai' | 'catatan' | 'tanda_tangan' | 'kepala' | 'kesaksian';
  status: StatusCek;
  judul: string;
  rincian: string;
}
export interface HasilVerifikasi {
  sah: boolean;
  terikatHashHarian: boolean;
  cek: Cek[];
  peristiwa: { nomor: number; aksi: string; waktu: string; sesudah: unknown }[];
}

const enc = new TextEncoder();
const fromHex = (h: string) => {
  if (!/^(?:[0-9a-f]{2})*$/i.test(h)) throw new Error('hex tidak valid');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
};
const toHex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');

async function sha256Hex(subtle: SubtleCrypto, ...bagian: Uint8Array[]) {
  const total = new Uint8Array(bagian.reduce((n, b) => n + b.length, 0));
  let o = 0;
  for (const b of bagian) {
    total.set(b, o);
    o += b.length;
  }
  return toHex(await subtle.digest('SHA-256', total as BufferSource));
}

/** Browser lama belum mengenal Ed25519 di WebCrypto; itu bukan berarti tanda tangannya palsu. */
async function dukungEd25519(subtle: SubtleCrypto, kunciHex: string) {
  try {
    await subtle.importKey('raw', fromHex(kunciHex) as BufferSource, { name: 'Ed25519' }, false, ['verify']);
    return true;
  } catch (error) {
    return !(error instanceof Error && error.name === 'NotSupportedError');
  }
}
const TIDAK_DIDUKUNG =
  'Browser ini belum mendukung Ed25519 di WebCrypto. Gunakan versi terbaru Chrome, Edge, Firefox, atau Safari.';

async function verifyEd25519(subtle: SubtleCrypto, kunciHex: string, tandaTanganHex: string, data: Uint8Array) {
  try {
    const key = await subtle.importKey('raw', fromHex(kunciHex) as BufferSource, { name: 'Ed25519' }, false, ['verify']);
    return await subtle.verify({ name: 'Ed25519' }, key, fromHex(tandaTanganHex) as BufferSource, data as BufferSource);
  } catch {
    return false;
  }
}

export async function verifikasiBukti(
  bukti: BuktiPublik,
  subtle: SubtleCrypto = globalThis.crypto.subtle,
): Promise<HasilVerifikasi> {
  const cek: Cek[] = [];

  // 1. Hitung ulang setiap entri dan sambungannya.
  let rusak: string | null = null;
  for (const [i, e] of bukti.entri.entries()) {
    const hitung = await sha256Hex(subtle, enc.encode(e.payload), fromHex(e.hash_sebelumnya));
    if (hitung !== e.hash_saat_ini) {
      rusak = `Entri #${e.nomor}: hasil hitung ${hitung.slice(0, 16)}… ≠ tersimpan ${e.hash_saat_ini.slice(0, 16)}…`;
      break;
    }
    const prev = bukti.entri[i - 1];
    if (bukti.hash_harian && prev && (prev.hash_saat_ini !== e.hash_sebelumnya || prev.nomor + 1 !== e.nomor)) {
      rusak = `Entri #${e.nomor} tidak bersambung dengan entri #${prev.nomor}.`;
      break;
    }
  }
  cek.push({
    id: 'rantai',
    status: bukti.entri.length && !rusak ? 'lulus' : 'gagal',
    judul: 'Rantai hash dihitung ulang di perangkat ini',
    rincian: rusak ?? `${bukti.entri.length} entri cocok dengan SHA-256(payload ‖ hash sebelumnya).`,
  });

  // 2. Entri milik catatan ini benar-benar ada di rantai dan menyebut catatan ini.
  const milik = bukti.entri.filter((e) => bukti.nomor_catatan.includes(e.nomor));
  const peristiwa = milik.flatMap((e) => {
    try {
      const p = JSON.parse(e.payload) as { aksi: string; waktu: string; sesudah: unknown; entitas_id: string };
      return p.entitas_id === bukti.catatan_id ? [{ nomor: e.nomor, aksi: p.aksi, waktu: p.waktu, sesudah: p.sesudah }] : [];
    } catch {
      return [];
    }
  });
  const catatanLengkap = peristiwa.length === bukti.nomor_catatan.length && peristiwa.length > 0;
  cek.push({
    id: 'catatan',
    status: catatanLengkap ? 'lulus' : 'gagal',
    judul: `Riwayat ${bukti.kode} tercakup dalam rantai`,
    rincian: catatanLengkap
      ? `${peristiwa.length} peristiwa: ${peristiwa.map((p) => p.aksi).join(' → ')}.`
      : 'Sebagian entri catatan tidak ditemukan atau tidak menyebut catatan ini.',
  });

  // 3-5. Pengikatan ke hash harian bertanda tangan dan kesaksian lembaga lain.
  const h = bukti.hash_harian;
  let terikat = false;
  if (!h) {
    const alasan = bukti.keterangan ?? 'Hash harian belum tersedia.';
    for (const [id, judul] of [
      ['tanda_tangan', 'Tanda tangan hash harian lembaga'],
      ['kepala', 'Ujung rantai sama dengan hash harian'],
      ['kesaksian', 'Kesaksian lembaga lain'],
    ] as const)
      cek.push({ id, status: 'lewati', judul, rincian: alasan });
  } else {
    const ed = await dukungEd25519(subtle, h.kunci_publik);
    const ttdSah = ed && (await verifyEd25519(subtle, h.kunci_publik, h.tanda_tangan, enc.encode(h.payload_jcs)));
    cek.push({
      id: 'tanda_tangan',
      status: !ed ? 'lewati' : ttdSah ? 'lulus' : 'gagal',
      judul: 'Tanda tangan hash harian lembaga',
      rincian: !ed
        ? TIDAK_DIDUKUNG
        : ttdSah
          ? `Ed25519 sah untuk hash harian ${h.tanggal} dengan kunci publik ${h.kunci_publik.slice(0, 16)}….`
          : 'Tanda tangan tidak sah untuk kunci publik lembaga di direktori.',
    });

    let isi: { hash_kepala?: string; jumlah_entri?: number; lembaga_id?: string; tanggal?: string } = {};
    try {
      isi = JSON.parse(h.payload_jcs);
    } catch {
      /* ditangani sebagai tidak cocok */
    }
    const ujung = bukti.entri[bukti.entri.length - 1];
    const kepalaCocok =
      !!ujung &&
      isi.hash_kepala === ujung.hash_saat_ini &&
      isi.jumlah_entri === ujung.nomor &&
      isi.lembaga_id === bukti.lembaga_id &&
      isi.tanggal === h.tanggal;
    cek.push({
      id: 'kepala',
      status: kepalaCocok ? 'lulus' : 'gagal',
      judul: 'Ujung rantai sama dengan hash harian',
      rincian: kepalaCocok
        ? `Entri #${ujung.nomor} = kepala rantai yang diterbitkan ${h.tanggal}.`
        : 'Hash kepala atau jumlah entri pada hash harian berbeda dengan rantai yang dihitung.',
    });

    const saksiSah: string[] = [];
    for (const k of ed ? bukti.kesaksian : []) {
      if (k.saksi_lembaga_id === bukti.lembaga_id || k.hash_disaksikan !== isi.hash_kepala) continue;
      const payload = kanonikalJson({
        saksi_lembaga_id: k.saksi_lembaga_id,
        lembaga_id: bukti.lembaga_id,
        tanggal: h.tanggal,
        hash_disaksikan: k.hash_disaksikan,
        diamati_pada: k.diamati_pada,
      });
      if (await verifyEd25519(subtle, k.kunci_publik, k.tanda_tangan, enc.encode(payload))) saksiSah.push(k.nama);
    }
    const cukup = new Set(saksiSah).size >= 2;
    cek.push({
      id: 'kesaksian',
      status: !ed ? 'lewati' : cukup ? 'lulus' : 'gagal',
      judul: 'Kesaksian lembaga lain',
      rincian: !ed
        ? TIDAK_DIDUKUNG
        : saksiSah.length
          ? `${saksiSah.length} kesaksian sah atas hash yang sama: ${saksiSah.join(', ')}.${cukup ? '' : ' Dibutuhkan minimal 2.'}`
          : 'Belum ada kesaksian sah yang cocok dengan hash harian ini.',
    });
    terikat = ttdSah && kepalaCocok;
  }

  return {
    sah: cek.every((c) => c.status !== 'gagal'),
    terikatHashHarian: terikat,
    cek,
    peristiwa,
  };
}
