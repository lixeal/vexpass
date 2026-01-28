import { Octokit } from "@octokit/rest";
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
    const { path } = req.query;
    // Магия: принудительно ищем в res/data/
    const gitHubPath = `res/data/${path}`;

    try {
        const { data } = await octokit.repos.getContent({
            owner: "lixeal",
            repo: "weh-face",
            path: gitHubPath,
        });

        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(content);
    } catch (e) {
        res.status(404).send(`-- File [${path}] not found in res/data/`);
    }
}
