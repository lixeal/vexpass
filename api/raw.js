import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal";
const REPO = "vexpass";
const BRANCH = "off";
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

const CIS_COUNTRIES = ['RU', 'UA', 'BY', 'KZ', 'AM', 'AZ', 'GE', 'MD', 'KG', 'TJ', 'UZ', 'TM'];

async function sendLog(ip, host, path, userAgent, geo) {
    if (!DISCORD_WEBHOOK) return;

    // Игнорируем запросы к ассетам (фон и иконки)
    if (path.includes("html/bg") || path.includes("favicon/")) return;
    
    const isRoblox = userAgent.includes("Roblox");
    const title = isRoblox ? "Script Executed" : "Access Blocked";
    
    // Данные из ГЕО
    const location = geo ? `${geo.country}, ${geo.city}` : "Unknown Location";
    const isp = geo ? geo.isp : "Unknown ISP";
    
    // Формируем дату как в твоем примере
    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU') + ' ' + now.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});

    // Тот самый формат
    const logText = "```" + 
                    `${title} \n` +
                    `            Domain                                      File\n` +
                    `\`${host}\`            \`${path || "index"}\`\n` +
                    ` User-Agent\n` +
                    `\`${userAgent}\`\n` +
                    ` IP Info\n` +
                    `IP: ${ip}\n` +
                    `Location: ${location}\n` +
                    `ISP: ${isp}\n` +
                    `WEH-FACE Security Center • ${dateStr}` +
                    "```";

    try {
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: logText })
        });
    } catch (e) { console.error("Webhook error"); }
}

async function getGeo(ip) {
    try {
        // Запрашиваем расширенные поля для ISP и города
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,isp`);
        const data = await res.json();
        return data.status === 'success' ? data : null;
    } catch (e) { return null; }
}

export default async function handler(req, res) {
    const host = req.headers.host || "";
    const userAgent = req.headers['user-agent'] || "";
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = rawIp.split(',')[0].trim();
    
    let requestedPath = req.query.path || "";
    const cleanPath = requestedPath.split('#')[0].split('?')[0].replace(/\.[^/.]+$/, "");

    const geoData = await getGeo(ip);
    await sendLog(ip, host, cleanPath, userAgent, geoData);

    // --- ЛОГИКА ПАПОК ---
    let subFolder = "main";
    let iconName = "vexpass.svg";

    if (host.includes("raw-vexpass")) subFolder = "raw";
    else if (host.includes("test")) { subFolder = "testing"; iconName = "test-vexpass.svg"; }
    else if (host.includes("cdn")) subFolder = "cdn";
    else if (host.includes("api")) subFolder = "api";

    if (cleanPath !== "") iconName = "ScriptProtector.svg";

    // --- ВЫДАЧА СТАТИКИ ---
    if (requestedPath.startsWith("favicon/") || requestedPath === "html/bg.svg") {
        try {
            const repoPath = requestedPath.startsWith("favicon/") ? `site/favicon/${requestedPath.split('/').pop()}` : `site/html/bg.svg`;
            const { data: file } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: repoPath, ref: "main" });
            res.setHeader('Content-Type', 'image/svg+xml');
            return res.status(200).send(Buffer.from(file.content, 'base64').toString('utf-8'));
        } catch (e) { return res.status(404).end(); }
    }

    const isRoblox = userAgent.includes("Roblox");

    // --- БРАУЗЕР (САЙТ) ---
    if (!isRoblox) {
        let pageName = "main.html";
        let lang = req.query.lang || (geoData && CIS_COUNTRIES.includes(geoData.countryCode) ? "RU" : "EN");

        if (subFolder === "testing" && cleanPath === "") pageName = "test.html";
        else if (cleanPath !== "") pageName = "main.html"; 

        try {
            const { data: file } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: `site/html/${pageName}`, ref: "main" });
            let html = Buffer.from(file.content, 'base64').toString('utf-8');
            const title = (cleanPath !== "" && subFolder !== "testing") ? "&#x200E;" : "VEXPASS";
            
            html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
                       .replace(/{{LANG}}/g, lang.toUpperCase())
                       .replace(/{{ICON_PATH}}/g, `/api/raw?path=favicon/${iconName}`)
                       .replace(/{{BG_PATH}}/g, `/api/raw?path=html/bg.svg`);
            
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(html);
        } catch (e) { return res.status(404).send("UI Error"); }
    }

    // --- ВЫДАЧА КОДА (ROBLOX / RAW) ---
    try {
        const { data: repoFiles } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: subFolder, ref: BRANCH });
        const targetFile = repoFiles.find(f => f.name.replace(/\.[^/.]+$/, "") === cleanPath);
        if (!targetFile) throw new Error();

        const { data: blob } = await octokit.git.getBlob({ owner: OWNER, repo: REPO, file_sha: targetFile.sha });
        const content = Buffer.from(blob.content, 'base64').toString('utf-8');

        if (host.includes("raw-vexpass")) {
            res.setHeader('Content-Disposition', `attachment; filename="${targetFile.name}"`);
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(content);
    } catch (e) {
        return res.status(404).send(`-- VexPass Error`);
    }
}
