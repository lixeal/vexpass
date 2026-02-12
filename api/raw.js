import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal"; 
const REPO = "vexpass";

export default async function handler(req, res) {
    const host = req.headers.host || "";
    const fullPath = req.url.split('?')[0].replace(/^\/+/g, '');
    const isTrailingSlash = req.url.split('?')[0].endsWith('/');

    // 1. Определение бранча
    let targetBranch = "main";
    if (host.includes("off-vexpass") || host.includes("offvexpass")) targetBranch = "off";
    if (host.includes("cdn-vexpass")) targetBranch = "cdn";

    // 2. Игнорируем системные запросы
    if (fullPath === "favicon.ico" || fullPath.startsWith("api/")) return res.status(404).end();

    // 3. Главная страница (если зашли просто на домен)
    if (fullPath === "" || isTrailingSlash) {
        return res.status(200).send("<h1>VexPass Backend Active</h1>");
    }

    try {
        // Разделяем путь на папки и файл
        const pathParts = fullPath.split('/');
        const fileName = pathParts.pop(); 
        const folderPath = pathParts.join('/'); 

        // Запрашиваем содержимое папки в GitHub
        const { data: repoContent } = await octokit.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: folderPath,
            ref: targetBranch
        });

        // Ищем файл (с расширением .lua или без)
        const targetFile = repoContent.find(f => 
            f.type === "file" && 
            (f.name === fileName || f.name === `${fileName}.lua`)
        );

        if (!targetFile) throw new Error("File not found");

        // Получаем содержимое файла
        const { data: blob } = await octokit.git.getBlob({
            owner: OWNER,
            repo: REPO,
            file_sha: targetFile.sha
        });

        const content = Buffer.from(blob.content, 'base64').toString('utf-8');

        // Заголовки для Roblox
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(content);

    } catch (e) {
        return res.status(404).send(`-- Error: File [${fullPath}] not found in [${targetBranch}] branch`);
    }
}
