local lp = game:GetService("Players").LocalPlayer
local CP = game:GetService("ContentProvider")
local activeAutoRespawns = {}
local ActiveAnimations = {}
local _G_CurrentMode = "once"

-- ==========================================
-- БИБЛИОТЕКА
-- ==========================================
local Library = {
    {
        Class = "Head",
        Name = "FaceHead",
        MeshID = "rbxassetid://76877570105127",
        TextureID = "rbxassetid://121827081031002",
        Scale = Vector3.new(1.0, 1.0, 1.0)
    },
    {
        Class = "AnimR6",
        Name = "Griddy",
        URL = "https://raw.githubusercontent.com/lixeal/DxBreak/refs/heads/violence-district/Griddy.txt"
    },
    {
        Class = "AnimR6",
        Name = "Rampage",
        URL = "https://raw.githubusercontent.com/lixeal/DxBreak/refs/heads/violence-district/Rampage.txt"
    },
    {
        Class = "Outfit",
        Name = "Maid",
        ShirtID = "rbxassetid://8913691200",
        PantsID = "rbxassetid://8913657959"
	},
	{
        Class = "Script",
        Name = "OldDXB",
        URL = "https://weh-face.vercel.app/old-DXBRE"
    },
    {
        Class = "Body",
        Name = "Custom",
        Torso = "rbxassetid://27493004",
        LeftArm = "rbxassetid://27400132",
        RightArm = "rbxassetid://27400198",
        LeftLeg = "rbxassetid://27493033",
        RightLeg = "rbxassetid://27493073"
    },
    {
        Class = "Outfit",
        Name = "Maid",
        ShirtID = "rbxassetid://8913691200",
        PantsID = "rbxassetid://8913657959"
    },
    {
        Class = "Outfit",
        Name = "Bape",
        ShirtID = "rbxassetid://12594352160",
        PantsID = "rbxassetid://4748004844"
    },
    {
        Class = "Outfit",
        Name = "Clown",
        ShirtID = "rbxassetid://6280071638",
        PantsID = "rbxassetid://11760797553"
    },
    {
        Class = "Outfit",
        Name = "Classic",
        ShirtID = "rbxassetid://6067501459",
        PantsID = "rbxassetid://13692756757"
    },
    {
        Class = "Accessory",
        Name = "Hat",
        Weld = "Head",
        MeshID = "rbxassetid://73083430479187",
        Texture = "rbxassetid://104381302798685",
        CFrame = CFrame.new(-0.013, 0.1, -0.005, 1, 0, 0, 0, 1, 0, 0, 0, 1)
    },
    {
        Class = "Animation",
        Name = "New",
        IdleID = "rbxassetid://0",
        WalkID = "rbxassetid://0",
        RunID = "rbxassetid://0",
        JumpID = "rbxassetid://0",
        FallID = "rbxassetid://0",
        PoseID = "rbxassetid://0"
    },
    {
        Class = "Face",
        Name = "Default",
        ID = "rbxassetid://0"
    }
}
-- ==========================================
-- ЛОГИКА ОЧИСТКИ
-- ==========================================
local function DoClear(target)
    local char = lp.Character
    local n = tostring(target):lower()
    
    if n == "all" then
        for name, conn in pairs(ActiveAnimations) do
            conn:Disconnect()
            ActiveAnimations[name] = nil
        end
        activeAutoRespawns = {}
    elseif ActiveAnimations[n] then
        ActiveAnimations[n]:Disconnect()
        ActiveAnimations[n] = nil
        activeAutoRespawns[n] = nil
    end

    if char then
        for _, v in pairs(char:GetDescendants()) do
            if v.Name == "G_Item_"..target or (n == "all" and v.Name:find("G_Item_")) then
                v:Destroy()
            end
            if n == "all" or v.Name:lower():find(n) then
                if v:IsA("Shirt") or v:IsA("Pants") or v:IsA("CharacterMesh") then v:Destroy() end
            end
        end
        if char:FindFirstChild("Animate") then char.Animate.Disabled = false end
    end
end

