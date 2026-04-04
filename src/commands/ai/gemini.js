import config from '../../config.js';

export default async function (sock, msg, remoteJid, args) {
    const text = args.join(' ');
    
    // Validasi input pertanyaan
    if (!text) {
        return await sock.sendMessage(
            remoteJid, 
            { text: `Mau nanya apa nih ke Gemini?\n\nContoh: *${config.prefix}gemini* Buatkan saya resep nasi goreng!` }, 
            { quoted: msg }
        );
    }

    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Sedang memikirkan jawaban...' }, { quoted: msg });

        // Endpoint Gemini (Memakai parameter "prompt" bukan "text")
        const endpoint = `https://exsalapi.my.id/api/ai/text/gemini-2.5-flash-v2?apikey=${config.apiKey}&prompt=${encodeURIComponent(text)}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();

        // Path JSON spesifik Gemini Flash (Sama dengan format GPT tadi)
        let aiReply = data?.data?.content;

        if (!aiReply) {
             aiReply = "Maaf, Gemini sedang tidur / tidak ada respons.";
        } else if (typeof aiReply !== 'string') {
             aiReply = JSON.stringify(aiReply);
        }

        // Tembakkan balasan
        await sock.sendMessage(remoteJid, { text: aiReply }, { quoted: msg });

    } catch (error) {
        console.error('Error saat fetch Gemini API:', error);
        await sock.sendMessage(remoteJid, { text: 'Koneksi ke server Google Gemini sedang terputus 😢 Coba lagi nanti!' }, { quoted: msg });
    }
};
