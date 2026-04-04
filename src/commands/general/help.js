import config from '../../config.js';

export default async function (sock, msg, remoteJid) {
    const text = `=====[ 📜 DAFTAR PERINTAH ]=====

🤖 *Bot Info*
├ *${config.prefix}start* - Melihat deskripsi bot
├ *${config.prefix}help* - Menampilkan daftar perintah
├ *${config.prefix}ping* - Mengecek respon server

🛠️ *Tools & Media*
├ *${config.prefix}stiker* - Mengubah gambar jadi stiker (bisa juga /s)

_Cara Pakai Stiker: Kirim gambar dengan tulisan awalan ${config.prefix}stiker, atau Reply (balas) gambar teman dengan tulisan ${config.prefix}stiker._
`;

    await sock.sendMessage(
        remoteJid, 
        { text: text }, 
        { quoted: msg }
    );
};