-- ==========================================
-- ОСНОВНОЙ ДВИЖОК (APPLY)
-- ==========================================
local function Apply(data)
    local char = lp.Character
    if not char or not char:FindFirstChild("Humanoid") then return end
    local lowName = data.Name:lower()

    if ActiveAnimations[lowName] then
        ActiveAnimations[lowName]:Disconnect()
        ActiveAnimations[lowName] = nil
        if char:FindFirstChild("Animate") then char.Animate.Disabled = false end
        return
    end

    -- [ КЛАСС: ANIMR6 ] --
    if data.Class == "AnimR6" then
        task.spawn(function()
            local folder = "DxBreak/Animations"
            local file = folder .. "/" .. data.Name .. ".txt"
            if not isfolder(folder) then makefolder(folder) end

            local content
            if isfile(file) then
                content = readfile(file)
            else
                local s, r = pcall(game.HttpGet, game, data.URL)
                if s then content = r; writefile(file, r) else return end
            end

            local animData = loadstring(content)()
            if not animData or #animData == 0 then return end

            -- ФИКС ВРЕМЕНИ: Убираем пустые секунды в начале
            local firstFrameTime = animData[1].T or 0
            local rawLength = (animData.Metadata and animData.Metadata.Length) or animData[#animData].T
            local actualDuration = rawLength - firstFrameTime 
            
            local isLoop = (_G_CurrentMode == "loop")

            if char:FindFirstChild("Animate") then char.Animate.Disabled = true end
            for _, t in pairs(char.Humanoid:GetPlayingAnimationTracks()) do t:Stop(0) end

            local joints = {}
            for _, v in pairs(char:GetDescendants()) do 
                if v:IsA("Motor6D") then joints[v.Name] = v end 
            end

            local startTime = tick()
            local connection
            connection = game:GetService("RunService").Stepped:Connect(function()
                if not char.Parent then connection:Disconnect(); return end
                
                local elapsed = tick() - startTime
                -- Магия: прибавляем firstFrameTime, чтобы сразу попасть в первый кадр
                local playTime = isLoop and (firstFrameTime + (elapsed % actualDuration)) or (firstFrameTime + elapsed)

                if not isLoop and elapsed > actualDuration then
                    connection:Disconnect()
                    ActiveAnimations[lowName] = nil
                    if char:FindFirstChild("Animate") then char.Animate.Disabled = false end
                    return
                end

                -- Поиск кадра
                local currentFrame = animData[1]
                for i = 1, #animData do
                    if animData[i].T <= playTime then
                        currentFrame = animData[i]
                    else
                        break
                    end
                end

                -- Применение (0.8 = четко и резко)
                for jName, joint in pairs(joints) do
                    local pose = currentFrame.P[jName]
                    if pose then
                        joint.Transform = joint.Transform:Lerp(pose, 0.8)
                    end
                end
            end)

            ActiveAnimations[lowName] = connection
        end)

    -- [ КЛАСС: OUTFIT ] --
    elseif data.Class == "Outfit" then
        local s = char:FindFirstChildOfClass("Shirt") or Instance.new("Shirt", char)
        s.ShirtTemplate = data.ShirtID
        local p = char:FindFirstChildOfClass("Pants") or Instance.new("Pants", char)
        p.PantsTemplate = data.PantsID

    -- [ КЛАСС: SCRIPT ] --
    elseif data.Class == "Script" then
        task.spawn(function()
            local s, r = pcall(game.HttpGet, game, data.URL)
            if s then loadstring(r)() end
        end)

    -- [ КЛАСС: BODY ] --
    elseif data.Class == "Body" then
        for _, v in pairs(char:GetChildren()) do if v:IsA("CharacterMesh") then v:Destroy() end end
        local parts = {"Torso", "LeftArm", "RightArm", "LeftLeg", "RightLeg"}
        for _, pName in pairs(parts) do
            if data[pName] then
                local m = Instance.new("CharacterMesh", char)
                m.BodyPart = Enum.BodyPart[pName]
                m.MeshId = data[pName]:match("%d+")
            end
        end
    end
end

-- ==========================================
-- ОБРАБОТЧИК КОМАНД
-- ==========================================
local function MainHandler(name, mode, key)
    if not name then return end
    local n = tostring(name):lower()
    local m = tostring(mode or "once"):lower()
    _G_CurrentMode = m

    if n == "cmd" then
        print("--- DXBRE Engine Loaded ---")
        return
    end

    if m == "clear" then DoClear(n); return end

    for _, d in pairs(Library) do
        if d.Name:lower() == n then
            if key and key ~= "" then
                local KCode = Enum.KeyCode[key:upper()]
                game:GetService("UserInputService").InputBegan:Connect(function(input, gpe)
                    if not gpe and input.KeyCode == KCode then Apply(d) end
                end)
            else
                Apply(d)
            end
            if m == "loop" or m == "true" then activeAutoRespawns[n] = d end
            return
        end
    end
end

setmetatable(_G, { __call = function(_, ...) return MainHandler(...) end })

lp.CharacterAdded:Connect(function()
    task.wait(1)
    -- Авто-восстановление того, что было зациклено
    for _, d in pairs(activeAutoRespawns) do Apply(d) end
end)

print("✅ DxBreak Command Bar v1.0.4 [v4 patch]")
