import dotenv from 'dotenv';
dotenv.config();

export default {
    botName: process.env.BOT_NAME || 'Bot WA',
    ownerBot: process.env.OWNER_BOT || 'Owner',
    prefix: process.env.PREFIX || '/',
    botNumber: process.env.BOT_NUMBER || '', // Nomor bot (dari .env)
    ownerNumber: process.env.OWNER_NUMBER ? `${process.env.OWNER_NUMBER}@s.whatsapp.net` : '',
    apiKey: process.env.API_KEY || 'freepublic', // Key public
};
