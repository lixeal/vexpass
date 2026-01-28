local HttpService = game:GetService("HttpService")
local infoPath = "auraware/wf/info.json"

-- [Универсальная функция запроса для обхода блокировок]
local function safe_request(url, data)
    local jsonBody = HttpService:JSONEncode(data)
    -- Ищем функцию request в твоем эксплоите
    local req_func = (syn and syn.request) or (http and http.request) or http_request or request
    
    if req_func then
        local res = req_func({
            Url = url,
            Method = "POST",
            Headers = { ["Content-Type"] = "application/json" },
            Body = jsonBody
        })
        return {Success = (res.StatusCode == 200), Body = res.Body}
    else
        -- Если request() не найден, пробуем обычный PostAsync через pcall
        local success, result = pcall(function()
            return HttpService:PostAsync(url, jsonBody, Enum.HttpContentType.ApplicationJson)
        end)
        return {Success = success, Body = result}
    end
end

local wf = {}

function wf.register(user, pass)
    print("[WF]: Попытка регистрации...")
    local res = safe_request("https://weh-face.vercel.app/register", {
        user = tostring(user),
        pass = tostring(pass)
    })
    
    if res.Success then
        if res.Body:find("AUTH_SUCCESS") then
            -- Сохраняем данные в папку workspace эксплоита
            pcall(function()
                if not isfolder("auraware") then makefolder("auraware") end
                if not isfolder("auraware/wf") then makefolder("auraware/wf") end
                local rawData = res.Body:split("|")[2]
                writefile(infoPath, rawData)
            end)
            print("[WF]: Успех! Аккаунт создан и данные сохранены.")
        else
            print("[WF Server]: " .. tostring(res.Body))
        end
    else
        warn("[WF Error]: " .. tostring(res.Body))
    end
end

_G.wf = wf
print("---------------------------------------")
print("[WEH-FACE] Core v3 Loaded!")
print("Используй: _G.wf.register('nick', 'pass')")
print("---------------------------------------")
