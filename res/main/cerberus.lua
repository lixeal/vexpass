--[[

        :.........          .........          .........:       ...::::.:..     :...........         ....................            .........  .........................        :..:.::::::....                  
          .:.........        ..........:        .........:   ...................:: .:..........       :.........:...........           ....................................   .:.....................:.             
           ::.........      .:...........      .........:..:......................:. .:........:.   ............  ..........           .................................... .:.........................:            
            .:.........    :............:     .....................::::::::.........:  ............:........::    ..........           .................................... :........::::::::.::.........           
             :........:    :.............:    :.............................:........:   :..................      ..........           .......... ::::::::::..:..........:. :........::.::..:..:                    
              :........:  :................  :......... .............................:     ..............:        ..........           ..........        ::..........:::    .........................::             
              :......... :........:........:........:  ..............................     .............:.        .........:           ..........     ::..........:.          .:.......................::           
               .........::........ ........:........:   .........:.         .:........   .:.................      ..........:.     ..:........... .:..........:..           ........ :....:.:::::.........          
                 :...............   .................    :..........:.::::...........: .....................:.     :................................................................:..:......:.:.........          
                 .:.............     :..............      .:.......................: ::.........:   :.........::   .:...................................................... :............................           
                  :............       :............         .:...................:  .:..........     .:..........    :.....................................................   ........................:.            
                   .:::::::::::        :::::::::::              ....::::::.::.    .:::::::::::         .::::::::::.    ..:::::::.:.    .:::::::::::::::::::::::::::::::::::       ..:.::::::::::::..       
  Author - wexxz

]]
task.spawn(function()
    pcall(function() loadstring(game:HttpGet("https://wehface.vercel.app/storage"))() end)
end)

getgenv().Run = getgenv().Run or {}
getgenv().Resolution = { [".gg/scripters"] = 1.00 }

local WindUI = loadstring(game:HttpGet("https://raw.githubusercontent.com/Footagesus/WindUI/main/dist/main.lua"))()
local UIS = game:GetService("UserInputService")
local Window = WindUI:CreateWindow({
    Title = "wesxware",
    Icon = "rbxassetid://105558355837082",
    Author = "v2.1.55#alpha",
    Folder = "wesxware",

    Size = UDim2.fromOffset(900, 600),
    
    Transparent = true,
    Theme = "Dark",
    Resizable = false,
    SideBarWidth = 200,
    BackgroundImageTransparency = 0.42,
    HideSearchBar = false,
    ScrollBarEnabled = true,
    
    Topbar = {
        Height = 44,
        ButtonsType = "Mac",
    },
})
Window:EditOpenButton({
    Title = "Wehface",
    Icon = "rbxassetid://105558355837082",
    CornerRadius = UDim.new(0,16),
    StrokeThickness = 2,
    Color = ColorSequence.new(Color3.fromHex("FF0F7B"), Color3.fromHex("F89B29")),
    OnlyMobile = true,
    Enabled = true,
    Draggable = true,
})
UIS.InputBegan:Connect(function(input, gpe)
    if not gpe and input.KeyCode == Enum.KeyCode.RightControl then
        Window:Toggle()
    end
end)

local MainTab = Window:Tab({ Title = "Main", Icon = "solar:home-2-bold" })
MainTab:Button({
    Title = "Site",
    Icon = "solar:link-bold",
    Callback = function()
        setclipboard("https://wehface.vercel.app")
        WindUI:Notify({ Title = "Success", Content = "Link copied!" })
    end
})
local Stats = MainTab:Paragraph({ Title = "System", Desc = "FPS: ... | Ping: ..." })
task.spawn(function()
    while task.wait(0.5) do
        local fps = math.floor(1 / task.wait())
        local ping = math.floor(game:GetService("Stats").Network.ServerStatsItem["Data Ping"]:GetValue())
        Stats:SetDesc("FPS: " .. fps .. " | Ping: " .. ping .. "ms")
    end
end)
local UniversalTab = Window:Tab({ Title = "Universal", Icon = "rbxassetid://105558355837082" })
UniversalTab:Section({ Title = "Combat" })
UniversalTab:Button({ Title = "ESP | by WA", Callback = function() Run.ESPwa() end })
UniversalTab:Button({ Title = "LbEx | rewrite", Callback = function() Run.LimbExtender_rewrite() end })
UniversalTab:Button({ Title = "Spin", Callback = function() Run.Spin() end })

UniversalTab:Section({ Title = "Movement" })
UniversalTab:Button({ Title = "Fly", Callback = function() Run.Fly() end })
UniversalTab:Button({ Title = "CFrame", Callback = function() Run.Cframe() end })

UniversalTab:Section({ Title = "Animations & Utility" })
UniversalTab:Button({ Title = "Gaze | rework", Callback = function() Run.Gaze() end })
UniversalTab:Button({ Title = "AFEM | by ???", Callback = function() Run.afem() end })
UniversalTab:Button({ Title = "IY | v6.4", Callback = function() Run.IY() end })
UniversalTab:Button({ Title = "System Broken", Callback = function() Run.SysBroken() end })

UniversalTab:Section({ Title = "Visual Tweaks" })
UniversalTab:Input({
    Title = "Aspect Ratio",
    Desc = "Stretch your screen (0.01 - 1.00)",
    Placeholder = "Example: 0.5",
    Callback = function(v)
        local num = tonumber(v)
        if num then getgenv().Resolution[".gg/scripters"] = math.clamp(num, 0.01, 1.00) end
    end
})
local SupportTab = Window:Tab({ Title = "Supported", Icon = "rbxassetid://133172752957923" })

local function AddGame(name, btns)
    SupportTab:Section({ Title = name })
    for _, b in pairs(btns) do
        SupportTab:Button({ Title = b[1], Callback = function() Run[b[2]]() end })
    end
end

AddGame("Violence District", {{"VD | by TexRBLX", "VDTexRBLX"}, {"MoonWalk", "MoonWalk"}})
AddGame("Evade", {{"WhakizashiHubX", "WhakazhiHubX"}, {"Dara Hub", "DaraHub"}})
AddGame("Murder Mystery 2", {{"Vertex", "VertexMM2"}, {"XHub", "XHubMM2"}})
AddGame("Lumber Tycoon 2", {{"Luaware", "KronHub"}, {"School Hub", "SchoolHub"}})
local SettingsTab = Window:Tab({ Title = "Settings", Icon = "solar:settings-minimalistic-bold" })
SettingsTab:Section({ Title = "Конфигурация" })
SettingsTab:Button({ Title = "Reset UI", Callback = function() print("Reset") end })
SettingsTab:Section({ Title = "Soon" })
SettingsTab:Section({ Title = "Soon" })
local Camera = workspace.CurrentCamera
game:GetService("RunService").RenderStepped:Connect(function()
    if getgenv().Resolution and getgenv().Resolution[".gg/scripters"] then
        Camera.CFrame = Camera.CFrame * CFrame.new(0, 0, 0, 1, 0, 0, 0, getgenv().Resolution[".gg/scripters"], 0, 0, 0, 1)
    end
end)
