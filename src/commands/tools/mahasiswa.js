import config from '../../config.js';

export default async function (sock, msg, remoteJid, args) {
    const nama = args.join(' ');
    
    if (!nama) {
        return await sock.sendMessage(
            remoteJid, 
            { text: `Masukkan nama mahasiswa yang ingin dicari!\n\nContoh: *${config.prefix}mahasiswa Bahlil Lahadalia*` }, 
            { quoted: msg }
        );
    }

    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Sedang mengumpulkan data dari server...' }, { quoted: msg });

        const endpoint = `https://exsalapi.my.id/api/search/mahasiswa?apikey=${config.apiKey}&nama=${encodeURIComponent(nama)}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();

        // Mengecek apakah respons valid dan data array tidak kosong
        if (data.status === true && data.result && data.result.length > 0) {
            let replyText = `🎓 *HASIL PENCARIAN MAHASISWA*\nDitemukan: ${data.found} kecocokan data\n\n`;
            
            // Loop data array yang dikembalikan dari API untuk disusun menjadi string chat yang rapi
            data.result.forEach((mhs, index) => {
                replyText += `*${index + 1}. ${mhs.nama.split('(')[0].trim()}*\n`; // Menghilangkan double text nama jika format API menyatukan NIM 
                replyText += `- NIM: ${mhs.nim}\n`;
                replyText += `- Kampus: ${mhs.nama_pt}\n`;
                replyText += `- Prodi: ${mhs.prodi}\n\n`;
            });

            // Kirimkan teks final ke WA pengguna
            await sock.sendMessage(remoteJid, { text: replyText.trim() }, { quoted: msg });
        } else {
            await sock.sendMessage(remoteJid, { text: `😔 Maaf, data mahasiswa dengan nama *${nama}* tidak ditemukan di sistem.` }, { quoted: msg });
        }

    } catch (error) {
        console.error('Error saat fetch Mahasiswa API:', error);
        await sock.sendMessage(remoteJid, { text: 'Koneksi ke database PDDikti sedang terputus/lemot 😢 Coba lagi nanti!' }, { quoted: msg });
    }
};
