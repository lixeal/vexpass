import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal"; 
const REPO = "vexpass";

export default async function handler(req, res) {
    const host = req.headers.host || "";
    const userAgent = req.headers['user-agent'] || "";
    const fullPath = req.url.split('?')[0].replace(/^\/+/g, '');

    // --- 1. КАРТА БРАНЧЕЙ ---
    let targetBranch = "main";
    if (host === "test-offvexpass.vercel.app") targetBranch = "testing";
    else if (host.includes("raw-vexpass")) targetBranch = "raw";
    else if (host.includes("cdn-vexpass") || host === "cdnvexpass.vercel.app") targetBranch = "cdn";
    else if (host.includes("off-vexpass") || host === "offvexpass.vercel.app" || host === "vexpass.vercel.app") targetBranch = "off";
    else if (host.includes("api-vexpass") || host === "vexpass-api.vercel.app") targetBranch = "api";

    // Выбор HTML (только для тестового домена — test.html, для всех остальных — main.html)
    const interfaceFile = (host === "test-offvexpass.vercel.app") ? "site/html/test.html" : "site/html/main.html";

    if (fullPath === "favicon.ico" || fullPath.startsWith("api/")) return res.status(404).end();

    // --- 2. ФОНОВЫЙ ЛОГГЕР ---
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

    // --- 3. ПРОВЕРКА РОБЛОКС vs БРАУЗЕР ---
    const isRoblox = userAgent.includes("Roblox");

    if (!isRoblox) {
        try {
            const { data: fileData } = await octokit.repos.getContent({
                owner: OWNER, repo: REPO, path: interfaceFile, ref: targetBranch
            });
            const html = Buffer.from(fileData.content, 'base64').toString('utf-8');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(html);
        } catch (err) {
            return res.status(500).send(`Interface not found: ${interfaceFile} in ${targetBranch}`);
        }
    }

    // --- 4. ВЫДАЧА КОДА (ДЛЯ РОБЛОКСА) ---
    try {
        const pathParts = fullPath.split('/');
        const fileName = pathParts.pop(); 
        const folderPath = pathParts.join('/'); 

        const { data: repoContent } = await octokit.repos.getContent({
            owner: OWNER, repo: REPO, path: folderPath, ref: targetBranch
        });

        const targetFile = repoContent.find(f => 
            f.type === "file" && (f.name === fileName || f.name === `${fileName}.lua`)
        );

        const { data: blob } = await octokit.git.getBlob({
            owner: OWNER, repo: REPO, file_sha: targetFile.sha
        });

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(200).send(Buffer.from(blob.content, 'base64').toString('utf-8'));
    } catch (e) {
        return res.status(404).send("-- VexPass: Not Found");
    }
}
