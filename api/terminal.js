export default async function handler(req, res) {
    const { rawText } = req.body; // Весь текст из Roblox
    const lines = rawText.split('\n').map(l => l.trim());
    const action = lines[0]; // Первая строка (напр. "create account" или "add file")

    if (action === "create account") {
        // Логика парсинга для регистрации
        const username = lines.find(l => l.startsWith('username =')).split('=')[1].trim();
        const password = lines.find(l => l.startsWith('password =')).split('=')[1].trim();
        // Вызов функции регистрации (которую мы обсуждали выше)
        return registerUser(username, password, res);
    }

    if (action === "add file") {
        // Парсим: add file Print.lua = text
        const contentPart = rawText.split('=')[1].trim();
        const fileName = lines[0].replace('add file ', '').split('=')[0].trim();
        // Вызов функции загрузки на GitHub
        return uploadFile(fileName, contentPart, res);
    }
}
