import { Octokit } from "@octokit/rest";
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
    let { path } = req.query;
    const host = req.headers.host || ""; 
    const userAgent = req.headers['user-agent'] || ""; // Получаем данные о том, кто зашел

    if (!path) return res.status(400).send("No path provided");

    // ПРОВЕРКА: Если это основной домен и зашел НЕ Roblox
    const isMainDomain = host === "wehface.vercel.app" || host === "weh-face.vercel.app";
    const isRoblox = userAgent.includes("Roblox");

    if (isMainDomain && !isRoblox) {
        // Ответ для обычных людей в браузере
        return res.status(403).send("Access Denied: Protected by wexxz software.");
    }

    // --- Дальше идет обычная логика выдачи файла ---
    let folder = "res/data"; 
    if (host.includes("cdn")) {
        folder = "res/cdn";
    } else if (host.includes("api")) {
        folder = "res/api";
    } else if (isMainDomain) {
        folder = "res/main";
    }

    if (!path.includes(".")) {
        path += ".lua";
    }

    const gitHubPath = `${folder}/${path}`;

    try {
        const { data: fileData } = await octokit.repos.getContent({
            owner: "lixeal",
            repo: "weh-face",
            path: gitHubPath,
        });

        const { data: blobData } = await octokit.git.getBlob({
            owner: "lixeal",
            repo: "weh-face",
            file_sha: fileData.sha,
        });

        const buffer = Buffer.from(blobData.content, 'base64');
        const extension = path.split('.').pop().toLowerCase();

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        if (extension === 'lua') {
            res.status(200).send(buffer.toString('utf8'));
        } else {
            res.status(200).send(buffer);
        }
    } catch (e) {
        res.status(404).send(`-- Error: File [${path}] not found.`);
    }
}
