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
import whatanimeCommand from '../commands/tools/whatanime.js';
import fbdlCommand from '../commands/tools/fbdl.js';
import tinyurlCommand from '../commands/tools/tinyurl.js';
import sholatCommand from '../commands/tools/sholat.js';

export const handleMessage = async (sock, m) => {
    try {
        if (!m.messages || !m.messages.length) return;
        const msg = m.messages[0];

        // Jangan proses pesan dari bot sendiri
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        
        // Membongkar struktur pesan jika bentuknya Ephemeral (Pesan Sementara) atau View Once
        let actualMessage = msg.message;
        const msgType = Object.keys(msg.message)[0];
        
        if (msgType === 'ephemeralMessage') {
            actualMessage = msg.message.ephemeralMessage.message;
        } else if (msgType === 'viewOnceMessageV2' || msgType === 'viewOnceMessage') {
            actualMessage = msg.message[msgType].message;
        }

        // Tipe jeroan/murni (misal: imageMessage, videoMessage) setelah dibongkar
        const type = Object.keys(actualMessage)[0];

        // Teks bisa didapat dari obrolan, atau tambahan pada media (caption)
        const textMessage = actualMessage?.conversation || 
                            actualMessage?.extendedTextMessage?.text || 
                            actualMessage?.imageMessage?.caption || 
                            actualMessage?.videoMessage?.caption || "";

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
            else if (cmd === 'whatanime' || cmd === 'wait') {
                await whatanimeCommand(sock, msg, remoteJid, args);
            }
            else if (cmd === 'tinyurl' || cmd === 'shortener' || cmd === 'short') {
                await tinyurlCommand(sock, msg, remoteJid, args);
            }
            else if (cmd === 'sholat' || cmd === 'jadwalsholat') {
                await sholatCommand(sock, msg, remoteJid, args);
            }
            else if (cmd === 'fbdl' || cmd === 'fb') {
                await fbdlCommand(sock, msg, remoteJid, args);
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
