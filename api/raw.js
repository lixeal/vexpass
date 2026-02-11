import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal";
const REPO = "vexpass";
const BRANCH = "off";

export default async function handler(req, res) {
    const host = req.headers.host || "";
    const userAgent = req.headers['user-agent'] || "";
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = rawIp.split(',')[0].trim();
    
    let requestedPath = req.query.path || "";
    const cleanPath = requestedPath.split('#')[0].split('?')[0].replace(/\.[^/.]+$/, "");

    // --- 1. ОПРЕДЕЛЕНИЕ ПАПКИ И ИКОНКИ ---
    let subFolder = "main";
    let iconName = "vexpass.svg";

    if (host.includes("raw-vexpass")) subFolder = "raw";
    else if (host.includes("test")) { subFolder = "testing"; iconName = "test-vexpass.svg"; }
    else if (host.includes("cdn")) subFolder = "cdn";
    else if (host.includes("api")) subFolder = "api";

    if (cleanPath !== "") iconName = "ScriptProtector.svg";

    // --- 2. ВЫДАЧА СТАТИКИ (Favicon/BG) ---
    if (requestedPath.startsWith("favicon/") || requestedPath === "html/bg.svg") {
        try {
            const repoPath = requestedPath.startsWith("favicon/") 
                ? `site/favicon/${requestedPath.split('/').pop()}` 
                : `site/html/bg.svg`;
            const { data: file } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: repoPath, ref: "main" });
            res.setHeader('Content-Type', 'image/svg+xml');
            return res.status(200).send(Buffer.from(file.content, 'base64').toString('utf-8'));
        } catch (e) { return res.status(404).end(); }
    }

    const isRoblox = userAgent.includes("Roblox");

    // --- 3. БРАУЗЕР (САЙТ) ---
    if (!isRoblox) {
        let pageName = "main.html";
        // По умолчанию ставим RU, так как ГЕО вырезали (или можешь поменять на EN)
        let lang = req.query.lang || "RU"; 

        if (subFolder === "testing" && cleanPath === "") {
            pageName = "test.html";
        } else if (cleanPath !== "") {
            pageName = "main.html"; 
        }

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

    // --- 4. ВЫДАЧА КОДА (ROBLOX / RAW DOWNLOAD) ---
    try {
        const { data: repoFiles } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: subFolder, ref: BRANCH });
        const targetFile = repoFiles.find(f => f.name.replace(/\.[^/.]+$/, "") === cleanPath);
        
        if (!targetFile) throw new Error();

        const { data: blob } = await octokit.git.getBlob({ owner: OWNER, repo: REPO, file_sha: targetFile.sha });
        const content = Buffer.from(blob.content, 'base64').toString('utf-8');

        // Если домен raw — скачиваем
        if (host.includes("raw-vexpass")) {
            res.setHeader('Content-Disposition', `attachment; filename="${targetFile.name}"`);
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(content);
    } catch (e) {
        return res.status(404).send(`-- VexPass Error: Resource not found`);
    }
}
