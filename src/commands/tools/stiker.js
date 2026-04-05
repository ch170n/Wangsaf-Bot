import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default async function (sock, msg, remoteJid) {
    let tempIn, tempOut;
    try {
        await sock.sendMessage(remoteJid, { text: '⏳ Mengekstrak media untuk stiker (Platform Murni)...' }, { quoted: msg });

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
        
        if (isVideo && !isGif && mediaPayload.seconds > 10) {
            return await sock.sendMessage(remoteJid, { text: 'Durasi video maksimal adalah 10 detik untuk stiker bergerak!' }, { quoted: msg });
        }

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
            // Konversi Gambar Statis menggunakan Sharp
            stickerBuffer = await sharp(rawBuffer)
                .resize(512, 512, {
                    fit: 'contain', 
                    background: { r: 255, g: 255, b: 255, alpha: 0 } 
                })
                .webp({ quality: 70 })
                .toBuffer();
        } else {
            // Menggunakan child_process
            // Mengamankan temp direktori agar kompeten dengan environment OS manapun
            const tempDir = os.tmpdir();
            const tempPrefix = path.join(tempDir, `stiker_${Date.now()}`);
            const inputExt = isGif ? '.gif' : '.mp4'; 
            
            tempIn = tempPrefix + inputExt;
            tempOut = tempPrefix + '.webp';
            
            fs.writeFileSync(tempIn, rawBuffer);
            
            await new Promise((resolve, reject) => {
                // Di Linux, path FFMPEG native / bawaan sistem akan digunakan (bukan library)
                // Di Windows lokal, akan fallback ke executable binary statis lokal
                const exePath = process.platform === 'linux' ? 'ffmpeg' : `"${ffmpegPath}"`;
                
                // Konfigurasi WebP untuk Standar Animasi WA WebP
                // Menggunakan black@0.0 (background transparan tanpa white-cast)
                const command = `${exePath} -i "${tempIn}" -vcodec libwebp -filter:v fps=15,scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0.0 -lossless 0 -loop 0 -preset default -an -vsync 0 -t 00:00:10 "${tempOut}"`;
                
                exec(command, (err, stdout, stderr) => {
                    if (err) {
                        console.error('Prosesor Sistem Video Error:', stderr);
                        reject(err);
                    } else resolve();
                });
            });
            
            stickerBuffer = fs.readFileSync(tempOut);
        }
        
        await sock.sendMessage(remoteJid, { sticker: stickerBuffer }, { quoted: msg });

    } catch (error) {
        console.error('Error Pembuatan Stiker Murni:', error);
        await sock.sendMessage(remoteJid, { text: 'Gagal membuat stiker. Kemungkinan besar format media melanggar aturan codec konversi 😢' }, { quoted: msg });
    } finally {
        try {
            if (tempIn && fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
            if (tempOut && fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        } catch(e) { } 
    }
};
