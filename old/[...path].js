import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal";
const REPO = "weh-face";

export default async function handler(req, res) {
    const { path } = req.query;

    if (!path) {
        return res.status(400).send("Error: No file path provided.");
    }

    // Автоматически направляем запрос в нужную папку
    const gitHubPath = `res/data/${path}`;

    try {
        const { data } = await octokit.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: gitHubPath,
        });

        // Декодируем контент из Base64 в текст
        const content = Buffer.from(data.content, 'base64').toString('utf-8');

        // Отдаем как чистый текст для loadstring
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // Кэш на 1 минуту, чтобы не спамить запросами к API
        res.status(200).send(content);

    } catch (error) {
        res.status(404).send(`-- File [${path}] not found in res/data/`);
    }
}
