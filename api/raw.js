import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal";
const REPO = "weh-face";

export default async function handler(req, res) {
    let { path } = req.query;
    const host = req.headers.host || ""; 
    const userAgent = req.headers['user-agent'] || "";

    if (!path) return res.status(400).send("No path provided");

    // 1. ПРОВЕРКА USER-AGENT (Защита кода)
    const isMainDomain = host === "wehface.vercel.app" || host === "weh-face.vercel.app";
    const isRoblox = userAgent.includes("Roblox");

    if (isMainDomain && !isRoblox) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(403).send(`
            <html>
                <head>
                    <title>Access Denied</title>
                    <style>
                        body { 
                            background-color: #0b0b0b; 
                            color: #ff4141; 
                            font-family: 'Segoe UI', sans-serif; 
                            display: flex; 
                            flex-direction: column;
                            justify-content: center; 
                            align-items: center; 
                            height: 100vh; 
                            margin: 0; 
                        }
                        .box { 
                            border: 1px solid #ff4141; 
                            padding: 40px; 
                            text-align: center;
                            box-shadow: 0 0 20px rgba(255, 65, 65, 0.2);
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }
                    </style>
                </head>
                <body>
                    <div class="box">
                        <h1>Access Denied</h1>
                        <p>Protected by WEH-FACE Cloud.</p>
                    </div>
                </body>
            </html>
        `);
    }

    // 2. ОПРЕДЕЛЕНИЕ ПАПКИ
    let folder = "res/data";
    if (host.includes("cdn")) {
        folder = "res/cdn";
    } else if (host.includes("api")) {
        folder = "res/api";
    } else if (isMainDomain) {
        folder = "res/main";
    }

    // 3. АВТО-ДОБАВЛЕНИЕ .LUA (если нет расширения)
    if (!path.includes(".")) {
        path += ".lua";
    }

    const gitHubPath = `${folder}/${path}`;

    try {
        const { data: fileData } = await octokit.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: gitHubPath,
        });

        const { data: blobData } = await octokit.git.getBlob({
            owner: OWNER,
            repo: REPO,
            file_sha: fileData.sha,
        });

        const buffer = Buffer.from(blobData.content, 'base64');
        const extension = path.split('.').pop().toLowerCase();

        // Типы контента
        const types = {
            'lua': 'text/plain; charset=utf-8',
            'txt': 'text/plain; charset=utf-8',
            'json': 'application/json',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'gif': 'image/gif'
        };

        res.setHeader('Content-Type', types[extension] || 'application/octet-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (['lua', 'txt', 'json'].includes(extension)) {
            res.status(200).send(buffer.toString('utf8'));
        } else {
            res.status(200).send(buffer);
        }

    } catch (e) {
        res.status(404).send(`-- Error: File [${path}] not found in /${folder}/`);
    }
}
