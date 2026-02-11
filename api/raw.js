import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal";
const REPO = "vexpass";

export default async function handler(req, res) {
    const host = req.headers.host || "";
    const userAgent = req.headers['user-agent'] || "";
    const url = new URL(req.url, `http://${host}`);
    let fullPath = url.pathname.slice(1);
    const isTrailingSlash = url.pathname.endsWith('/');

    // --- 1. ПРЯМОЙ ПЕРЕХВАТ СТАТИКИ (Чтобы фон и иконки работали) ---
    if (fullPath.includes("bg.svg") || fullPath.includes("favicon/")) {
        try {
            const staticPath = fullPath.includes("bg.svg") ? `site/html/bg.svg` : `site/favicon/${fullPath.split('/').pop()}`;
            const { data: file } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: staticPath, ref: "main" });
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return res.status(200).send(Buffer.from(file.content, 'base64').toString('utf-8'));
        } catch (e) { return res.status(404).end(); }
    }

    // --- 2. ОПРЕДЕЛЕНИЕ БРАНЧА ---
    let targetBranch = "off";
    let iconName = "vexpass.svg";

    if (host.includes("raw-vexpass")) targetBranch = "raw";
    else if (host.includes("test")) { targetBranch = "testing"; iconName = "test-vexpass.svg"; }
    else if (host.includes("cdn")) targetBranch = "cdn";
    else if (host.includes("api")) targetBranch = "api";

    if (fullPath !== "" && !isTrailingSlash) iconName = "ScriptProtector.svg";

    const isRoblox = userAgent.includes("Roblox");
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = rawIp.split(',')[0].trim();

    // --- 3. ПИНГ ЛОГГЕРА (Back-end) ---
    // Не шлем логи, если это Roblox, статика или пустой путь
    if (!isRoblox && fullPath !== "" && !isTrailingSlash) {
        fetch(`https://${host}/api/logger`, {
            method: 'POST',
            body: JSON.stringify({ ip, host, path: fullPath, agent: userAgent }),
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => {});
    }

    // --- 4. БРАУЗЕР (UI) ---
    if (!isRoblox) {
        let pageName = (targetBranch === "testing" && (fullPath === "" || fullPath === "/")) ? "test.html" : "main.html";
        try {
            const { data: file } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: `site/html/${pageName}`, ref: "main" });
            let html = Buffer.from(file.content, 'base64').toString('utf-8');
            const title = (fullPath !== "" && !isTrailingSlash && targetBranch !== "testing") ? "&#x200E;" : "VEXPASS";
            
            // Вставляем прямые пути, чтобы logger не считал их за файлы
            html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
                       .replace(/{{LANG}}/g, "RU")
                       .replace(/{{ICON_PATH}}/g, `/favicon/${iconName}`)
                       .replace(/{{BG_PATH}}/g, `/html/bg.svg`);
            
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(html);
        } catch (e) { return res.status(404).send("UI Error"); }
    }

    // --- 5. ВЫДАЧА КОДА (ROBLOX) ---
    if (isTrailingSlash || fullPath === "") return res.status(404).send("-- VexPass: Direct access only");

    try {
        const { data: repoContent } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: "", ref: targetBranch });
        const cleanName = fullPath.replace(/\.[^/.]+$/, "");
        const targetFile = repoContent.find(f => f.type === "file" && (f.name === fullPath || f.name === `${fullPath}.lua` || f.name === cleanName));

        if (!targetFile) throw new Error();

        const { data: blob } = await octokit.git.getBlob({ owner: OWNER, repo: REPO, file_sha: targetFile.sha });
        const content = Buffer.from(blob.content, 'base64').toString('utf-8');

        if (host.includes("raw-vexpass")) res.setHeader('Content-Disposition', `attachment; filename="${targetFile.name}"`);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(content);
    } catch (e) {
        return res.status(404).send(`-- VexPass Error: File not found`);
    }
}
