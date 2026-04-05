import dotenv from 'dotenv';
dotenv.config();

export default {
    botName: process.env.BOT_NAME || 'Bot WA',
    ownerBot: process.env.OWNER_BOT || 'Owner',
    prefix: process.env.PREFIX || '/',
    botNumber: process.env.BOT_NUMBER || '', // Nomor bot (dari .env)
    ownerNumber: process.env.OWNER_NUMBER ? `${process.env.OWNER_NUMBER}@s.whatsapp.net` : '',
    apiKeyExsal: process.env.API_KEY_EXSALAPI || 'freepublic',
    apiKeyBagah: process.env.API_KEY_BAGAHPROJECT || '', 
    apiKeyBagahFallback: process.env.API_KEY_BAGAHPROJECT2 || null,
};
