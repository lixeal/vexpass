import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "nettoxi"; 
const REPO = "winxs";

export default async function handler(req, res) {
    const host = req.headers.host || "";
    const userAgent = req.headers['user-agent'] || "";
    
    // Получаем путь и отделяем query-параметры
    let rawPath = req.url.split('?')[0].replace(/^\/+/g, '');
    
    // ПРОВЕРКА ТВОЕЙ ПРИПИСКИ =winxs/dev
    const secretSuffix = "=winxs/dev";
    const isDev = rawPath.endsWith(secretSuffix);
    
    // Если приписка есть, отрезаем её, чтобы получить чистый путь к файлу в GitHub
    const fullPath = isDev ? rawPath.slice(0, -secretSuffix.length) : rawPath;

    // 1. КАРТА БРАНЧЕЙ
    let codeBranch = "main";
    if (host === "test-winxs.vercel.app") codeBranch = "testing";
    else if (host === "raw-winxs.vercel.app") codeBranch = "raw";
    else if (host === "api-winxs.vercel.app") codeBranch = "api";
    else if (host === "cdn-winxs.vercel.app") codeBranch = "cdn";
    else if (host === "offwinxs.vercel.app") codeBranch = "off";

    // Определение файла интерфейса (из ветки main)
    const interfaceFile = (host === "test-winxs.vercel.app") ? "site/html/test.html" : "site/html/main.html";

    if (fullPath === "favicon.ico" || fullPath.startsWith("api/")) return res.status(404).end();

    // 2. СТАТИКА ДЛЯ САЙТА (bg.svg, icon.gif и т.д.)
    const isStatic = /\.(svg|png|jpg|jpeg|css|ico|gif)$/.test(fullPath);
    if (isStatic && !isDev) {
        try {
            const { data: fileData } = await octokit.repos.getContent({
                owner: OWNER, repo: REPO, path: fullPath, ref: "main"
            });
            const ext = fullPath.split('.').pop().toLowerCase();
            const types = { 
                svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', 
                ico: 'image/x-icon', gif: 'image/gif', css: 'text/css' 
            };
            res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
            return res.status(200).send(Buffer.from(fileData.content, 'base64'));
        } catch (e) { return res.status(404).end(); }
    }

    // 3. ПРОВЕРКА СУЩЕСТВОВАНИЯ ФАЙЛА
    let targetFile = null;
    if (fullPath !== "") {
        try {
            const pathParts = fullPath.split('/');
            const fileName = pathParts.pop(); 
            const folderPath = pathParts.join('/'); 
            const { data: repoContent } = await octokit.repos.getContent({
                owner: OWNER, repo: REPO, path: folderPath, ref: codeBranch
            });
            targetFile = repoContent.find(f => 
                f.type === "file" && (f.name === fileName || f.name.startsWith(fileName + "."))
            );
        } catch (e) {}
    }

    // 4. ЛОГГЕР (Не логаем root и запросы с секреткой)
    if (fullPath !== "" && targetFile && !isDev) {
        fetch(`https://${host}/api/logger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                path: fullPath,
                domain: host,
                userAgent: userAgent
            })
        }).catch(() => {});
    }

    const isRoblox = userAgent.includes("Roblox");

    // 5. ВЫДАЧА КОНТЕНТА (ROBLOX ИЛИ СЕКРЕТКА)
    if ((isRoblox || isDev) && targetFile) {
        try {
            const { data: blob } = await octokit.git.getBlob({
                owner: OWNER, repo: REPO, file_sha: targetFile.sha
            });
            
            const content = Buffer.from(blob.content, 'base64');
            const ext = targetFile.name.split('.').pop().toLowerCase();
            
            const mimeTypes = {
                lua: 'text/plain; charset=utf-8',
                txt: 'text/plain; charset=utf-8',
                jpg: 'image/jpeg', png: 'image/png',
                gif: 'image/gif', svg: 'image/svg+xml'
            };

            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).send(content);
        } catch (e) { return res.status(500).send("Error"); }
    }

    // 6. ВЫДАЧА HTML (ОБЫЧНЫЙ ЮЗЕР)
    if (!isRoblox && !isDev) {
        try {
            const { data: fileData } = await octokit.repos.getContent({
                owner: OWNER, repo: REPO, path: interfaceFile, ref: "main"
            });
            let html = Buffer.from(fileData.content, 'base64').toString('utf-8');
            const selectedLang = req.query.lang || "RU";
            html = html.replace(/{{LANG}}/g, selectedLang).replace(/{{BG_PATH}}/g, "/site/html/bg.svg");
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(html);
        } catch (err) { return res.status(500).send("Interface Error"); }
    }

    return res.status(404).send("Not Found");
}
