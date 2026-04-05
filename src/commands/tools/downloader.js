import config from '../../config.js';

export default async function (sock, msg, remoteJid, args) {
    const url = args[0];
    
    // Pengecekan url dasar
    if (!url || !url.startsWith('http')) {
        return await sock.sendMessage(
            remoteJid, 
            { text: `Masukkan link (URL) sosial media yang valid untuk didownload!\n\nContoh: *${config.prefix}dl https://www.instagram.com/p/DWtZjt...*` }, 
            { quoted: msg }
        );
    }

    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Sedang melacak dan mengekstraksi media dari URL tersebut...' }, { quoted: msg });

        const endpoint = `https://exsalapi.my.id/api/downloader/aio?apikey=${config.apiKey}&url=${encodeURIComponent(url)}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.status === true && data.data && data.data.media && data.data.media.length > 0) {
            const title = data.data.title || 'Media Downloader';
            
            // Mengambil semua media yang ditemukan
            for (let i = 0; i < data.data.media.length; i++) {
                const item = data.data.media[i];
                const type = item.type; 
                const mediaUrl = item.url;
                
                // Memberikan penanda urutan gambar jika terdapat lebih dari satu
                const captionText = `📥 *${title}*\n${data.data.media.length > 1 ? `(Bagian ${i + 1} dari ${data.data.media.length})` : ''}`.trim();

                // membuat Baileys mem-fetch berkas tersebut langsung ke server WhatsApp sebelum dikirim 
                if (type === 'photo' || type === 'image') {
                    await sock.sendMessage(remoteJid, { image: { url: mediaUrl }, caption: captionText }, { quoted: msg });
                } else if (type === 'video') {
                    await sock.sendMessage(remoteJid, { video: { url: mediaUrl }, caption: captionText }, { quoted: msg });
                } else {
                    // Jika mendapatkan media aneh (seperti audio track murni), kirim secara mentah sebagai file
                    await sock.sendMessage(remoteJid, { document: { url: mediaUrl }, fileName: `download_${Date.now()}`, mimetype: 'application/octet-stream', caption: captionText }, { quoted: msg });
                }
            }

        } else {
            await sock.sendMessage(remoteJid, { text: `😔 ${data.message || 'Gagal mengambil media. Pastikan URL merupakan post publik dan dapat diakses.'}` }, { quoted: msg });
        }

    } catch (error) {
        console.error('Error saat fetch Downloader API:', error);
        await sock.sendMessage(remoteJid, { text: 'Waduh, koneksi ke server All In One Downloader terputus 😢 Coba lagi nanti!' }, { quoted: msg });
    }
};
