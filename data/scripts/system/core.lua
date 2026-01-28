local HttpService = game:GetService("HttpService")
local infoPath = "auraware/wf/info.json"

local function safe_request(url, payload)
    local req_func = (syn and syn.request) or (http and http.request) or http_request or request
    local body = HttpService:JSONEncode(payload)
    
    if req_func then
        local success, response = pcall(function()
            return req_func({
                Url = url,
                Method = "POST",
                Headers = { ["Content-Type"] = "application/json" },
                Body = body
            })
        end)
        if success and response then
            return {Success = (response.StatusCode == 200), Body = response.Body}
        end
    end
    -- Если request не сработал, это крайний случай
    return {Success = false, Body = "Request function not found or failed"}
end

local wf = {}

function wf.register(user, pass)
    print("[WF]: Регистрация...")
    local res = safe_request("https://weh-face.vercel.app/register", {
        user = tostring(user),
        pass = tostring(pass)
    })
    
    if res.Success then
        if res.Body:find("AUTH_SUCCESS") then
            if not isfolder("auraware/wf") then 
                makefolder("auraware") makefolder("auraware/wf") 
            end
            local data = res.Body:split("|")[2]
            writefile(infoPath, data)
            print("[WF]: Аккаунт создан!")
        else
            print("[WF Server]: " .. tostring(res.Body))
        end
    else
        warn("[WF Error]: " .. tostring(res.Body))
    end
end

_G.wf = wf
print("[WF]: v4 Loaded. Use _G.wf.register('nick', 'pass')")
