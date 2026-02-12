import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal"; 
const REPO = "vexpass";

export default async function handler(req, res) {
    const host = req.headers.host || "";
    const userAgent = req.headers['user-agent'] || "";
    const fullPath = req.url.split('?')[0].replace(/^\/+/g, '');
    const isTrailingSlash = req.url.split('?')[0].endsWith('/');

    // 1. Определение бранча
    let targetBranch = "main";
    if (host.includes("off-vexpass") || host.includes("offvexpass")) targetBranch = "off";
    if (host.includes("cdn-vexpass")) targetBranch = "cdn";

    // 2. Игнорируем системные запросы
    if (fullPath === "favicon.ico" || fullPath.startsWith("api/")) return res.status(404).end();

    // --- ЗАЩИТА ---
    // Если это НЕ Roblox и НЕ специальный параметр ?raw=true, показываем сайт
    const isRoblox = userAgent.includes("Roblox");
    const isDirectRaw = req.query.raw === "true"; // Чтобы ты мог сам поглядеть код через браузер, добавив ?raw=true

    if (!isRoblox && !isDirectRaw) {
        // Тут мы отдаем HTML страницу вместо кода
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>VexPass CDN</title>
                <style>
                    body { background: #0f0f0f; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .card { border: 1px solid #333; padding: 20px; border-radius: 10px; text-align: center; background: #1a1a1a; }
                    .btn { display: inline-block; margin-top: 15px; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>VexPass Systems</h1>
                    <p>Accessing: <code>${fullPath}</code></p>
                    <p style="color: #888;">Direct access to script source is restricted.</p>
                    <a href="https://discord.gg/твой_инвайт" class="btn">Join Discord</a>
                </div>
            </body>
            </html>
        `);
    }

    // --- ЕСЛИ ПРОШЕЛ ПРОВЕРКУ (ЭТО РОБЛОКС) ---
    try {
        const pathParts = fullPath.split('/');
        const fileName = pathParts.pop(); 
        const folderPath = pathParts.join('/'); 

        const { data: repoContent } = await octokit.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: folderPath,
            ref: targetBranch
        });

        const targetFile = repoContent.find(f => 
            f.type === "file" && 
            (f.name === fileName || f.name === `${fileName}.lua`)
        );

        if (!targetFile) throw new Error("File not found");

        const { data: blob } = await octokit.git.getBlob({
            owner: OWNER,
            repo: REPO,
            file_sha: targetFile.sha
        });

        const content = Buffer.from(blob.content, 'base64').toString('utf-8');

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(content);

    } catch (e) {
        return res.status(404).send(`-- Error: Resource not found`);
    }
}
