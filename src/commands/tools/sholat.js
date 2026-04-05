import config from '../../config.js';

export default async function (sock, msg, remoteJid, args) {
    const keyword = args.join(' ');
    
    if (!keyword) {
        return await sock.sendMessage(
            remoteJid, 
            { text: `Masukkan nama kota atau kabupaten!\n\nContoh: *${config.prefix}sholat jakarta*` }, 
            { quoted: msg }
        );
    }

    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Sedang meramban data wilayah...' }, { quoted: msg });

        // Langkah 1: Merogoh ID Kota/Kabupaten melalui keyword
        const searchEndpoint = `https://api.myquran.com/v3/sholat/kabkota/cari/${encodeURIComponent(keyword)}`;
        const searchResponse = await fetch(searchEndpoint, { headers: { 'Accept': 'application/json' } });
        const searchData = await searchResponse.json();

        if (!searchData.status || !searchData.data || searchData.data.length === 0) {
            return await sock.sendMessage(remoteJid, { text: `😔 Maaf, kota/kabupaten "${keyword}" tidak berhasil diidentifikasi. Coba ketik dengan nama daerah aslinya.` }, { quoted: msg });
        }

        const cityId = searchData.data[0].id;

        // Langkah 2: Mengambil Jadwal Hari Ini berdasarkan ID presisi
        const scheduleEndpoint = `https://api.myquran.com/v3/sholat/jadwal/${cityId}/today`;
        const scheduleResponse = await fetch(scheduleEndpoint, { headers: { 'Accept': 'application/json' } });
        const scheduleData = await scheduleResponse.json();

        if (scheduleData.status && scheduleData.data && scheduleData.data.jadwal) {
            const dataExtracted = scheduleData.data;
            
            // Jadwal dikemas dalam object dengan Key tanggal hari ini, 
            // Kita tarik Object.values untuk langsung mendapatkan isi dari hari pertama (today)
            const jadwalHarian = Object.values(dataExtracted.jadwal)[0];

            if (!jadwalHarian) {
                return await sock.sendMessage(remoteJid, { text: '😔 API tidak menyediakan data jadwal untuk masa ini.' }, { quoted: msg });
            }

            const replyText = `🕌 *JADWAL SHOLAT*\n\n` +
                              `📍 Lokasi: ${dataExtracted.kabko}, ${dataExtracted.prov}\n` +
                              `🗓️ Tanggal: ${jadwalHarian.tanggal}\n\n` +
                              `🌅 Imsak: *${jadwalHarian.imsak}*\n` +
                              `🌤️ Subuh: *${jadwalHarian.subuh}*\n` +
                              `⛅ Terbit: *${jadwalHarian.terbit}*\n` +
                              `☀️ Dhuha: *${jadwalHarian.dhuha}*\n` +
                              `🌞 Dzuhur: *${jadwalHarian.dzuhur}*\n` +
                              `🌥️ Ashar: *${jadwalHarian.ashar}*\n` +
                              `🌇 Maghrib: *${jadwalHarian.maghrib}*\n` +
                              `🌙 Isya: *${jadwalHarian.isya}*`;
                              
            await sock.sendMessage(remoteJid, { text: replyText }, { quoted: msg });
        } else {
            await sock.sendMessage(remoteJid, { text: `😔 Terjadi kesalahan arsitektur backend saat membalas data sholat dari ${searchData.data[0].lokasi}.` }, { quoted: msg });
        }

    } catch (error) {
        console.error('Error saat fetch Jadwal Sholat API:', error);
        await sock.sendMessage(remoteJid, { text: 'Pusat server MyQuran sedang mengalami kelebihan beban 😢 Coba tanyakan lagi nanti!' }, { quoted: msg });
    }
};
