'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Apakah lembaga zakat lain dapat melihat nominal saldo atau daftar mustahik kami?',
      a: 'Tidak sama sekali. Zaky memegang prinsip kedaulatan data dan kepatuhan UU No. 27 Tahun 2022 (Pelindungan Data Pribadi). Yang dipertukarkan antarlembaga setiap malam hanyalah hash kepala kriptografis (SHA-256) dan tanda tangan digital Ed25519. Seluruh basis data operasional, daftar muzakki, dan data mustahik tetap tersimpan aman di server internal masing-masing lembaga.',
    },
    {
      q: 'Bagaimana jika mustahik penerima zakat tidak memiliki ponsel pintar atau lansia?',
      a: 'Zaky menyediakan Metode Saksi. Penyaluran diverifikasi di tempat oleh dua orang saksi independen yang memiliki akun Zaky tersendiri. Sistem secara ketat memeriksa bahwa kedua saksi berasal dari unit yang berbeda dengan amil pembuat draf, guna menjaga asas pemisahan wewenang tanpa kolusi.',
    },
    {
      q: 'Mengapa Zaky tidak menggunakan blockchain publik (seperti Ethereum atau Solana)?',
      a: 'Dana umat adalah amanah yang sensitif. Blockchain publik membebankan biaya transaksi (gas fee) yang berfluktuasi dan memotong hak asnaf, serta mengekspos metadata transaksi ke spekulan kripto. Zaky menggunakan protokol federasi cross-witnessing dengan tanda tangan digital Ed25519 yang 100% bebas biaya transaksi, ramah lingkungan, dan memiliki kecepatan verifikasi instan.',
    },
    {
      q: 'Apa yang terjadi jika amil mencoba menyetujui penyaluran yang ia buat sendiri?',
      a: 'Sistem Zaky menegakkan aturan Segregation of Duties secara otomatis. Jika personel dari unit pembuat mencoba menyetujui, sistem akan memblokir aksi tersebut dan menampilkan kode penolakan SAME_UNIT_APPROVER. Penyetuju harus berasal dari unit kerja yang terpisah (seperti Unit Keuangan).',
    },
    {
      q: 'Bagaimana jika seseorang memanipulasi catatan penyaluran langsung di basis data SQL?',
      a: 'Jika ada pihak yang mengubah nominal atau nama secara paksa di database lokal, perhitungan ulang hash audit log harian tidak akan lagi cocok dengan hash harian yang telah ditandatangani dan disaksikan oleh lembaga-lembaga lain semalam. Halaman Papan Silang seketika menampilkan status Tidak Cocok dengan warna oranye dan membunyikan peringatan integritas.',
    },
    {
      q: 'Bagaimana masyarakat umum atau muzakki dapat memverifikasi kuitansinya?',
      a: 'Setiap tanda terima penerimaan atau penyaluran zakat memiliki 12 karakter kode unik acak (misalnya ZK4B8V2KNT9X). Siapa pun dapat mengakses menu Verifikasi Publik (/verifikasi) tanpa perlu mendaftar atau login untuk memeriksa keabsahan rantai log dan status kesaksian antarlembaga.',
    },
  ];

  return (
    <section id="faq" className="z-cv py-20 md:py-28 bg-[#F7F4ED] border-b border-neutral-300/80 relative scroll-mt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 gsap-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neo-convex text-primary-900 text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-primary-700" />
            <span>Tanya Jawab Seputar Zaky</span>
          </div>
          <h2 className="z-display-2 text-neutral-900">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
            Jawaban lugas mengenai tata kelola, perlindungan data pribadi, dan arsitektur keamanan
            jaringan verifikasi antarlembaga.
          </p>
        </div>

        {/* Neomorphic Accordion */}
        <div className="space-y-4 gsap-stagger-group">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="neo-card-3d rounded-2xl overflow-hidden transition-all gsap-stagger-item"
                style={{ borderRadius: '20px' }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full py-4 sm:py-5 px-5 sm:px-7 text-left flex items-center justify-between gap-4 font-bold text-neutral-900 hover:text-primary-700 transition-colors cursor-pointer text-sm sm:text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-500 transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-primary-700' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-7 pb-6 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 bg-surface/80">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
