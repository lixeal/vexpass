import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal"; 
const REPO = "vexpass";

export default async function handler(req, res) {
    const host = req.headers.host || "";
    const userAgent = req.headers['user-agent'] || "";
    const fullPath = req.url.split('?')[0].replace(/^\/+/g, '');

    // 1. Определение бранча по домену
    let targetBranch = "main";
    if (host.includes("off-vexpass") || host.includes("offvexpass")) targetBranch = "off";
    if (host.includes("cdn-vexpass")) targetBranch = "cdn";

    // 2. Определение файла интерфейса (строго по твоему условию)
    // Только для этого домена test.html, для всех остальных main.html
    let interfaceFile = (host === "test-offvexpass.vercel.app") ? "test.html" : "main.html";

    if (fullPath === "favicon.ico" || fullPath.startsWith("api/")) return res.status(404).end();

    // --- ФОНОВЫЙ ЛОГГЕР (всегда шлет данные об обращении к файлу) ---
    try {
        fetch(`https://${host}/api/logger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                path: fullPath,
                branch: targetBranch,
                userAgent: userAgent,
                isBrowser: !userAgent.includes("Roblox")
            })
        }).catch(() => {});
    } catch(e) {}

    // --- ПРОВЕРКА: ЧЕЛОВЕК ИЛИ РОБЛОКС ---
    const isRoblox = userAgent.includes("Roblox");

    if (!isRoblox) {
        // Если зашел человек — грузим выбранный HTML файл из GitHub
        try {
            const { data: fileData } = await octokit.repos.getContent({
                owner: OWNER,
                repo: REPO,
                path: interfaceFile,
                ref: targetBranch
            });

            const htmlContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(htmlContent);
        } catch (err) {
            return res.status(500).send(`Error: Interface file [${interfaceFile}] not found in [${targetBranch}] branch`);
        }
    }

    // --- ЕСЛИ РОБЛОКС — ВЫДАЕМ КОД ---
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

        if (!targetFile) throw new Error("Not Found");

        const { data: blob } = await octokit.git.getBlob({
            owner: OWNER, repo: REPO, file_sha: targetFile.sha
        });

        const content = Buffer.from(blob.content, 'base64').toString('utf-8');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(content);
    } catch (e) {
        return res.status(404).send("-- VexPass: Script not found");
    }
}
