import { Octokit } from "@octokit/rest";
import bcrypt from "bcryptjs";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
    // 1. Пытаемся распарсить тело запроса, если оно пришло строкой
    let data = req.body;
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = req.query; } 
    }

    // 2. Берем юзера и пароль из любых возможных полей
    const username = data.user || data.username || req.query.user;
    const password = data.pass || data.password || req.query.pass;

    // 3. Жесткая проверка перед bcrypt
    if (!username || !password) {
        return res.status(400).json({ 
            error: "Missing credentials", 
            received: { username: !!username, password: !!password } 
        });
    }

    try {
        // Хешируем именно строку
        const hashed = await bcrypt.hash(String(password), 10);

        await octokit.repos.createOrUpdateFileContents({
            owner: "lixeal",
            repo: "weh-face",
            path: `data/accounts/${username}.json`,
            message: `Register: ${username}`,
            content: Buffer.from(JSON.stringify({ username, password: hashed })).toString('base64')
        });

        res.status(200).send(`AUTH_SUCCESS|{"username":"${username}","password":"${password}"}`);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
