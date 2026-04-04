import sharp from 'sharp';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default async function (sock, msg, remoteJid) {
    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Memproses stiker...' }, { quoted: msg });

        // Temukan payload gambar
        let mediaPayload;
        const type = Object.keys(msg.message)[0];
        
        if (type === 'imageMessage') {
            mediaPayload = msg.message.imageMessage;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
            mediaPayload = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
        }

        if (!mediaPayload) {
            return await sock.sendMessage(remoteJid, { text: 'Gagal! Hanya mendukung gambar saat ini.' }, { quoted: msg });
        }

        // 1. Unduh buffer original gambar JPEG langsung dari WhatsApp
        const stream = await downloadContentFromMessage(mediaPayload, 'image');
        let rawBuffer = Buffer.from([]);
        for await(const chunk of stream) {
            rawBuffer = Buffer.concat([rawBuffer, chunk]);
        }

        // 2. Buat Stiker secara manual menggunakan SHARP (Tanpa library misterius)
        // Standar stiker WA adalah image WebP berukuran 512x512
        const stickerBuffer = await sharp(rawBuffer)
            .resize(512, 512, {
                fit: 'contain', // Menjaga proporsi gambar tidak penyok
                background: { r: 255, g: 255, b: 255, alpha: 0 } // Background transparan
            })
            .webp({ quality: 70 })
            .toBuffer();
        
        // 3. Kirim ke user
        await sock.sendMessage(remoteJid, { sticker: stickerBuffer }, { quoted: msg });

    } catch (error) {
        console.error('Error saat konversi manual ke stiker:', error);
        await sock.sendMessage(remoteJid, { text: 'Yahh, gagal merender stiker 😢' }, { quoted: msg });
    }
};
