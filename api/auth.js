import { Octokit } from "@octokit/rest";
import bcrypt from "bcryptjs";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
    // Эксплоиты иногда шлют данные странно, проверяем все варианты
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // Вытаскиваем юзера и пароль (проверяем разные ключи на всякий случай)
    const username = data.user || data.username;
    const password = data.pass || data.password;

    if (!username || !password) {
        return res.status(400).json({ error: "Missing username or password in request" });
    }

    try {
        const hashed = await bcrypt.hash(String(password), 10);

        await octokit.repos.createOrUpdateFileContents({
            owner: "lixeal",
            repo: "weh-face",
            path: `data/accounts/${username}.json`,
            message: `Register: ${username}`,
            content: Buffer.from(JSON.stringify({ username, password: hashed })).toString('base64')
        });

        // Возвращаем спец-строку для нашего Lua
        const authData = JSON.stringify({ username, password });
        res.status(200).send(`AUTH_SUCCESS|${authData}`);
    } catch (e) {
        res.status(500).send("Server Error: " + e.message);
    }
}
