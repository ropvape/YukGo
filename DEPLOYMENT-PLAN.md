# YUKGO.LIVE — 24/7 Deployment Plan
## Dari Laptop ke Always-On Cloud

---

## MASALAH SAAT INI

```
Laptop → Node.js agents jalan lokal
  ↓
Laptop mati/sleep → Bot mati
  ↓
Event baru tidak ter-scrape
Website data tidak update
```

## SOLUSI: DEPLOY KE CLOUD

### Opsi A: Railway.app (REKOMENDASI)
```
Harga:     $5/bulan (Starter plan)
Specs:     1 vCPU, 512MB RAM, 1GB disk
Fitur:     Always-on, auto-restart, cron jobs built-in
Deploy:    GitHub push → auto deploy
Cocok:     Bot scraping + API backend

Yang perlu:
  1. Buat akun Railway (railway.app)
  2. Connect GitHub repo
  3. Deploy agents sebagai "Worker" service
  4. Setup cron di Railway (setiap 6 jam)
  5. Deploy website sebagai "Web" service (opsional, bisa tetap di Vercel)

Biaya bulanan:
  Railway Starter:     $5
  OpenAI API:          $5-10
  ────────────────────
  TOTAL:               $10-15/bulan (~Rp 150-225rb)
```

### Opsi B: Hetzner VPS (Paling Murah)
```
Harga:     €4.5/bulan (~$5)
Specs:     2 vCPU, 4GB RAM, 40GB disk
Fitur:     Full Linux server, install apapun
Deploy:    SSH + manual setup
Cocok:     Semua (bot + website + database)

Yang perlu:
  1. Sewa VPS di hetzner.com
  2. Install Node.js, PM2, nginx
  3. Clone repo + setup cron
  4. Point domain yukgo.live ke VPS
  5. Setup SSL (Let's Encrypt)

Biaya bulanan:
  Hetzner VPS:         €4.5 (~$5)
  Domain:              sudah ada
  OpenAI API:          $5-10
  ────────────────────
  TOTAL:               $10-15/bulan (~Rp 150-225rb)
```

### Opsi C: Vercel Cron + Serverless (Paling Mudah, Terbatas)
```
Harga:     $0 (Hobby) atau $20 (Pro)
Fitur:     Vercel Cron → panggil API route setiap X jam
Limit:     Timeout 60 detik per request (terlalu pendek untuk scraping)
Cocok:     Trigger saja, bukan scraping berat

TIDAK DIREKOMENDASIKAN untuk full pipeline karena timeout.
```

---

## REKOMENDASI: RAILWAY.APP

Kenapa Railway:
1. **Mudah** — Git push auto deploy, tidak perlu manage server
2. **Cron built-in** — Tidak perlu install cron eksternal
3. **Always-on** — Bot jalan 24/7 tanpa peduli laptop
4. **Murah** — $5/bulan sudah cukup untuk bot scraping
5. **Scaling** — Naik plan kalau traffic naik

### Architecture di Railway:

```
┌─────────────────────────────────────────────┐
│              RAILWAY PROJECT                 │
│                                              │
│  ┌──────────────────┐  ┌──────────────────┐ │
│  │  WORKER SERVICE   │  │  WEB SERVICE     │ │
│  │  (Event Hunter)   │  │  (Next.js)       │ │
│  │                   │  │                  │ │
│  │  - Scraping 6 jam │  │  - yukgo.live    │ │
│  │  - Content gen    │  │  - Admin panel   │ │
│  │  - Auto-convert   │  │  - API routes    │ │
│  └──────────────────┘  └──────────────────┘ │
│                                              │
│  ┌──────────────────┐  ┌──────────────────┐ │
│  │  CRON TRIGGER     │  │  SHARED VOLUME   │ │
│  │  Setiap 6 jam     │  │  data/ folder    │ │
│  │  → run agents     │  │  (events, dll)   │ │
│  └──────────────────┘  └──────────────────┘ │
│                                              │
└─────────────────────────────────────────────┘
         ↓ auto-deploy
    https://yukgo.live
```

---

## LANGKAH DEPLOY KE RAILWAY

### Step 1: Persiapan
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Buat project baru
railway init
```

### Step 2: Restructure Project
```
yukgo-live/
├── agents/           # Agent scripts
│   ├── event-hunter.js
│   └── content-factory.js
├── scripts/          # Utility scripts
│   └── convert-events.mjs
├── data/             # Data files (shared volume)
│   └── events/
├── website/          # Next.js frontend
│   ├── src/
│   └── package.json
├── railway.toml      # Railway config
├── Procfile          # Process definitions
└── package.json      # Root package.json
```

### Step 3: Railway Config (railway.toml)
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node agents/event-hunter.js --cities=all && node scripts/convert-events.mjs"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

### Step 4: Setup Cron di Railway
```
Railway tidak punya cron built-in.
Alternatif: gunakan node-cron di dalam script.

Buat file agents/cron-runner.js:
  - Jalankan event-hunter setiap 6 jam
  - Jalankan content-factory setiap 12 jam
  - Auto-convert + commit + push (trigger Vercel deploy)
```

### Step 5: Deploy
```bash
# Deploy worker
railway up

# Atau connect GitHub repo untuk auto-deploy
```

---

## ALTERNATIF: TETAP DI VERCEL + EXTERNAL CRON

Kalau tidak mau sewa server baru:

```
1. Website tetap di Vercel (sudah jalan)
2. Agents jalan di laptop (sama seperti sekarang)
3. Tambah UptimeRobot (gratis) → ping laptop setiap 5 menit
4. Setup Wake-on-LAN → laptop auto-wake dari sleep

Tapi ini tidak 24/7 sejati. Laptop tetap perlu hidup.
```

---

## NEXT STEPS

```
□ Pilih platform: Railway / Hetzner / tetap lokal
□ Setup akun + deploy
□ Test cron otomatis
□ Monitor 1 minggu
□ Scale kalau perlu
```
