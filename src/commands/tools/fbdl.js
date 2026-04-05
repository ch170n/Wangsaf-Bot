import config from '../../config.js';

export default async function (sock, msg, remoteJid, args) {
    const url = args[0];
    
    if (!url || !url.startsWith('http')) {
        return await sock.sendMessage(
            remoteJid, 
            { text: `Masukkan link Video Facebook yang valid!\n\nContoh: *${config.prefix}fbdl https://www.facebook.com/watch/?v=12345...*` }, 
            { quoted: msg }
        );
    }

    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Sedang melacak dan mengekstraksi video dari Facebook...' }, { quoted: msg });

        let endpoint = `https://api.bagahproject.com/api/facebook-downloader-s2?apikey=${config.apiKeyBagah}&url=${encodeURIComponent(url)}`;
        let response = await fetch(endpoint, { headers: { 'x-api-key': config.apiKeyBagah } });
        let data = await response.json();

        // Fallback ganti Token jika Token Utama habis
        if (data.success === false && config.apiKeyBagahFallback) {
            console.log('API Key FB Downloader sedang dalam limit, mengalihkan ke Token API 2...');
            endpoint = `https://api.bagahproject.com/api/facebook-downloader-s2?apikey=${config.apiKeyBagahFallback}&url=${encodeURIComponent(url)}`;
            response = await fetch(endpoint, { headers: { 'x-api-key': config.apiKeyBagahFallback } });
            data = await response.json();
        }

        if (data.success === true && data.data && data.data.results && data.data.results.length > 0) {
            const videoMetadata = data.data.results[0];
            const description = data.data.description ? data.data.description.substring(0, 150) + "..." : 'Tanpa Deskripsi';

            // Eksekusi pengiriman media ke WhatsApp
            await sock.sendMessage(
                remoteJid, 
                { 
                    video: { url: videoMetadata.url }, 
                    caption: `📥 ${description} ${videoMetadata.quality}` 
                }, 
                { quoted: msg }
            );

        } else {
            const apiMessage = data.message || JSON.stringify(data).substring(0, 150);
            await sock.sendMessage(remoteJid, { text: `😔 Proses gagal. Terdapat penolakan dari API:\n\n*Pesan Asli Server:* ${apiMessage}\n\n*Catatan:* Pastikan video tidak di-set *Private* dan tautan Anda valid.` }, { quoted: msg });
        }

    } catch (error) {
        console.error('Error saat fetch Facebook API:', error);
        await sock.sendMessage(remoteJid, { text: 'Koneksi ke arsitektur Facebook Downloader sedang terputus 😢 Coba lagi beberapa saat!' }, { quoted: msg });
    }
};
