import { Octokit } from "@octokit/rest";
import bcrypt from "bcryptjs";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
    let data = req.body;
    // Если данные пришли как строка, пробуем превратить в объект
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { 
            // Если не JSON, возможно это параметры URL
            data = req.query; 
        }
    }

    const username = data.user || data.username || req.query.user;
    const password = data.pass || data.password || req.query.pass;

    // Проверка, чтобы сервер не падал
    if (!username || !password) {
        return res.status(400).json({ error: "Missing user or pass" });
    }

    try {
        const hashed = await bcrypt.hash(String(password), 10);
        await octokit.repos.createOrUpdateFileContents({
            owner: "lixeal",
            repo: "weh-face",
            path: `data/accounts/${username}.json`,
            message: `Reg: ${username}`,
            content: Buffer.from(JSON.stringify({ username, password: hashed })).toString('base64')
        });

        res.status(200).send(`AUTH_SUCCESS|{"username":"${username}","password":"${password}"}`);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
