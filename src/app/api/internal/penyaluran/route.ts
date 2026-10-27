import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { eksekusiBuatDraf } from '@/application/use-cases/buat-draf';
import { getSavedPosDana, savePosDana } from '@/lib/store';
import { DAFTAR_ASNAF, type AsnafEnum } from '@/domain/asnaf';

// Validasi skema masukan (audit R3): nominal harus angka hingga yang positif,
// posId wajib merujuk pos yang benar-benar ada (tidak lagi diam-diam jatuh
// ke pos pertama), dan asnaf harus salah satu dari daftar resmi.
const buatDrafSchema = z.object({
  posId: z.string().min(1, 'posId wajib diisi'),
  nominal: z.coerce.number().finite('Nominal harus berupa angka').positive('Nominal harus positif'),
  mustahik: z.object({
    id: z.string().min(1, 'mustahik.id wajib diisi'),
    namaSamaran: z.string().min(1, 'mustahik.namaSamaran wajib diisi'),
    asnaf: z.enum(Object.keys(DAFTAR_ASNAF) as [string, ...string[]]),
  }),
});

/**
 * Internal API: POST /api/internal/penyaluran
 * Sesuai Bab 3 dan Bab 4 (API internal, operasi tulis amil terotentikasi)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Sesi amil tidak valid atau telah kedaluwarsa.' }, { status: 401 });
    }

    if (session.peran !== 'amil') {
      return NextResponse.json({ error: 'FORBIDDEN: Hanya akun peran amil yang dapat membuat pengajuan penyaluran.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = buatDrafSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parameter tidak valid.', rincian: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { posId, nominal, mustahik } = parsed.data;

    const allPos = getSavedPosDana();
    const pos = allPos.find((p) => p.id === posId);
    if (!pos) {
      return NextResponse.json(
        { error: `Pos dana '${posId}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    const hasil = eksekusiBuatDraf({
      posDana: pos,
      mustahik: {
        id: mustahik.id,
        namaSamaran: mustahik.namaSamaran,
        asnaf: mustahik.asnaf as AsnafEnum,
      },
      nominal,
      pembuat: {
        akunId: session.userId,
        unitId: session.unitId,
        peran: 'amil',
      },
    });

    // Update pos dana di store
    const updatedPosList = allPos.map((p) => (p.id === pos.id ? { ...p, ...hasil.posDanaBaru } : p));
    savePosDana(updatedPosList);

    return NextResponse.json({ success: true, data: hasil }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memproses draf penyaluran' },
      { status: 400 }
    );
  }
}
