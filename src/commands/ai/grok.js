import config from '../../config.js';

export default async function (sock, msg, remoteJid, args) {
    const text = args.join(' ');
    
    // Validasi jika user hanya mengetik perintah tanpa pertanyaan
    if (!text) {
        return await sock.sendMessage(
            remoteJid, 
            { text: `Mau nanya apa nih ke Grok?\n\nContoh: *${config.prefix}grok* Jelaskan teori relativitas dengan bahasa santai!` }, 
            { quoted: msg }
        );
    }

    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Sedang memikirkan jawaban...' }, { quoted: msg });

        const endpoint = `https://exsalapi.my.id/api/ai/text/grok-3-mini?apikey=${config.apiKey}&text=${encodeURIComponent(text)}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();

        let aiReply = data?.data?.content;

        // Validasi apabila API gagal merespons dengan konten (atau error/sedang limit)
        if (!aiReply) {
             aiReply = "Maaf, Grok sedang sibuk / tidak ada respons.";
        } else if (typeof aiReply !== 'string') {
             aiReply = JSON.stringify(aiReply);
        }

        // Mengirimkan respon chatgpt kembali ke nomor user
        await sock.sendMessage(remoteJid, { text: aiReply }, { quoted: msg });

    } catch (error) {
        console.error('Error saat fetch Grok API:', error);
        await sock.sendMessage(remoteJid, { text: 'Koneksi ke server Grok sedang terputus 😢 Coba lagi nanti!' }, { quoted: msg });
    }
};
