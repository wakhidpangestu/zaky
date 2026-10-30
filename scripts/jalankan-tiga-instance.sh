#!/bin/bash
# ==============================================================================
# Script: jalankan-tiga-instance.sh
# Menjalankan 3 Node Instance Zaky (Lembaga A, B, C) di Lingkungan Lokal
# Sesuai Bab 13 (Infrastruktur Demo)
# ==============================================================================

echo "=== Menjalankan 3 Instance Zaky Federasi Lokal ==="

# Instance Lembaga A (Port 3000)
PORT=3000 NODE_ENV=development LEMBAGA_KODE=LEMBAGA_A npm run dev &
PID_A=$!
echo "Instance A berjalan pada PID $PID_A (http://localhost:3000)"

# Instance Lembaga B (Port 3001)
PORT=3001 NODE_ENV=development LEMBAGA_KODE=LEMBAGA_B npm run dev &
PID_B=$!
echo "Instance B berjalan pada PID $PID_B (http://localhost:3001)"

# Instance Lembaga C (Port 3002)
PORT=3002 NODE_ENV=development LEMBAGA_KODE=LEMBAGA_C npm run dev &
PID_C=$!
echo "Instance C berjalan pada PID $PID_C (http://localhost:3002)"

echo "Ketiga instance siap. Tekan Ctrl+C untuk menghentikan seluruh instance."

trap "kill $PID_A $PID_B $PID_C" EXIT
wait
