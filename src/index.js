import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

import { handleConnection } from './handlers/connection.js';
import { handleMessage } from './handlers/message.js';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Menggunakan WA v${version.join('.')}, Status: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: Browsers.macOS('Desktop'),
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        
        // Selalu memunculkan QR Code ketika aplikasi butuh login
        if (qr) {
            console.log('\n======================================================');
            console.log('Tunggu sebentar... QR Code akan segera muncul...');
            qrcode.generate(qr, { small: true });
            console.log('Silakan buka WhatsApp > Perangkat Tertaut > Tautkan Perangkat > Lalu Scan QR di atas!');
            console.log('======================================================\n');
        }
        
        handleConnection(update, startBot);
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', (m) => {
        // Mencegah pengeksekusian ulang command saat bot pindah dari lokal ke VPS (Sync History)
        if (m.type === 'notify') {
            handleMessage(sock, m);
        }
    });
}

startBot();
