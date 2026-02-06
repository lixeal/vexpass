import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;
const OWNER = "lixeal";
const REPO = "weh-face";

async function getGeo(ip) {
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,isp`);
        return await res.json();
    } catch (e) { return null; }
}

async function sendToDiscord(host, path, ua, ip, geoData) {
    if (!WEBHOOK_URL) return;
    
    const geoString = geoData ? `**Location:** ${geoData.country}, ${geoData.city}\n**ISP:** ${geoData.isp}` : "Unknown";

    const embed = {
        title: "🛡 Access Blocked",
        color: 0xff4141,
        fields: [
            { name: "🌐 Domain", value: `\`${host}\``, inline: true },
            { name: "📁 File", value: `\`${path}\``, inline: true },
            { name: "👤 User-Agent", value: `\`\`\`${ua}\`\`\`` },
            { name: "📍 IP Info", value: `**IP:** ${ip}\n${geoString}` }
        ],
        footer: { text: "WEH-FACE Security Center" },
        timestamp: new Date()
    };

    await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: "wehface protector", embeds: [embed] })
    }).catch(() => {});
}

export default async function handler(req, res) {
    const host = req.headers.host || ""; 
    const userAgent = req.headers['user-agent'] || "";
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = rawIp.split(',')[0].trim();
    
    let { path } = req.query;
    if (!path) return res.status(400).send("No path provided");
    path = path.split('#')[0].split('?')[0];

    // --- 1. ИГНОРИРОВАНИЕ МУСОРА ---
    const ignoredFiles = ['favicon.ico', 'robots.txt', 'sitemap.xml'];
    if (ignoredFiles.includes(path) || path.endsWith('.png') || path.endsWith('.ico')) {
        return res.status(404).send("Not Found");
    }

    // --- 2. БЕЛЫЙ СПИСОК IP (Твой диапазон 77.52.212.*) ---
    const isWhiteListed = ip.startsWith("77.52.212.");

    // --- 3. ЛОГИКА ПАПОК ---
    let folder = "res/data"; // По умолчанию для raw-wf и raw-wehface
    if (host.includes("cdn-")) {
        folder = "res/cdn";
    } else if (host.includes("api")) {
        folder = "res/api";
    } else if (host === "wehface.vercel.app" || host === "weh-face.vercel.app") {
        folder = "res/main";
    }

    // --- 4. ЗАЩИТА ВСЕХ ДОМЕНОВ ---
    const isRoblox = userAgent.includes("Roblox");

    if (!isRoblox) {
        const geoData = await getGeo(ip);

        // Отправляем в Дискорд только если IP НЕ в белом списке
        if (!isWhiteListed) {
            await sendToDiscord(host, path, userAgent, ip, geoData);
        }

        // Вывод красивой карточки человеку
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(403).send(`
            <html>
                <head><title>Access Blocked</title>
                <style>
                    body { background: #0b0b0b; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .embed { background: #2b2d31; border-left: 4px solid #ff4141; border-radius: 4px; padding: 16px; width: 432px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
                    .title { font-weight: bold; font-size: 16px; margin-bottom: 8px; }
                    .field { margin-bottom: 12px; }
                    .label { color: #b5bac1; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
                    .value { color: #dbdee1; font-size: 14px; background: #1e1f22; padding: 4px 6px; border-radius: 4px; font-family: monospace; display: block; }
                    .footer { color: #949ba4; font-size: 11px; margin-top: 12px; border-top: 1px solid #3f4147; padding-top: 8px; }
                </style></head>
                <body>
                    <div class="embed">
                        <div class="title">🛡 Access Blocked</div>
                        <div class="field"><div class="label">Domain</div><div class="value">${host}</div></div>
                        <div class="field"><div class="label">File</div><div class="value">${path}</div></div>
                        <div class="field"><div class="label">IP Information</div><div style="font-size: 14px;"><b>IP:</b> ${ip}<br><b>Location:</b> ${geoData?.country || 'Unknown'}, ${geoData?.city || 'Unknown'}</div></div>
                        <div class="footer">wehface Cloud Security • ${new Date().toLocaleTimeString()}</div>
                    </div>
                </body>
            </html>
        `);
    }

    // --- 5. ВЫДАЧА ФАЙЛА ДЛЯ ROBLOX ---
    if (!path.includes(".")) path += ".lua";

    try {
        const { data: fileData } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: `${folder}/${path}` });
        const { data: blobData } = await octokit.git.getBlob({ owner: OWNER, repo: REPO, file_sha: fileData.sha });
        const buffer = Buffer.from(blobData.content, 'base64');

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).send(buffer.toString('utf8'));
    } catch (e) {
        res.status(404).send(`-- Error: File [${path}] not found in /${folder}/`);
    }
}
