local HttpService = game:GetService("HttpService")
local infoPath = "auraware/wf/info.json"

-- Универсальная функция запроса для эксплоитов
local function internal_request(options)
    local req = (syn and syn.request) or (http and http.request) or http_request or request
    if req then
        return req(options)
    end
    -- Если кастомных функций нет, пробуем стандарт (может выбить ошибку)
    local success, res = pcall(function()
        return HttpService:PostAsync(options.Url, options.Body, Enum.HttpContentType.ApplicationJson)
    end)
    return {Success = success, Body = res}
end

local wf = {}

local function send(url, payload)
    local response = internal_request({
        Url = url,
        Method = "POST",
        Headers = {["Content-Type"] = "application/json"},
        Body = HttpService:JSONEncode(payload)
    })

    if response.Success or (response.StatusCode and response.StatusCode == 200) then
        local body = response.Body
        
        -- Проверка на AUTH_SUCCESS
        if body:find("AUTH_SUCCESS") then
            if not isfolder("auraware/wf") then makefolder("auraware/wf") end
            local jsonData = body:split("|")[2]
            writefile(infoPath, jsonData)
            return "Аккаунт успешно привязан!"
        end
        
        -- Пытаемся декодировать JSON ответ
        local ok, decoded = pcall(function() return HttpService:JSONDecode(body) end)
        if ok then
            return decoded.url or decoded.message or body
        end
        return body
    else
        return "Ошибка сети: " .. tostring(response.Body or "Unknown Error")
    end
end

local function getCreds()
    if isfile(infoPath) then
        return HttpService:JSONDecode(readfile(infoPath))
    end
    return {}
end

-- Команды
function wf.register(user, pass)
    local payload = {
        command = string.format("create account\nusername = %s\npassword = %s", user, pass)
    }
    print("[WF]: Регистрация на сервере...")
    print(send("https://weh-face.vercel.app/register", payload))
end

function wf.add(path, content)
    local creds = getCreds()
    local payload = {
        command = string.format("add file %s =\n%s", path, content),
        user = creds.username,
        pass = creds.password
    }
    print("[WF]: Загрузка в репозиторий...")
    print(send("https://weh-face.vercel.app/execute", payload))
end

_G.wf = wf
print("[WF]: Ядро (v2) загружено через request()")
