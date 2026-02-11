export default async function handler(req, res) {
    // Разрешаем запросы только методом POST от нашего raw.js
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { ip, host, path, agent } = req.body;
    const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

    if (!DISCORD_WEBHOOK) {
        return res.status(500).send('Webhook not configured');
    }

    // 1. ПОЛУЧАЕМ ГЕО-ДАННЫЕ
    let location = "Unknown, Unknown";
    let isp = "Unknown ISP";
    try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`);
        const geoData = await geoRes.json();
        if (geoData.status === 'success') {
            location = `${geoData.country}, ${geoData.city}`;
            isp = geoData.isp;
        }
    } catch (e) { console.error("Geo API error"); }

    // 2. ФОРМАТИРУЕМ ДАТУ (ДД.ММ.ГГГГ ЧЧ:ММ)
    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
    const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const fullDate = `${dateStr} ${timeStr}`;

    // 3. ФОРМИРУЕМ EMBED ДЛЯ DISCORD
    const embed = {
        username: "Security Center",
        embeds: [{
            title: "⚠️ Access Blocked",
            color: 0xFF0000, // Красный цвет полоски
            description: "```" + 
                         `Domain   | ${host}\n` +
                         `File     | ${path || "index"}\n\n` +
                         `IP       | ${ip}\n` +
                         `Location | ${location}\n` +
                         `ISP      | ${isp}\n` +
                         "```",
            footer: {
                text: `vexpass security center ${fullDate}`
            }
        }]
    };

    // 4. ОТПРАВЛЯЕМ В DISCORD
    try {
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(embed)
        });
        return res.status(200).json({ success: true });
    } catch (e) {
        return res.status(500).json({ error: "Failed to send webhook" });
    }
}
