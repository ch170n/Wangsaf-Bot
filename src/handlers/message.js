import config from '../config.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

// Import commands
import pingCommand from '../commands/tools/ping.js';
import stikerCommand from '../commands/tools/stiker.js';
import startCommand from '../commands/general/start.js';
import helpCommand from '../commands/general/help.js';
import aiCommand from '../commands/ai/chatgpt.js';
import geminiCommand from '../commands/ai/gemini.js';
import grokCommand from '../commands/ai/grok.js';
import mahasiswaCommand from '../commands/tools/mahasiswa.js';
import qrcodeCommand from '../commands/tools/qrcode.js';
import downloaderCommand from '../commands/tools/downloader.js';

export const handleMessage = async (sock, m) => {
    try {
        if (!m.messages || !m.messages.length) return;
        const msg = m.messages[0];

        // Jangan proses pesan dari bot sendiri
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        
        // Mendeteksi tipe file atau pengirim pesan
        const type = Object.keys(msg.message)[0];
        
        // Teks bisa didapat dari obrolan, atau tambahan pada media (caption)
        const textMessage = msg.message.conversation || 
                            msg.message.extendedTextMessage?.text || 
                            msg.message.imageMessage?.caption || 
                            msg.message.videoMessage?.caption || "";

        if (!textMessage) return;

        console.log(`[Pesan Masuk] dari ${remoteJid}: ${textMessage}`);

        // Routing perintah-perintah jika menggunakan prefix yang disetel (".", "/", dll)
        if (textMessage.startsWith(config.prefix)) {
            const args = textMessage.slice(config.prefix.length).trim().split(/ +/);
            const cmd = args.shift().toLowerCase();

            if (cmd === 'ping') {
                await pingCommand(sock, msg, remoteJid);
            } 
            else if (cmd === 'start') {
                await startCommand(sock, msg, remoteJid);
            }
            else if (cmd === 'help' || cmd === 'menu') {
                await helpCommand(sock, msg, remoteJid);
            }
            else if (cmd === 'cgpt' || cmd === 'chatgpt') {
                await aiCommand(sock, msg, remoteJid, args);
            }
            else if (cmd === 'gemini') {
                await geminiCommand(sock, msg, remoteJid, args);
            }
            else if (cmd === 'grok') {
                await grokCommand(sock, msg, remoteJid, args);
            }
            else if (cmd === 'mahasiswa' || cmd === 'mhs') {
                await mahasiswaCommand(sock, msg, remoteJid, args);
            }
            else if (cmd === 'downloader' || cmd === 'download' || cmd === 'dl') {
                await downloaderCommand(sock, msg, remoteJid, args);
            }
            else if (cmd === 'qrcode' || cmd === 'qr') {
                await qrcodeCommand(sock, msg, remoteJid, args);
            }
            else if (cmd === 'stiker' || cmd === 's') {
                const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
                const isQuotedMedia = quotedMsg?.imageMessage || quotedMsg?.videoMessage;
                
                // Jika user langsung ngirim gambar/video dengan caption /stiker, ATAU mereply media
                if (type === 'imageMessage' || type === 'videoMessage' || isQuotedMedia) {
                    await stikerCommand(sock, msg, remoteJid);
                } else {
                    await sock.sendMessage(remoteJid, { text: `Harap kirimkan media (Foto/Video Singkat) beserta caption *${config.prefix}stiker* atau balas (reply) media temanmu dengan *${config.prefix}stiker*` }, { quoted: msg });
                }
            }
        }

    } catch (error) {
        console.error('Error saat menangani pesan:', error);
    }
};
