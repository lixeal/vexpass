import { Octokit } from "@octokit/rest";
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
    const { path } = req.query;
    const host = req.headers.host || ""; 
    if (!path) return res.status(400).send("No path provided");

    let folder = "res/data"; // Папка по умолчанию

    // Логика выбора папки в зависимости от домена
    if (host.includes("cdn")) {
        folder = "res/cdn";
    } else if (host.includes("api")) {
        folder = "res/api";
    } else if (host.includes("raw")) {
        folder = "res/data";
    }

    const gitHubPath = `${folder}/${path}`;

    try {
        // Используем метод для больших файлов (до 100мб)
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

        // Установка правильного типа контента
        const types = {
            'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
            'gif': 'image/gif', 'lua': 'text/plain; charset=utf-8',
            'json': 'application/json', 'txt': 'text/plain; charset=utf-8'
        };

        res.setHeader('Content-Type', types[extension] || 'application/octet-stream');
        res.setHeader('Access-Control-Allow-Origin', '*'); // Разрешаем запросы отовсюду
        res.status(200).send(buffer);
    } catch (e) {
        res.status(404).send(`-- Error: File not found in /${folder}/`);
    }
}
