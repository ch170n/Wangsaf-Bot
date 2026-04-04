import { DisconnectReason } from '@whiskeysockets/baileys';
import fs from 'fs';

export const handleConnection = async (update, startBot) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        console.log('Koneksi terputus, alasan:', lastDisconnect?.error?.message, 'Rekonek:', shouldReconnect);

        // Jika unauthorized (401), session sudah rusak atau ditolak
        if (statusCode === 401 || statusCode === DisconnectReason.loggedOut) {
            console.log('Sesi ditolak (401 Unauthorized). Menghapus folder session...');
            try {
                fs.rmSync('./session', { recursive: true, force: true });
                console.log('Folder session berhasil dihapus. Silakan restart program (node src/index.js) untuk scan QR baru.');
            } catch(e) {
                console.log('Gagal menghapus folder session, harap hapus folder "session" secara manual.');
            }
            // Keluar dari bot agar tidak infinite loop
            process.exit(1);
        }

        if (shouldReconnect) {
            startBot();
        }
    } else if (connection === 'open') {
        console.log('✅ Bot berhasil terhubung ke WhatsApp!');
    }
};
