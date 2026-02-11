import Redis from 'ioredis';

// Подключаемся к Redis через твою переменную из Vercel
const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        // 1. Инкремент счетчика
        const totalInjections = await redis.incr('injections_total');

        const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
        const CHANNEL_ID = "1471232302548914350"; // Вставь ID войса тут!

        // 2. Логика кулдауна для Discord (раз в 6 минут)
        const lastUpdate = await redis.get('last_discord_update') || 0;
        const now = Date.now();

        if (now - lastUpdate > 360000) {
            const response = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bot ${BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: `ɷ Injections | ${totalInjections} ɷ` })
            });

            if (response.ok) {
                await redis.set('last_discord_update', now);
            }
        }

        return res.status(200).json({ success: true, total: totalInjections });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
