import config from '../../config.js';

export default async function (sock, msg, remoteJid, args) {
    // Gabungkan array argumen menjadi satu string kalimat pertanyaan utuh
    const text = args.join(' ');
    
    // Validasi jika user hanya mengetik /ai tanpa pertanyaan
    if (!text) {
        return await sock.sendMessage(
            remoteJid, 
            { text: `Halo! Tolong masukkan pertanyaanmu bersertaan dengan kodenya!\n\nContoh: *${config.prefix}ai* Apa itu framework React.js?` }, 
            { quoted: msg }
        );
    }

    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Sedang memikirkan jawaban...' }, { quoted: msg });

        // Mengambil respons dari API ExsalAPI (v2)
        const endpoint = `https://exsalapi.my.id/api/ai/text/gpt-4o-mini/v2?apikey=${config.apiKey}&text=${encodeURIComponent(text)}`;
        
        // Node 18+ sudah memiliki fitur 'fetch' secara bawaan sehingga kita tak membuang memori tambahan
        const response = await fetch(endpoint);
        const data = await response.json();

        // Mengambil string pesan secara spesifik sesuai struktur respons API
        let aiReply = data?.data?.content;

        // Validasi apabila API gagal merespons dengan konten (atau error/sedang limit)
        if (!aiReply) {
             aiReply = "Maaf, Chat GPT sedang mengalami gangguan / tidak ada respons.";
        } else if (typeof aiReply !== 'string') {
             aiReply = JSON.stringify(aiReply);
        }

        // Mengirimkan hasil AI kembali ke nomor user
        await sock.sendMessage(remoteJid, { text: aiReply }, { quoted: msg });

    } catch (error) {
        console.error('Error saat fetch ChatGPT API:', error);
        await sock.sendMessage(remoteJid, { text: 'Waduh, koneksi ke Chat GPT sedang terputus 😢 Coba lagi dalam beberapa saat!' }, { quoted: msg });
    }
};
