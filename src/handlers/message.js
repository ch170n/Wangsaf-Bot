import config from '../config.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

// Import commands
import pingCommand from '../commands/tools/ping.js';
import stikerCommand from '../commands/tools/stiker.js';
import startCommand from '../commands/general/start.js';
import helpCommand from '../commands/general/help.js';

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
            else if (cmd === 'stiker' || cmd === 'sticker' || cmd === 's') {
                const isQuotedImage = msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
                // Jika user langsung ngirim gambar dengan caption /stiker, ATAU dia mereply pesan berisikan gambar
                if (type === 'imageMessage' || isQuotedImage) {
                    await stikerCommand(sock, msg, remoteJid);
                } else {
                    await sock.sendMessage(remoteJid, { text: `Harap kirimkan gambar beserta caption *${config.prefix}stiker* atau balas (reply) gambar temanmu dengan *${config.prefix}stiker*` }, { quoted: msg });
                }
            }
        }

    } catch (error) {
        console.error('Error saat menangani pesan:', error);
    }
};
