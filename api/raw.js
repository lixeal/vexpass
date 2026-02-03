import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;
const OWNER = "lixeal";
const REPO = "weh-face";

async function sendToDiscord(host, path, ua, ip) {
    if (!WEBHOOK_URL) return;
    await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: "🛡 **Попытка доступа к коду через браузер!**",
            embeds: [{
                title: "Access Blocked",
                color: 16728129,
                fields: [
                    { name: "Domain", value: host, inline: true },
                    { name: "File", value: path, inline: true },
                    { name: "User-Agent", value: ua },
                    { name: "IP (Vercel)", value: ip || "Hidden" }
                ],
                timestamp: new Date()
            }]
        })
    }).catch(() => {});
}

export default async function handler(req, res) {
    let { path } = req.query;
    const host = req.headers.host || ""; 
    const userAgent = req.headers['user-agent'] || "";
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!path) return res.status(400).send("No path provided");

    // Очистка пути от хештегов и лишних символов, чтобы не было краша
    path = path.split('#')[0].split('?')[0];

    const isMainDomain = host === "wehface.vercel.app" || host === "weh-face.vercel.app";
    const isRoblox = userAgent.includes("Roblox");

    // Если зашел человек на защищенный домен — шлем уведомление и блокируем
    if (isMainDomain && !isRoblox) {
        await sendToDiscord(host, path, userAgent, ip);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(403).send(`
            <html>
                <head><title>Access Denied</title>
                <style>
                    body { background: #0b0b0b; color: #ff4141; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .box { border: 1px solid #ff4141; padding: 40px; text-align: center; box-shadow: 0 0 20px rgba(255, 65, 65, 0.2); }
                </style></head>
                <body><div class="box"><h1>Access Denied</h1><p>Protected by wehface cloud.</p></div></body>
            </html>
        `);
    }

    let folder = "res/data";
    if (host.includes("cdn")) folder = "res/cdn";
    else if (host.includes("api")) folder = "res/api";
    else if (isMainDomain) folder = "res/main";

    if (!path.includes(".")) path += ".lua";

    try {
        const { data: fileData } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: `${folder}/${path}` });
        const { data: blobData } = await octokit.git.getBlob({ owner: OWNER, repo: REPO, file_sha: fileData.sha });
        const buffer = Buffer.from(blobData.content, 'base64');
        const extension = path.split('.').pop().toLowerCase();

        res.setHeader('Content-Type', extension === 'lua' ? 'text/plain; charset=utf-8' : 'application/octet-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (['lua', 'txt', 'json'].includes(extension)) {
            res.status(200).send(buffer.toString('utf8'));
        } else {
            res.status(200).send(buffer);
        }
    } catch (e) {
        res.status(404).send(`-- Error: File [${path}] not found.`);
    }
}
