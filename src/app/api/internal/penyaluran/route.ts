import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { eksekusiBuatDraf } from '@/application/use-cases/buat-draf';
import { getSavedPosDana, savePosDana } from '@/lib/store';

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

    const body = await request.json();
    const { posId, nominal, mustahik } = body;

    if (!posId || !nominal || !mustahik) {
      return NextResponse.json({ error: 'Parameter posId, nominal, dan mustahik wajib diisi.' }, { status: 400 });
    }

    const allPos = getSavedPosDana();
    const pos = allPos.find((p) => p.id === posId) || allPos[0];

    const hasil = eksekusiBuatDraf({
      posDana: pos,
      mustahik,
      nominal: Number(nominal),
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
