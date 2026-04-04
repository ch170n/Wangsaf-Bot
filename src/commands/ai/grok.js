import config from '../../config.js';

export default async function (sock, msg, remoteJid, args) {
    const text = args.join(' ');
    
    // Validasi input pertanyaan
    if (!text) {
        return await sock.sendMessage(
            remoteJid, 
            { text: `Mau nanya apa nih ke Grok?\n\nContoh: *${config.prefix}grok* Jelaskan teori relativitas dengan bahasa santai!` }, 
            { quoted: msg }
        );
    }

    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Sedang memikirkan jawaban...' }, { quoted: msg });

        // Endpoint Grok (Memakai parameter "text")
        const endpoint = `https://exsalapi.my.id/api/ai/text/grok-3-mini?apikey=${config.apiKey}&text=${encodeURIComponent(text)}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();

        // Path JSON spesifik Grok (sama dengan format GPT v2)
        let aiReply = data?.data?.content;

        if (!aiReply) {
             aiReply = "Maaf, Grok sedang sibuk / tidak ada respons.";
        } else if (typeof aiReply !== 'string') {
             aiReply = JSON.stringify(aiReply);
        }

        // Tembakkan balasan
        await sock.sendMessage(remoteJid, { text: aiReply }, { quoted: msg });

    } catch (error) {
        console.error('Error saat fetch Grok API:', error);
        await sock.sendMessage(remoteJid, { text: 'Koneksi ke server Grok sedang terputus 😢 Coba lagi nanti!' }, { quoted: msg });
    }
};
