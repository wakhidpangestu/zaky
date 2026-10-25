import React from 'react';
import { PenyaluranItem } from '@/lib/store';

interface PenandaLangkahProps {
  penyaluran: PenyaluranItem;
}

export default function PenandaLangkah({ penyaluran }: PenandaLangkahProps) {
  const isSaksi = penyaluran.metode === 'saksi';

  if (!isSaksi) {
    // Metode Mustahik (3 Pihak)
    const isStep1Done = true;
    const isStep2Done =
      penyaluran.status === 'dikonfirmasi' ||
      penyaluran.status === 'disetujui' ||
      penyaluran.status === 'tersalurkan';
    const isStep2Waiting =
      penyaluran.status === 'menunggu_konfirmasi' || penyaluran.status === 'dibuat';
    const isStep2Rejected = penyaluran.status === 'ditolak_penerima';
    const isStep3Done = penyaluran.status === 'tersalurkan' || penyaluran.status === 'disetujui';

    return (
      <div className="bg-surface rounded-xl p-4 border border-neutral-300 text-sm">
        <div className="font-medium text-neutral-900 mb-3 flex items-center justify-between">
          <span>Penanda Langkah Verifikasi (3 Pihak)</span>
          <span className="text-xs text-neutral-600 font-mono">Metode: Mustahik Berponsel</span>
        </div>

        <div className="space-y-3 font-sans">
          {/* Langkah 1: Dibuat oleh */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center">
                1
              </span>
              <span className="text-neutral-600">Dibuat oleh:</span>
              <span className="font-medium text-neutral-900">
                {penyaluran.dibuatOleh} ({penyaluran.dibuatUnit})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary-700 font-medium">
              <span>✓</span>
              <span>{penyaluran.dibuatPada}</span>
            </div>
          </div>

          {/* Langkah 2: Konfirmasi Mustahik */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center ${
                  isStep2Done
                    ? 'bg-primary-100 text-primary-700'
                    : isStep2Rejected
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                2
              </span>
              <span className="text-neutral-600">Dikonfirmasi oleh:</span>
              <span className="font-medium text-neutral-900">
                Mustahik ({penyaluran.mustahikNama}) via tautan SMS
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {isStep2Done ? (
                <span className="text-primary-700 font-medium">✓ Dikonfirmasi</span>
              ) : isStep2Rejected ? (
                <span className="text-red-700 font-medium">✕ Ditolak</span>
              ) : (
                <span className="text-amber-800 flex items-center gap-1">
                  ⏳ Batas {penyaluran.kedaluwarsaPada}
                </span>
              )}
            </div>
          </div>

          {/* Langkah 3: Disetujui */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center ${
                  isStep3Done
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                3
              </span>
              <span className="text-neutral-600">Disetujui oleh:</span>
              <span className="font-medium text-neutral-900">
                {penyaluran.penyetujuNama
                  ? `${penyaluran.penyetujuNama} (${penyaluran.penyetujuUnit})`
                  : 'Penyetuju (Unit Keuangan)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {isStep3Done ? (
                <span className="text-primary-700 font-medium">
                  ✓ {penyaluran.penyetujuWaktu || 'Disetujui'}
                </span>
              ) : (
                <span className="text-neutral-400 font-mono">— Menunggu</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Metode Saksi (4 Akun, minimal 2 Unit)
  const isSaksi1Done = !!penyaluran.saksi1Nama;
  const isSaksi2Done = !!penyaluran.saksi2Nama;
  const isApproved = penyaluran.status === 'tersalurkan' || penyaluran.status === 'disetujui';

  return (
    <div className="bg-surface rounded-xl p-4 border border-neutral-300 text-sm">
      <div className="font-medium text-neutral-900 mb-3 flex items-center justify-between">
        <span>Penanda Langkah Verifikasi (4 Pihak)</span>
        <span className="text-xs text-neutral-600 font-mono">Metode: 2 Saksi Tanpa Ponsel</span>
      </div>

      <div className="space-y-3 font-sans">
        {/* Langkah 1: Dibuat */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center">
              1
            </span>
            <span className="text-neutral-600">Dibuat oleh:</span>
            <span className="font-medium text-neutral-900">
              {penyaluran.dibuatOleh} ({penyaluran.dibuatUnit})
            </span>
          </div>
          <span className="text-xs text-primary-700 font-medium">✓ {penyaluran.dibuatPada}</span>
        </div>

        {/* Langkah 2: Saksi 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center ${
                isSaksi1Done
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              2
            </span>
            <span className="text-neutral-600">Saksi 1:</span>
            <span className="font-medium text-neutral-900">
              {penyaluran.saksi1Nama
                ? `${penyaluran.saksi1Nama} (${penyaluran.saksi1Unit})`
                : 'Menunggu saksi unit lain'}
            </span>
          </div>
          <span className="text-xs">
            {isSaksi1Done ? (
              <span className="text-primary-700 font-medium">✓ {penyaluran.saksi1Waktu}</span>
            ) : (
              <span className="text-amber-800">⏳ Batas {penyaluran.kedaluwarsaPada}</span>
            )}
          </span>
        </div>

        {/* Langkah 3: Saksi 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center ${
                isSaksi2Done
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              3
            </span>
            <span className="text-neutral-600">Saksi 2:</span>
            <span className="font-medium text-neutral-900">
              {penyaluran.saksi2Nama
                ? `${penyaluran.saksi2Nama} (${penyaluran.saksi2Unit})`
                : 'Menunggu saksi unit lain'}
            </span>
          </div>
          <span className="text-xs">
            {isSaksi2Done ? (
              <span className="text-primary-700 font-medium">✓ {penyaluran.saksi2Waktu}</span>
            ) : (
              <span className="text-amber-800">⏳ Menunggu</span>
            )}
          </span>
        </div>

        {/* Langkah 4: Disetujui */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center ${
                isApproved
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              4
            </span>
            <span className="text-neutral-600">Disetujui oleh:</span>
            <span className="font-medium text-neutral-900">
              {penyaluran.penyetujuNama
                ? `${penyaluran.penyetujuNama} (${penyaluran.penyetujuUnit})`
                : 'Penyetuju (Unit Keuangan)'}
            </span>
          </div>
          <span className="text-xs">
            {isApproved ? (
              <span className="text-primary-700 font-medium">✓ {penyaluran.penyetujuWaktu}</span>
            ) : (
              <span className="text-neutral-400 font-mono">— Menunggu</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
