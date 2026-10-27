// =====================================================================
// alat/foto-contoh-template.js — MEMBUAT GAMBAR CONTOH TIAP TEMPLATE
//
// Hasil: web/assets/contoh-template/<nama>.jpg (sampul undangan demo),
// dipakai di pilihan template panel admin & katalog di beranda.
// Jalankan ulang setiap kali tampilan template berubah atau ada template baru.
//
// Cara pakai (sekali pasang):
//   1. Jalankan website lokal: folder web → python -m http.server 8000
//   2. Di folder "alat":  npm install playwright-core
//   3. node foto-contoh-template.js
// Butuh Google Chrome terpasang (lokasi bisa diganti di CHROME di bawah).
// =====================================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('playwright-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:8000';
const WEB = path.join(__dirname, '..', 'web');
const OUT = path.join(WEB, 'assets', 'contoh-template');

// Ambil daftar template dari config.js
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(WEB, 'assets', 'js', 'config.js'), 'utf8'), sandbox);
const templates = Object.keys(sandbox.window.APP_CONFIG.TEMPLATES);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  for (const key of templates) {
    await page.goto(`${BASE}/undangan/?u=demo&t=${key}&to=Tamu%20Undangan`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#cover:not([hidden])');
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(OUT, `${key}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 78 });
    console.log('dibuat', path.relative(WEB, file), Math.round(fs.statSync(file).size / 1024), 'KB');
  }
  await browser.close();
})();
