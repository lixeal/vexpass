import { Octokit } from "@octokit/rest";
import bcrypt from "bcryptjs";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal";
const REPO = "weh-face";

export default async function handler(req, res) {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { command, user, pass } = body; 
    const lines = command.trim().split('\n').map(l => l.trim());
    const action = lines[0].toLowerCase();

    try {
        // --- РЕГИСТРАЦИЯ ---
        if (action === "create account") {
            const username = lines.find(l => l.includes('username')).split('=')[1].trim();
            const password = lines.find(l => l.includes('password')).split('=')[1].trim();
            const hashed = await bcrypt.hash(password, 10);

            await octokit.repos.createOrUpdateFileContents({
                owner: OWNER, repo: REPO,
                path: `data/accounts/${username}.json`,
                message: `User ${username} joined`,
                content: Buffer.from(JSON.stringify({ username, password: hashed })).toString('base64')
            });
            return res.send(`AUTH_SUCCESS|{"username":"${username}","password":"${password}"}`);
        }

        // --- ДОБАВЛЕНИЕ ФАЙЛА (с проверкой прав) ---
        if (action.startsWith("add file")) {
            // 1. Проверяем, существует ли юзер и верен ли пароль
            const { data: accountFile } = await octokit.repos.getContent({
                owner: OWNER, repo: REPO, path: `data/accounts/${user}.json`
            });
            const userData = JSON.parse(Buffer.from(accountFile.content, 'base64').toString());
            const isMatch = await bcrypt.compare(pass, userData.password);

            if (!isMatch) return res.send("Error: Неверный пароль!");

            // 2. Если всё ок — парсим путь и контент
            const fileName = lines[0].replace("add file ", "").split('=')[0].trim();
            const content = command.split('=')[1].trim();
            const filePath = `data/repository/${user}/${fileName}`;

            await octokit.repos.createOrUpdateFileContents({
                owner: OWNER, repo: REPO,
                path: filePath,
                message: `Upload by ${user}: ${fileName}`,
                content: Buffer.from(content).toString('base64')
            });

            return res.send(`Success! Файл доступен: https://weh-face.vercel.app/api/raw/${user}/${fileName}`);
        }
    } catch (e) {
        res.status(500).send("Server Error: " + e.message);
    }
}
