'use client';

import React, { useState } from 'react';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Star,
  Users,
  Search,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface DewanMember {
  id: string;
  name: string;
  category: 'syariah' | 'kripto' | 'penyetuju' | 'amil';
  role: string;
  credentials: string;
  rating: string;
  casesReviewed: string;
  schedule: string;
  badge: string;
}

export default function DewanSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');

  const members: DewanMember[] = [
    {
      id: '1',
      name: 'Dr. KH. Abdullah Syakir, MA',
      category: 'syariah',
      role: 'Ketua Dewan Pengawas Syariah',
      credentials: 'Pakar Fiqih Zakat & Fatwa DSN-MUI Pusat',
      rating: '5.0',
      casesReviewed: '1.240+ Fatwa & Alokasi',
      schedule: 'Sidang Pleno: Setiap Senin 09:00 WIB',
      badge: 'DSN-MUI Terdaftar',
    },
    {
      id: '2',
      name: 'Dr. Ir. Raka Pradipta, Ph.D',
      category: 'kripto',
      role: 'Auditor Kriptografi & Sistem Rantai',
      credentials: 'Spesialis RFC 8785 JCS, Ed25519 & Log Append-Only',
      rating: '4.9',
      casesReviewed: '3.800+ Hash Log Bersaksi',
      schedule: 'Verifikasi Anchor: Tengah Malam 00:00 WIB',
      badge: 'Certified Security Auditor',
    },
    {
      id: '3',
      name: 'Hari Wibowo, SE, Ak., CA',
      category: 'penyetuju',
      role: 'Direktur Penyetujuan Unit Keuangan',
      credentials: 'Akuntan Publik & Spesialis Invariant Saldo Kekal',
      rating: '5.0',
      casesReviewed: '850+ Draf Penyaluran Lulus',
      schedule: 'Jam Otorisasi: Senin - Jumat 08:00 - 17:00 WIB',
      badge: 'Ikatan Akuntan Indonesia (IAI)',
    },
    {
      id: '4',
      name: 'Dewi Sartika, S.Sos',
      category: 'amil',
      role: 'Saksi Independen Unit Distribusi',
      credentials: 'Verifikator Lapangan Mustahik & Saksi Geotag Sah',
      rating: '4.9',
      casesReviewed: '2.100+ Mustahik Dikonfirmasi',
      schedule: 'Penyaluran Lapangan: Setiap Hari Siaga',
      badge: 'Amil Tersertifikasi BNSP',
    },
  ];

  const categories = [
    { id: 'semua', label: 'Semua Pengawas' },
    { id: 'syariah', label: 'Dewan Syariah' },
    { id: 'kripto', label: 'Auditor Kriptografi' },
    { id: 'penyetuju', label: 'Penyetuju Keuangan' },
    { id: 'amil', label: 'Saksi Lapangan' },
  ];

  const filteredMembers =
    selectedCategory === 'semua'
      ? members
      : members.filter((m) => m.category === selectedCategory);

  return (
    <section className="z-cv py-20 sm:py-28 bg-[#F7F4ED] border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 text-left">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-bold border border-primary-200">
              <Award className="w-3.5 h-3.5" />
              <span>PENGAWASAN TINGKAT TINGGI</span>
            </div>
            <h2 className="z-display-2 text-neutral-900">
              Diawasi Dewan Syariah &{' '}
              <span className="text-primary-700">Auditor Kriptografi Independen.</span>
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Memastikan kepatuhan syariah mutlak atas 8 asnaf dan ketetapan fiqih zakat,
              didampingi audit integritas kriptografis digital berstandar nasional.
            </p>
          </div>

          <Link
            href="/docs#syariah"
            className="inline-flex items-center gap-2 text-xs font-bold text-primary-700 hover:text-primary-800 transition-colors"
          >
            <span>Pelajari Standar Syariah Selengkapnya</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Filter Tabs / Category Pills (Matching 00:37 in video) */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary-700 text-white shadow-xs'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/90'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Members Grid (Matching 00:37 in video) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:border-primary-600/40 transition-all text-left flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Avatar Badge Placeholder */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-800 flex items-center justify-center font-extrabold text-sm font-mono border border-primary-200">
                    {member.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {member.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900 leading-snug">
                    {member.name}
                  </h3>
                  <span className="block text-xs font-semibold text-primary-700 mt-0.5">
                    {member.role}
                  </span>
                  <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                    {member.credentials}
                  </p>
                </div>
              </div>

              {/* Schedule and Rating footer */}
              <div className="mt-5 pt-3 border-t border-neutral-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <strong className="text-neutral-900">{member.rating}</strong> ({member.casesReviewed})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span>{member.schedule}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
