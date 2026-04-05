import config from '../../config.js';

export default async function (sock, msg, remoteJid, args) {
    const text = args.join(' ');
    
    // Validasi jika user hanya mengetik perintah tanpa pertanyaan
    if (!text) {
        return await sock.sendMessage(
            remoteJid, 
            { text: `Halo! Tolong masukkan pertanyaanmu bersertaan dengan kodenya!\n\nContoh: *${config.prefix}ai* Apa itu framework React.js?` }, 
            { quoted: msg }
        );
    }

    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Sedang memikirkan jawaban...' }, { quoted: msg });

        const endpoint = `https://exsalapi.my.id/api/ai/text/gpt-4o-mini/v2?apikey=${config.apiKeyExsal}&text=${encodeURIComponent(text)}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();

        let aiReply = data?.data?.content;

        // Validasi apabila API gagal merespons dengan konten (atau error/sedang limit)
        if (!aiReply) {
             aiReply = "Maaf, Chat GPT sedang mengalami gangguan / tidak ada respons.";
        } else if (typeof aiReply !== 'string') {
             aiReply = JSON.stringify(aiReply);
        }

        // Mengirimkan respon chatgpt kembali ke nomor user
        await sock.sendMessage(remoteJid, { text: aiReply }, { quoted: msg });

    } catch (error) {
        console.error('Error saat fetch ChatGPT API:', error);
        await sock.sendMessage(remoteJid, { text: 'Waduh, koneksi ke Chat GPT sedang terputus 😢 Coba lagi dalam beberapa saat!' }, { quoted: msg });
    }
};
