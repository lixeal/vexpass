import { Octokit } from "@octokit/rest";
import bcrypt from "bcryptjs";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "lixeal";
const REPO = "weh-face";

export default async function handler(req, res) {
    // Безопасно парсим входящие данные
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { command, user, pass } = data;

    if (!command || !user || !pass) {
        return res.status(400).json({ error: "Missing data (command, user or pass)" });
    }

    try {
        // 1. Пытаемся найти файл аккаунта, чтобы проверить пароль
        const { data: accFile } = await octokit.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: `data/accounts/${user}.json`
        });

        const userData = JSON.parse(Buffer.from(accFile.content, 'base64').toString());
        
        // 2. Проверяем пароль (bcrypt защищает от кражи, если кто-то увидит хеш)
        const isMatch = await bcrypt.compare(String(pass), userData.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // 3. Обрабатываем команду "add file"
        const lines = command.trim().split('\n');
        if (lines[0].toLowerCase().startsWith("add file")) {
            
            // Вытаскиваем имя файла и контент
            // Формат: add file path/to/file.lua = [контент]
            const firstLine = lines[0];
            const fileName = firstLine.replace(/add file /i, "").split('=')[0].trim();
            const content = command.split('=')[1].trim();

            const targetPath = `data/repository/${user}/${fileName}`;

            await octokit.repos.createOrUpdateFileContents({
                owner: OWNER,
                repo: REPO,
                path: targetPath,
                message: `Update by ${user}: ${fileName}`,
                content: Buffer.from(content).toString('base64')
            });

            return res.status(200).json({
                success: true,
                message: "File uploaded!",
                url: `https://weh-face.vercel.app/raw/repository/${user}/${fileName}`
            });
        }

        return res.status(400).json({ message: "Unknown command in terminal" });

    } catch (e) {
        if (e.status === 404) {
            return res.status(404).json({ message: "User account not found" });
        }
        return res.status(500).json({ error: e.message });
    }
}
