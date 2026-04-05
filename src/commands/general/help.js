import config from '../../config.js';

export default async function (sock, msg, remoteJid) {
    const text = `======[ DAFTAR PERINTAH ]======

🤖 *Bot Info*
- *${config.prefix}start* - Melihat deskripsi bot
- *${config.prefix}help* atau *${config.prefix}menu* - Menampilkan daftar perintah
- *${config.prefix}ping* - Mengecek respon server

🧠 *Artifical Intelligence*
- *${config.prefix}chatgpt* atau *${config.prefix}cgpt* - ChatGPT Chat (GPT-4o Mini)
- *${config.prefix}gemini* - Google Gemini Chat (Gemini 2.5 Flash)
- *${config.prefix}grok* - Grok xAI Chat (Grok 3 Mini)

🛠️ *Tools & Media*
- *${config.prefix}stiker* atau *${config.prefix}s* - Mengubah gambar/video jadi stiker
- *${config.prefix}dl* - Download Video/Image (Tiktok, IG, X)
- *${config.prefix}qrcode* atau *${config.prefix}qr* - Buat QR Code dari Teks/Link
- *${config.prefix}mahasiswa* atau *${config.prefix}mhs* - Cek data Mahasiswa Indonesia melalui nama
`;

    await sock.sendMessage(
        remoteJid, 
        { text: text }, 
        { quoted: msg }
    );
};
