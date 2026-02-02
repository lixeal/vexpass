import { Octokit } from "@octokit/rest";
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
    let { path } = req.query;
    const host = req.headers.host || ""; 
    if (!path) return res.status(400).send("No path provided");

    // Логика выбора папки
    let folder = "res/data"; 
    if (host.includes("cdn")) {
        folder = "res/cdn";
    } else if (host.includes("api")) {
        folder = "res/api";
    } else if (host === "wehface.vercel.app" || host === "weh-face.vercel.app") {
        folder = "res/main"; // Твоя новая папка для основных скриптов
    }

    // МАГИЯ: Если расширения нет, добавляем .lua
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

        const types = {
            'lua': 'text/plain; charset=utf-8',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'json': 'application/json'
        };

        res.setHeader('Content-Type', types[extension] || 'text/plain; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Отдаем текст для скриптов
        if (extension === 'lua') {
            res.status(200).send(buffer.toString('utf8'));
        } else {
            res.status(200).send(buffer);
        }
    } catch (e) {
        res.status(404).send(`-- Error: File [${path}] not found in /${folder}/`);
    }
}
