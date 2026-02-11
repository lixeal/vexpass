import { Octokit } from "@octokit/rest";

import logAccess from "./logs/access";
import logInject from "./logs/inject";
import logAlert from "./logs/alert";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const OWNER = "lixeal";
const REPO = "vexpass";
const BRANCH = "off";

export default async function handler(req, res) {

    const host = req.headers.host || "";
    const userAgent = req.headers["user-agent"] || "";

    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const ip = rawIp.split(",")[0].trim();

    let requestedPath = req.query.path || "";
    const cleanPath = requestedPath
        .split("#")[0]
        .split("?")[0]
        .replace(/\.[^/.]+$/, "");

    const isRoblox = userAgent.includes("Roblox");

    // --- ALERT MODULE ---
    await logAlert({ host, ip, userAgent });

    // --- DOMAIN → FOLDER ---
    let subFolder = "main";
    let iconName = "vexpass.svg";

    if (host.includes("raw")) subFolder = "raw";
    else if (host.includes("cdn")) subFolder = "cdn";
    else if (host.includes("api")) subFolder = "api";
    else if (host.includes("test")) {
        subFolder = "testing";
        iconName = "test-vexpass.svg";
    }

    // Если файл вызывается → включаем ScriptProtector иконку
    if (cleanPath !== "") iconName = "ScriptProtector.svg";

    // --- STATIC FILES ---
    if (requestedPath.startsWith("favicon/") || requestedPath === "html/bg.svg") {
        try {
            const repoPath = requestedPath.startsWith("favicon/")
                ? `site/favicon/${requestedPath.split("/").pop()}`
                : `site/html/bg.svg`;

            const { data: file } = await octokit.repos.getContent({
                owner: OWNER,
                repo: REPO,
                path: repoPath,
                ref: "main"
            });

            res.setHeader("Content-Type", "image/svg+xml");
            return res.status(200).send(
                Buffer.from(file.content, "base64").toString("utf-8")
            );
        } catch {
            return res.status(404).end();
        }
    }

    // --- UI MODE (BROWSER) ---
    if (!isRoblox) {

        let pageName = "main.html";

        if (host.includes("test")) pageName = "test.html";
        if (cleanPath !== "") pageName = "main.html";

        try {
            const { data: file } = await octokit.repos.getContent({
                owner: OWNER,
                repo: REPO,
                path: `site/html/${pageName}`,
                ref: "main"
            });

            let html = Buffer.from(file.content, "base64").toString("utf-8");

            html = html
                .replace(/{{ICON_PATH}}/g, `/api/raw?path=favicon/${iconName}`)
                .replace(/{{BG_PATH}}/g, `/api/raw?path=html/bg.svg`);

            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(200).send(html);

        } catch {
            return res.status(404).send("UI Error");
        }
    }

    // --- CODE MODE (ROBLOX) ---
    try {
        const { data: repoFiles } = await octokit.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: subFolder,
            ref: BRANCH
        });

        const targetFile = repoFiles.find(
            f => f.name.replace(/\.[^/.]+$/, "") === cleanPath
        );

        if (!targetFile) throw new Error();

        // --- ACCESS LOG MODULE ---
        await logAccess({
            host,
            ip,
            userAgent,
            file: targetFile.name
        });

        const { data: blob } = await octokit.git.getBlob({
            owner: OWNER,
            repo: REPO,
            file_sha: targetFile.sha
        });

        const content = Buffer.from(blob.content, "base64").toString("utf-8");

        // --- INJECT COUNTER MODULE ---
        await logInject({
            host,
            ip,
            file: targetFile.name
        });

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Access-Control-Allow-Origin", "*");
        return res.status(200).send(content);

    } catch {
        return res.status(404).send("-- VexPass Error: Resource not found");
    }
}
