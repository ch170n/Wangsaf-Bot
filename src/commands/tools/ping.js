export default async function (sock, msg, remoteJid) {
    const messageTimestamp = Number(msg.messageTimestamp) * 1000;
    
    const latency = Date.now() - messageTimestamp;

    const responseText = `Bot aktif dan berjalan normal.\nLatensi: ${latency}ms`;

    await sock.sendMessage(
        remoteJid, 
        { text: responseText }, 
        { quoted: msg }
    );
};