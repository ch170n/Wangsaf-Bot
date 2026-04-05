import config from '../../config.js';

export default async function (sock, msg, remoteJid, args) {
    const url = args[0];
    
    if (!url || !url.startsWith('http')) {
        return await sock.sendMessage(
            remoteJid, 
            { text: `Sertakan link/URL panjang yang ingin dipendekkan!\n\nContoh: *${config.prefix}tinyurl https://sebuah-situs-panjang-sekali.com/teks*` }, 
            { quoted: msg }
        );
    }

    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Sedang memperpendek URL Anda melalui TinyURL...' }, { quoted: msg });

        const endpoint = `https://exsalapi.my.id/api/tools/tinyurl?apikey=${config.apiKeyExsal}&url=${encodeURIComponent(url)}`;
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.status === true && data.data) {
            const shortUrl = data.data.url;

            const replyText = shortUrl;
                              
            await sock.sendMessage(remoteJid, { text: replyText }, { quoted: msg });
        } else {
            await sock.sendMessage(remoteJid, { text: `😔 Maaf, gagal meracik tautan: ${data.message || 'URL Tidak Valid.'}` }, { quoted: msg });
        }

    } catch (error) {
        console.error('Error saat fetch TinyURL:', error);
        await sock.sendMessage(remoteJid, { text: 'Waduh, koneksi ke server TinyURL sedang terjalin buruk 😢 Coba lagi nanti!' }, { quoted: msg });
    }
};
