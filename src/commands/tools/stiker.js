import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default async function (sock, msg, remoteJid) {
    let tempIn, tempOut;
    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Memproses stiker...' }, { quoted: msg });

        // Temukan payload gambar / video
        let mediaPayload;
        let isVideo = false;
        const type = Object.keys(msg.message)[0];
        
        if (type === 'imageMessage') {
            mediaPayload = msg.message.imageMessage;
        } else if (type === 'videoMessage') {
            mediaPayload = msg.message.videoMessage;
            isVideo = true;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            if (quoted.imageMessage) mediaPayload = quoted.imageMessage;
            else if (quoted.videoMessage) {
                mediaPayload = quoted.videoMessage;
                isVideo = true;
            }
        }

        if (!mediaPayload) {
            return await sock.sendMessage(remoteJid, { text: 'Gagal! Hanya mendukung gambar atau video singkat saat ini.' }, { quoted: msg });
        }
        
        // WhatsApp tidak mengizinkan stiker animasi terlalu panjang / berat
        if (isVideo && mediaPayload.seconds > 10) {
            return await sock.sendMessage(remoteJid, { text: 'Durasi video maksimal adalah 10 detik untuk stiker bergerak!' }, { quoted: msg });
        }

        // Unduh buffer original
        const streamType = isVideo ? 'video' : 'image';
        const stream = await downloadContentFromMessage(mediaPayload, streamType);
        let rawBuffer = Buffer.from([]);
        for await(const chunk of stream) {
            rawBuffer = Buffer.concat([rawBuffer, chunk]);
        }

        let stickerBuffer;

        if (!isVideo) {
            // Jika gambar statis
            stickerBuffer = await sharp(rawBuffer)
                .resize(512, 512, {
                    fit: 'contain', 
                    background: { r: 255, g: 255, b: 255, alpha: 0 } 
                })
                .webp({ quality: 70 })
                .toBuffer();
        } else {
            // Jika gambar bergerak/video
            // Membuat WebP Animasi manual menggunakan ffmpeg lokal
            const tempPrefix = path.join('./', Date.now() + '');
            tempIn = tempPrefix + '.mp4';
            tempOut = tempPrefix + '.webp';
            
            fs.writeFileSync(tempIn, rawBuffer);
            
            await new Promise((resolve, reject) => {
                // Perintah ffmpeg dasar untuk stiker WA yang valid (skala 512, format transparan rgba, looping animasi)
                const command = `"${ffmpegPath}" -i "${tempIn}" -vcodec libwebp -filter:v fps=15,scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0 -lossless 0 -loop 0 -preset default -an -vsync 0 -t 00:00:10 "${tempOut}"`;
                
                exec(command, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            stickerBuffer = fs.readFileSync(tempOut);
        }
        
        // Kirim ke user
        await sock.sendMessage(remoteJid, { sticker: stickerBuffer }, { quoted: msg });

    } catch (error) {
        console.error('Error saat konversi manual ke stiker:', error);
        await sock.sendMessage(remoteJid, { text: 'Yahh, gagal merender stiker 😢 Pastikan ukurannya normal.' }, { quoted: msg });
    } finally {
        // Bersihkan sampah temporary file video agar tidak memenuhi penyimpanan 
        try {
            if (tempIn && fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
            if (tempOut && fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        } catch(e) { } 
    }
};
