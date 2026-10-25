#!/bin/bash
# ==============================================================================
# Script: serang-log.sh
# Demonstrasi Serangan Superuser Basis Data (Anti-Ubah DB Demo)
# Sesuai Bab 4, Bab 8.3, dan FR-46 s/d FR-52
# ==============================================================================

echo "=== MEMULAI SIMULASI SERANGAN LOG SUPERUSER ==="
echo "1. Mematikan sementara trigger pencegah modifikasi audit_log (Superuser Privilege)..."
echo "   ALTER TABLE audit_log DISABLE TRIGGER audit_log_tanpa_ubah;"

echo "2. Memanipulasi nominal penyaluran pada entri log historis..."
echo "   UPDATE audit_log SET sesudah = jsonb_set(sesudah, '{nominal}', '100000000') WHERE nomor = 2;"

echo "3. Mengaktifkan kembali trigger pertahanan..."
echo "   ALTER TABLE audit_log ENABLE TRIGGER audit_log_tanpa_ubah;"

echo "4. Menjalankan audit independen hitung ulang rantai log..."
npx tsx tests/serangan/test_serangan_log.ts

echo "=== DEMO SERANGAN SELESAI ==="
