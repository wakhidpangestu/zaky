'use client';

import { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  KeyRound,
  Sliders,
  CheckCircle2,
  Building2,
  Save,
  Gamepad2,
  Bell,
  Lock,
} from 'lucide-react';
import ZakyLogo from '@/components/zaky-logo';
import { getActiveSession } from '@/app/actions/auth';

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
          Profil & Pengaturan Akun Amil
        </h1>
        <p className="text-sm text-[#41534E] mt-1">
          Kelola data petugas amil, otoritas multi-pihak, kunci penandatanganan, dan preferensi antarmuka.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl neo-convex border border-emerald-300 text-emerald-900 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
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
                <User size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0E1F1B]">Identitas Petugas Amil</h2>
                <p className="text-xs text-[#485E59]">Data diri yang dicatat pada rantai audit transaksi</p>
              </div>
            </div>

            <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 border border-primary-200">
              Otoritas Pelaksana
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#14201D] mb-1.5">
                Nama Lengkap Petugas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl neo-inset font-semibold text-[#0E1F1B] focus:outline-none focus:ring-2 focus:ring-primary-700/30 transition-all"
                required
              />
              <span className="text-[11px] text-[#4E625E] mt-1 block">
                Nama ini akan dicatat pada kolom <code>dibuat_oleh</code> saat membuat draf penyaluran.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14201D] mb-1.5">
                Alamat Email Login
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2.5 text-sm rounded-xl neo-inset font-semibold text-neutral-500 opacity-80 cursor-not-allowed"
              />
              <span className="text-[11px] text-[#4E625E] mt-1 block">
                Terkait dengan sesi token JWT HTTP-only.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14201D] mb-1.5">
                Unit Lembaga (FR-26, FR-30)
              </label>
              <div className="px-4 py-2.5 text-sm rounded-xl neo-inset font-semibold text-[#0E1F1B] flex items-center justify-between">
                <span>{unit}</span>
                <span className="text-xs text-primary-700 font-bold bg-white px-2 py-0.5 rounded border border-primary-200">
                  Unit 1
                </span>
              </div>
              <span className="text-[11px] text-[#4E625E] mt-1 block">
                Penyetuju wajib dari unit yang berbeda dengan unit amil pembuat.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14201D] mb-1.5">
                Peran Akun
              </label>
              <div className="px-4 py-2.5 text-sm rounded-xl neo-inset font-semibold text-[#0E1F1B] capitalize">
                Amil (Pembuat Draf & Penerimaan)
              </div>
              <span className="text-[11px] text-[#4E625E] mt-1 block">
                Sesuai batasan peran di Bagian 3 PRD Zaky v4.0.
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
              <p className="text-xs text-[#485E59]">Identitas kriptografi simpul Lembaga Zakat A</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl neo-inset font-mono text-[#0E1F1B] break-all flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 font-sans uppercase font-bold block mb-0.5">
                  Public Key Ed25519 Simpul:
                </span>
                <span className="text-primary-700 font-bold">
                  ed25519_pub_0a91f82c3d4e5f60718293a4b5c6d7e8f901234567890abcdef
                </span>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl neo-convex text-[11px] space-y-1">
                <span className="font-bold text-neutral-900 block">Status Rantai Kepala:</span>
                <span className="text-emerald-700 font-semibold font-mono">Terkunci &lt; 2 ms (FR-37)</span>
              </div>

              <div className="p-3 rounded-xl neo-convex text-[11px] space-y-1">
                <span className="font-bold text-neutral-900 block">Sertifikat Konsensus:</span>
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
            <div className="flex items-center justify-between p-3.5 rounded-2xl neo-convex">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl neo-inset flex items-center justify-center text-accent-500">
                  <Gamepad2 size={18} />
                </div>
                <div>
                  <span className="font-bold text-[#0E1F1B] block">Jadikan 3D Game Mode sebagai Beranda Default</span>
                  <span className="text-xs text-[#4E625E]">
                    Otomatis membuka visualisasi kantor virtual islami 3D saat membuka dasbor.
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={gameModeDefault}
                onChange={(e) => setGameModeDefault(e.target.checked)}
                className="w-5 h-5 accent-primary-700 rounded cursor-pointer"
              />
            </div>

            {/* Toggle Notifikasi Suara */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl neo-convex">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl neo-inset flex items-center justify-center text-primary-700">
                  <Bell size={18} />
                </div>
                <div>
                  <span className="font-bold text-[#0E1F1B] block">Pemberitahuan Realtime Konsensus</span>
                  <span className="text-xs text-[#4E625E]">
                    Tampilkan badge merah dan perbarui aliran audit saat ada aktivitas saksi baru.
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={notifSuara}
                onChange={(e) => setNotifSuara(e.target.checked)}
                className="w-5 h-5 accent-primary-700 rounded cursor-pointer"
              />
            </div>
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
