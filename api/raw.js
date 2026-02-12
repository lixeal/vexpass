import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal"; 
const REPO = "vexpass";

export default async function handler(req, res) {
    const host = req.headers.host || "";
    const userAgent = req.headers['user-agent'] || "";
    const urlParts = req.url.split('?');
    const fullPath = urlParts[0].replace(/^\/+/g, '');

    // 1. Определение бранча для СКРИПТОВ
    let codeBranch = "main";
    if (host === "test-offvexpass.vercel.app") codeBranch = "testing";
    else if (host.includes("raw-vexpass")) codeBranch = "raw";
    else if (host.includes("cdn-vexpass") || host === "cdnvexpass.vercel.app") codeBranch = "cdn";
    else if (host.includes("off-vexpass") || host === "offvexpass.vercel.app" || host === "vexpass.vercel.app") codeBranch = "off";
    else if (host.includes("api-vexpass") || host === "vexpass-api.vercel.app") codeBranch = "api";

    const interfaceFile = (host === "test-offvexpass.vercel.app") ? "site/html/test.html" : "site/html/main.html";

    if (fullPath === "favicon.ico" || fullPath.startsWith("api/")) return res.status(404).end();

    // --- 2. ПРОВЕРКА НА СТАТИКУ (bg.svg и т.д.) ---
    const isStatic = /\.(svg|png|jpg|jpeg|css|ico)$/.test(fullPath);
    if (isStatic) {
        try {
            const { data: fileData } = await octokit.repos.getContent({
                owner: OWNER, repo: REPO, path: fullPath, ref: "main"
            });
            const ext = fullPath.split('.').pop();
            const types = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', ico: 'image/x-icon' };
            res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
            return res.status(200).send(Buffer.from(fileData.content, 'base64'));
        } catch (e) { return res.status(404).end(); }
    }

    // --- 3. ПОИСК ФАЙЛА В GITHUB (ЗАЩИТА ОТ ПУСТЫХ ЛОГОВ) ---
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
                f.type === "file" && (f.name === fileName || f.name === `${fileName}.lua`)
            );
        } catch (e) {
            // Если папки или файла нет — просто идем дальше, targetFile останется null
        }
    }

    // --- 4. ЛОГГЕР (ТОЛЬКО ЕСЛИ ФАЙЛ СУЩЕСТВУЕТ И ЭТО НЕ ROOT) ---
    if (fullPath !== "" && targetFile) {
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

    // --- 5. ВЫДАЧА HTML (БРАУЗЕР) ---
    if (!isRoblox) {
        try {
            const { data: fileData } = await octokit.repos.getContent({
                owner: OWNER, repo: REPO, path: interfaceFile, ref: "main"
            });
            let html = Buffer.from(fileData.content, 'base64').toString('utf-8');
            
            const selectedLang = req.query.lang || "RU";
            html = html.replace(/{{LANG}}/g, selectedLang)
                       .replace(/{{BG_PATH}}/g, "/site/html/bg.svg");
            
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(html);
        } catch (err) {
            return res.status(500).send("Interface Error");
        }
    }

    // --- 6. ВЫДАЧА КОДА (ROBLOX) ---
    if (isRoblox && targetFile) {
        try {
            const { data: blob } = await octokit.git.getBlob({
                owner: OWNER, repo: REPO, file_sha: targetFile.sha
            });
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.status(200).send(Buffer.from(blob.content, 'base64').toString('utf-8'));
        } catch (e) {
            return res.status(500).send("-- Internal Error");
        }
    }

    return res.status(404).send("-- VexPass: Resource Not Found");
}
