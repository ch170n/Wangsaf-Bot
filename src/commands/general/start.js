import config from '../../config.js';

export default async function (sock, msg, remoteJid) {
    const text = `Selamat datang di *${config.botName}* yang dibuat oleh *${config.ownerBot}*.

Untuk lihat bot ini bisa apa saja, silahkan cek lewat perintah _${config.prefix}help_ yh😁`;

    await sock.sendMessage(
        remoteJid, 
        { text: text }, 
        { quoted: msg }
    );
};
