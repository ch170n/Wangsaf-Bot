import config from '../../config.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default async function (sock, msg, remoteJid, args) {
    let targetUrl = args[0];
    
    // Deteksi tipe media apakah dilampirkan atau di-reply
    let actualMessage = msg.message;
    const msgTypeOriginal = Object.keys(msg.message || {})[0];
    if (msgTypeOriginal === 'ephemeralMessage') {
        actualMessage = msg.message.ephemeralMessage.message;
    } else if (msgTypeOriginal === 'viewOnceMessageV2' || msgTypeOriginal === 'viewOnceMessage') {
        actualMessage = msg.message[msgTypeOriginal].message;
    }

    const type = Object.keys(actualMessage || {})[0];
    const isImage = type === 'imageMessage';
    const quotedMsg = actualMessage?.extendedTextMessage?.contextInfo?.quotedMessage;
    const isQuotedImage = quotedMsg?.imageMessage ? true : false;

    // Proses unggah gambar jika terdapat media terlampir
    if (isImage || isQuotedImage) {
        try {
            await sock.sendMessage(remoteJid, { text: '⏳ Mengekstrak gambar dan membuat lintasan maya...' }, { quoted: msg });

            const mediaMessage = isImage ? actualMessage.imageMessage : quotedMsg.imageMessage;
            const stream = await downloadContentFromMessage(mediaMessage, 'image');
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Membangun payload form-data untuk catbox.moe
            const fd = new FormData();
            fd.append('reqtype', 'fileupload');
            fd.append('fileToUpload', new Blob([buffer]), 'image.jpg');

            // Mengunggah ke server cloud sementara
            const uploadRes = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: fd });
            targetUrl = await uploadRes.text();

            if (!targetUrl.startsWith('http')) {
                throw new Error('Upload catbox gagal: ' + targetUrl);
            }
        } catch (err) {
            console.error('Error saat upload image:', err);
            return await sock.sendMessage(remoteJid, { text: '😔 Gagal mengambil/mengunggah gambar dari pesan tersebut.' }, { quoted: msg });
        }
    } else if (!targetUrl || !targetUrl.startsWith('http')) {
        return await sock.sendMessage(
            remoteJid, 
            { text: `Sertakan gambar, balas (reply) ke gambar anime, ATAU berikan URL gambarnya secara langsung!\n\nContoh Teks: *${config.prefix}whatanime https://contoh.com/gambar.jpg*` }, 
            { quoted: msg }
        );
    }

    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Menganalisis anime...' }, { quoted: msg });

        let endpoint = `https://api.bagahproject.com/api/whatanime?apikey=${config.apiKeyBagah}&url=${encodeURIComponent(targetUrl)}`;
        let response = await fetch(endpoint, { headers: { 'x-api-key': config.apiKeyBagah } });
        let data = await response.json();

        // Fallback: Jika kesuksesan gagal, ganti ke API Key kedua asalkan API Key 2 tersedia
        if (data.success === false && config.apiKeyBagahFallback) {
            console.log('API Key BagahProject utama habis, beralih ke token cadangan...');
            endpoint = `https://api.bagahproject.com/api/whatanime?apikey=${config.apiKeyBagahFallback}&url=${encodeURIComponent(targetUrl)}`;
            response = await fetch(endpoint, { headers: { 'x-api-key': config.apiKeyBagahFallback } });
            data = await response.json();
        }

        if (data.success === true && data.data && data.data.result && data.data.result.length > 0) {
            let combinedText = `🔍 *HASIL PENCARIAN ANIME*\nDitemukan ${data.data.result.length} kemungkinan sumber!\n\n`;

            // Satukan seluruh hasil anime agar dikirim sebagai 1 teks rapi untuk mencegah spam/timeout WA
            for (let i = 0; i < data.data.result.length; i++) {
                const anime = data.data.result[i];
                const similarity = (anime.similarity * 100).toFixed(2);
                
                combinedText += `*[ ${i + 1} ] ${anime.filename}*\n` +
                                `📺 Episode: ${anime.episode ? anime.episode : 'Tidak Diketahui/OVA'}\n` +
                                `⏱️ Waktu: ${anime.from}s - ${anime.to}s\n` +
                                `🎯 Kemiripan: ${similarity}%\n` +
                                `🔗 Tonton cuplikan: ${anime.video || anime.image || 'N/A'}\n\n`;
            }

            // Kirim utuh
            await sock.sendMessage(remoteJid, { text: combinedText }, { quoted: msg });

        } else {
            await sock.sendMessage(remoteJid, { text: `😔 Maaf, gambar tersebut tidak cocok dengan anime manapun di database.` }, { quoted: msg });
        }

    } catch (error) {
        console.error('Error saat fetch WhatAnime API:', error);
        await sock.sendMessage(remoteJid, { text: 'Waduh, koneksi ke server sedang terputus 😢 Coba lagi nanti!' }, { quoted: msg });
    }
};
