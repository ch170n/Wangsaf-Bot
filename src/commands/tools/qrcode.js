import config from '../../config.js';

export default async function (sock, msg, remoteJid, args) {
    const text = args.join(' ');
    
    if (!text) {
        return await sock.sendMessage(
            remoteJid, 
            { text: `Masukkan teks atau link URL yang ingin diubah menjadi QR Code!\n\nContoh: *${config.prefix}qr https://google.com*` }, 
            { quoted: msg }
        );
    }

    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Sedang mencetak QR Code...' }, { quoted: msg });

        const endpoint = `https://exsalapi.my.id/api/maker/qr-code?apikey=${config.apiKey}&text=${encodeURIComponent(text)}`;
        
        // Kita mengambil respons fetch, lalu mengubah isi unduhannya langsung menjadi binari Buffer
        const response = await fetch(endpoint);
        
        // Biasanya API mengembalikan JSON jika terjadi error (seperti Invalid API Key), 
        // tapi gambar murni saat sukses. Kita pastikan statusnya berhasil.
        if (!response.ok) {
            throw new Error('Gagal mendapatkan gambar dari API');
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Mengirimkannya ke chat sebagai tipe Image
        await sock.sendMessage(
            remoteJid, 
            { 
                image: buffer, 
                caption: `✅ Kode QR berhasil dibuat!\nIsi: ${text}` 
            }, 
            { quoted: msg }
        );

    } catch (error) {
        console.error('Error saat fetch pembuat QR Code:', error);
        await sock.sendMessage(remoteJid, { text: 'Waduh, koneksi ke mesin pembuat QR sedang terputus 😢 Coba lagi nanti!' }, { quoted: msg });
    }
};
