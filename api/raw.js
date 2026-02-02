import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal";
const REPO = "weh-face";

export default async function handler(req, res) {
    const { path } = req.query;
    const host = req.headers.host || ""; 
    
    if (!path) return res.status(400).send("No path provided");

    // Определение папки на основе домена
    let folder = "res/data";
    if (host.includes("cdn")) {
        folder = "res/cdn";
    } else if (host.includes("api")) {
        folder = "res/api";
    } else if (host.includes("raw")) {
        folder = "res/data";
    }

    const gitHubPath = `${folder}/${path}`;

    try {
        // 1. Получаем SHA файла (нужно для больших файлов > 1MB)
        const { data: fileData } = await octokit.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: gitHubPath,
        });

        // 2. Получаем сам контент через Blob API
        const { data: blobData } = await octokit.git.getBlob({
            owner: OWNER,
            repo: REPO,
            file_sha: fileData.sha,
        });

        // 3. Декодируем из Base64 в буфер
        const buffer = Buffer.from(blobData.content, 'base64');
        const extension = path.split('.').pop().toLowerCase();

        // 4. Настройка заголовков
        const types = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'lua': 'text/plain; charset=utf-8',
            'json': 'application/json',
            'txt': 'text/plain; charset=utf-8'
        };

        const contentType = types[extension] || 'application/octet-stream';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*'); // Важно для HttpGet
        res.setHeader('Cache-Control', 'no-store, max-age=0'); // Отключаем кэш для тестов

        // 5. Отправка данных
        if (extension === 'lua' || extension === 'txt' || extension === 'json') {
            // Для скриптов отправляем чистую строку
            res.status(200).send(buffer.toString('utf8'));
        } else {
            // Для картинок отправляем бинарный буфер
            res.status(200).send(buffer);
        }

    } catch (e) {
        console.error("Error fetching file:", e.message);
        res.status(404).send(`-- Error: File not found in /${folder}/\n-- Details: ${e.message}`);
    }
}
