'use client';

import { useState, useEffect } from 'react';
import {
  UserRound,
  ShieldCheck,
  KeyRound,
  Sliders,
  CircleCheck,
  Save,
  Gamepad2,
  Bell,
} from 'lucide-react';
import { getActiveSession } from '@/app/actions/auth';

const ROLE: Record<string, { label: string; badge: string }> = {
  amil: { label: 'Amil (membuat draf & mencatat penerimaan)', badge: 'Pelaksana' },
  penyetuju: { label: 'Penyetuju (memeriksa & mengesahkan)', badge: 'Penyetuju' },
  admin: { label: 'Administrator lembaga', badge: 'Admin' },
};

export default function ProfilPage() {
  const [nama, setNama] = useState('Amil Budi');
  const [email, setEmail] = useState('budi@lembaga-a.test');
  const [unit, setUnit] = useState('Unit Pelayanan');
  const [peran, setPeran] = useState('amil');
  const [gameModeDefault, setGameModeDefault] = useState(false);
  const [notifSuara, setNotifSuara] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getActiveSession().then((sess) => {
      if (sess) {
        setNama(sess.nama);
        setEmail(sess.email);
        setUnit(sess.unit);
        setPeran(sess.peran);

        try {
          const savedNama = localStorage.getItem(`zaky_user_nama_${sess.email}`);
          if (savedNama) setNama(savedNama);
          const savedGameMode = localStorage.getItem('zaky_pref_gamemode');
          if (savedGameMode) setGameModeDefault(savedGameMode === 'true');
          const savedNotif = localStorage.getItem('zaky_pref_notif');
          if (savedNotif) setNotifSuara(savedNotif === 'true');
        } catch {
          // ignore
        }
      }
    });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(`zaky_user_nama_${email}`, nama);
      localStorage.removeItem('zaky_user_nama');
      localStorage.setItem('zaky_pref_gamemode', String(gameModeDefault));
      localStorage.setItem('zaky_pref_notif', String(notifSuara));
      window.dispatchEvent(new Event('zaky_profile_updated'));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0E1F1B] tracking-tight">
          Profil & Pengaturan Akun
        </h1>
        <p className="text-sm text-[#41534E] mt-1">
          Data petugas, peran, kunci penandatanganan lembaga, dan preferensi tampilan.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl neo-convex border border-emerald-300 text-emerald-900 flex items-center gap-3 animate-in fade-in">
          <CircleCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">
            Perubahan nama dan preferensi berhasil disimpan dan disinkronkan ke seluruh sistem!
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identitas Petugas Card */}
        <div className="p-6 sm:p-7 rounded-[28px] neo-convex space-y-5 border border-white/90">
          <div className="flex items-center justify-between border-b border-black/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center text-primary-700">
                <UserRound size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0E1F1B]">Identitas Petugas</h2>
                <p className="text-xs text-[#485E59]">Data diri yang dicatat pada rantai audit transaksi</p>
              </div>
            </div>

            <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 border border-primary-200">
              {ROLE[peran]?.badge ?? peran}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profil-nama" className="block text-sm font-bold text-[#14201D] mb-1.5">
                Nama Lengkap Petugas <span className="text-red-500">*</span>
              </label>
              <input
                id="profil-nama"
                aria-describedby="profil-nama-hint"
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl neo-inset font-semibold text-[#0E1F1B] focus:outline-none focus:ring-2 focus:ring-primary-700/30 transition-all"
                required
              />
              <span id="profil-nama-hint" className="text-xs text-[#4E625E] mt-1 block">
                Nama ini tercatat sebagai pembuat pada setiap draf penyaluran Anda.
              </span>
            </div>

            <div>
              <label htmlFor="profil-email" className="block text-sm font-bold text-[#14201D] mb-1.5">
                Alamat Email Login
              </label>
              <input
                id="profil-email"
                aria-describedby="profil-email-hint"
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2.5 text-sm rounded-xl neo-inset font-semibold text-neutral-500 opacity-80 cursor-not-allowed"
              />
              <span id="profil-email-hint" className="text-xs text-[#4E625E] mt-1 block">
                Dipakai untuk masuk dan tidak dapat diubah dari sini.
              </span>
            </div>

            <div>
              <p className="block text-sm font-bold text-[#14201D] mb-1.5">Unit Lembaga</p>
              <div className="px-4 py-2.5 text-sm rounded-xl neo-inset font-semibold text-[#0E1F1B]">
                {unit}
              </div>
              <span className="text-xs text-[#4E625E] mt-1 block">
                Penyetuju wajib dari unit yang berbeda dengan unit amil pembuat.
              </span>
            </div>

            <div>
              <p className="block text-sm font-bold text-[#14201D] mb-1.5">Peran Akun</p>
              <div className="px-4 py-2.5 text-sm rounded-xl neo-inset font-semibold text-[#0E1F1B]">
                {ROLE[peran]?.label ?? peran}
              </div>
              <span className="text-xs text-[#4E625E] mt-1 block">
                Peran menentukan tahap kerja yang boleh Anda tangani.
              </span>
            </div>
          </div>
        </div>

        {/* Keamanan & Kriptografi Card */}
        <div className="p-6 sm:p-7 rounded-[28px] neo-convex space-y-4 border border-white/90">
          <div className="flex items-center gap-3 border-b border-black/5 pb-4">
            <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center text-primary-700">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0E1F1B]">Kunci Penandatanganan Kriptografis (Ed25519)</h2>
              <p className="text-xs text-[#485E59]">Identitas kriptografi lembaga Anda</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl neo-inset font-mono text-[#0E1F1B] break-all flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-500 font-sans uppercase font-bold block mb-0.5">
                  Public Key Ed25519 Simpul:
                </span>
                <span className="text-primary-700 font-bold">
                  ed25519_pub_0a91f82c3d4e5f60718293a4b5c6d7e8f901234567890abcdef
                </span>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl neo-convex text-sm space-y-1">
                <span className="font-bold text-neutral-900 block">Status rantai audit:</span>
                <span className="text-emerald-700 font-semibold">Terkunci & utuh</span>
              </div>

              <div className="p-3 rounded-xl neo-convex text-sm space-y-1">
                <span className="font-bold text-neutral-900 block">Disaksikan oleh:</span>
                <span className="text-neutral-700 font-semibold">Tervalidasi Lembaga B & C</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preferensi Antarmuka & Game Mode Card */}
        <div className="p-6 sm:p-7 rounded-[28px] neo-convex space-y-5 border border-white/90">
          <div className="flex items-center gap-3 border-b border-black/5 pb-4">
            <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center text-primary-700">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0E1F1B]">Preferensi Antarmuka & Notifikasi</h2>
              <p className="text-xs text-[#485E59]">Kustomisasi pengalaman pengguna di portal Zaky</p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            {/* Toggle Game Mode 3D */}
            <label htmlFor="pref-3d" className="flex items-center justify-between gap-3 p-3.5 rounded-2xl neo-convex cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl neo-inset flex items-center justify-center text-accent-500">
                  <Gamepad2 size={18} />
                </div>
                <div>
                  <span className="font-bold text-[#0E1F1B] block">Buka Zaky Simulator saat masuk dasbor</span>
                  <span className="text-xs text-[#4E625E]">
                    Berlaku bila Anda belum memilih mode lain di dasbor.
                  </span>
                </div>
              </div>

              <input
                id="pref-3d"
                type="checkbox"
                checked={gameModeDefault}
                onChange={(e) => setGameModeDefault(e.target.checked)}
                className="w-5 h-5 shrink-0 accent-primary-700 rounded cursor-pointer"
              />
            </label>

            {/* Toggle Notifikasi */}
            <label htmlFor="pref-notif" className="flex items-center justify-between gap-3 p-3.5 rounded-2xl neo-convex cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl neo-inset flex items-center justify-center text-primary-700">
                  <Bell size={18} />
                </div>
                <div>
                  <span className="font-bold text-[#0E1F1B] block">Tampilkan jumlah notifikasi</span>
                  <span className="text-xs text-[#4E625E]">
                    Angka pada lonceng notifikasi saat ada tugas atau kesaksian baru.
                  </span>
                </div>
              </div>

              <input
                id="pref-notif"
                type="checkbox"
                checked={notifSuara}
                onChange={(e) => setNotifSuara(e.target.checked)}
                className="w-5 h-5 shrink-0 accent-primary-700 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl neo-active-pill font-bold text-sm text-white shadow-md transition-all cursor-pointer hover:scale-[1.01]"
          >
            <Save size={16} />
            <span>Simpan Perubahan Profil</span>
          </button>
        </div>
      </form>
    </div>
  );
}
