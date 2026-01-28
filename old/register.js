import { Octokit } from "@octokit/rest";
import bcrypt from "bcryptjs"; // Нужно установить: npm install bcryptjs

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal";
const REPO = "weh-face";

export default async function handler(req, res) {
    const { username, password } = req.body; // Получаем данные из Roblox

    try {
        const path = `data/accounts/${username}.json`;

        // 1. Проверяем, не занят ли ник
        try {
            await octokit.repos.getContent({ owner: OWNER, repo: REPO, path });
            return res.status(400).json({ error: "User already exists" });
        } catch (e) {
            // Если ошибка 404 — значит юзер свободен, идем дальше
        }

        // 2. Шифруем пароль
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Формируем JSON пользователя
        const userData = {
            id: Date.now(), // Простой ID на основе времени
            username: username,
            password: hashedPassword,
            loginned: new Date().toLocaleString('ru-RU'),
            posted_scripts: []
        };

        // 4. Сохраняем файл на GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner: OWNER,
            repo: REPO,
            path: path,
            message: `New account created: ${username}`,
            content: Buffer.from(JSON.stringify(userData, null, 2)).toString('base64')
        });

        res.status(200).json({ success: true, message: "Account created!" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
