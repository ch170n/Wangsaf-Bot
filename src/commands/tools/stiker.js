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

        // Temukan payload gambar / video (Mendukung Ephemeral / View Once)
        let actualMessage = msg.message;
        const msgTypeOriginal = Object.keys(msg.message || {})[0];
        if (msgTypeOriginal === 'ephemeralMessage') {
            actualMessage = msg.message.ephemeralMessage.message;
        } else if (msgTypeOriginal === 'viewOnceMessageV2' || msgTypeOriginal === 'viewOnceMessage') {
            actualMessage = msg.message[msgTypeOriginal].message;
        }

        let mediaPayload;
        let isVideo = false;
        let isGif = false;
        const type = Object.keys(actualMessage || {})[0];
        
        if (type === 'imageMessage') {
            mediaPayload = actualMessage.imageMessage;
        } else if (type === 'videoMessage') {
            mediaPayload = actualMessage.videoMessage;
            isVideo = true;
        } else if (type === 'documentMessage' && actualMessage.documentMessage?.mimetype === 'image/gif') {
            mediaPayload = actualMessage.documentMessage;
            isVideo = true;
            isGif = true;
        } else if (actualMessage?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = actualMessage.extendedTextMessage.contextInfo.quotedMessage;
            if (quoted.imageMessage) {
                mediaPayload = quoted.imageMessage;
            } else if (quoted.videoMessage) {
                mediaPayload = quoted.videoMessage;
                isVideo = true;
            } else if (quoted.documentMessage?.mimetype === 'image/gif') {
                mediaPayload = quoted.documentMessage;
                isVideo = true;
                isGif = true;
            }
        }

        if (!mediaPayload) {
            return await sock.sendMessage(remoteJid, { text: 'Gagal! Pastikan Anda Mengirimkan gambar, gif, atau video singkat.' }, { quoted: msg });
        }
        
        // Membatasi durasi video menjadi 10 detik
        if (isVideo && !isGif && mediaPayload.seconds > 10) {
            return await sock.sendMessage(remoteJid, { text: 'Durasi video maksimal adalah 10 detik untuk stiker bergerak!' }, { quoted: msg });
        }

        // Unduh buffer original
        let streamType = isVideo ? 'video' : 'image';
        if (isGif || type === 'documentMessage' || actualMessage?.extendedTextMessage?.contextInfo?.quotedMessage?.documentMessage) {
            streamType = 'document';
        }

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
            // Jika gambar bergerak/video/gif
            // Membuat WebP Animasi manual menggunakan ffmpeg lokal
            const tempPrefix = path.join('./', Date.now() + '');
            const inputExt = isGif ? '.gif' : '.mp4'; 
            tempIn = tempPrefix + inputExt;
            tempOut = tempPrefix + '.webp';
            
            fs.writeFileSync(tempIn, rawBuffer);
            
            await new Promise((resolve, reject) => {
                // Gunakan sistem ffmpeg jika di Linux/Docker Alpine untuk menghindari konflik glibc/musl dari ffmpeg-static
                const exePath = process.platform === 'linux' ? 'ffmpeg' : `"${ffmpegPath}"`;
                
                // Perintah ffmpeg dasar untuk stiker WA yang valid (skala 512, format transparan rgba, looping animasi)
                const command = `${exePath} -i "${tempIn}" -vcodec libwebp -filter:v fps=15,scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0 -lossless 0 -loop 0 -preset default -an -vsync 0 -t 00:00:10 "${tempOut}"`;
                
                exec(command, (err, stdout, stderr) => {
                    if (err) {
                        console.error('FFMPEG Error:', stderr);
                        reject(err);
                    } else resolve();
                });
            });
            
            stickerBuffer = fs.readFileSync(tempOut);
        }
        
        // Kirim ke user
        await sock.sendMessage(remoteJid, { sticker: stickerBuffer }, { quoted: msg });

    } catch (error) {
        console.error('Error konversi stiker:', error);
        await sock.sendMessage(remoteJid, { text: 'Gagal membuat stiker 😢 Mungkin filenya terlalu besar atau formatnya tidak didukung.' }, { quoted: msg });
    } finally {
        // Bersihkan sampah temporary file video agar tidak memenuhi penyimpanan 
        try {
            if (tempIn && fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
            if (tempOut && fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        } catch(e) { } 
    }
};
