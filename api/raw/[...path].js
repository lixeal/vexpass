import { Octokit } from "@octokit/rest";
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
    const { path } = req.query; 
    
    // Пытаемся найти файл сначала в repository, потом в scripts
    // Или просто склеиваем путь напрямую из data/
    const fullPath = `data/${Array.isArray(path) ? path.join('/') : path}`;

    try {
        const response = await octokit.repos.getContent({
            owner: "lixeal",
            repo: "weh-face",
            path: fullPath,
        });

        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(content);
    } catch (error) {
        // Если не нашли, выводим ошибку текстом (чтобы loadstring не крашился)
        res.status(404).send(`-- Error: File not found (${fullPath})`);
    }
}
