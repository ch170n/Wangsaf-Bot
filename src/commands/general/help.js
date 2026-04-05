import config from '../../config.js';

export default async function (sock, msg, remoteJid) {
    const text = `=====[ DAFTAR PERINTAH ]=====

🤖 *Bot Info*
- *${config.prefix}start* - Melihat deskripsi bot
- *${config.prefix}help* atau *${config.prefix}menu* - Menampilkan daftar perintah
- *${config.prefix}ping* - Mengecek respon server

🧠 *Artifical Intelligence*
- *${config.prefix}chatgpt* atau *${config.prefix}cgpt* - ChatGPT chat (GPT-4o Mini)
- *${config.prefix}gemini* - Google Gemini chat (Gemini 2.5 Flash)
- *${config.prefix}grok* - Grok xAI chat (Grok 3 Mini)

🛠️ *Tools & Media*
- *${config.prefix}stiker* atau *${config.prefix}s* - Mengubah gambar/video jadi stiker
- *${config.prefix}dl* - Download video/image (Tiktok, IG, X)
- *${config.prefix}fbdl* atau *${config.prefix}fb* - Facebook video downloader (HD)
- *${config.prefix}qrcode* atau *${config.prefix}qr* - Buat QR Code dari teks/link
- *${config.prefix}whatanime* atau *${config.prefix}wait* - Melacak judul anime dari gambar/url
- *${config.prefix}tinyurl* atau *${config.prefix}short* - Memperpendek URL Link
- *${config.prefix}sholat* - Jadwal sholat hari ini berdasarkan kota
- *${config.prefix}mahasiswa* atau *${config.prefix}mhs* - Cek data Mahasiswa Indonesia melalui nama
`;

    await sock.sendMessage(
        remoteJid, 
        { text: text }, 
        { quoted: msg }
    );
};
