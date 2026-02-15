--[[
   ,a888a,     ad888888b,               ,ggggggggggggggg                                  
 ,8P"' `"Y8,  d8"     "88              dP""""""88"""""""                                  
,8P       Y8,          88              Yb,_    88                                         
88         88         d8P               `""    88                                         
88         88        a8P                       88                                         
88         88      ,d8P       ,gg,   ,gg       88   ,ggg,     ,gggg,gg   ,ggg,,ggg,,ggg,  
88         88    ,d8P'       d8""8b,dP"        88  i8" "8i   dP"  "Y8I  ,8" "8P" "8P" "8, 
`8b       d8'  ,d8P'        dP   ,88"    gg,   88  I8, ,8I  i8'    ,8I  I8   8I   8I   8I 
 `8ba, ,ad8'  a88"        ,dP  ,dP"Y8,    "Yb,,8P  `YbadP' ,d8,   ,d8b,,dP   8I   8I   Yb,
   "Y888P"    88888888888 8"  dP"   "Y88    "Y8P' 888P"Y888P"Y8888P"`Y88P'   8I   8I   `Y8
Created by 02xTeam 
]]

local storage = loadstring(game:HttpGet("https://api-winxs.vercel.app/storage"))()
local Library = loadstring(game:HttpGet("https://wehface.vercel.app/library/cerberus/source"))()
local window = Library.new("wesxware")
window:LockScreenBoundaries(false)
local mainTab = window:Tab("Main")
local mainSection = mainTab:Section("Main")
mainSection:Button("Site", function()
    setclipboard("https://wehface.vercel.app")
end)
mainSection:Label("v2.1.55#alpha")

local universalTab = window:Tab("Universal", "rbxassetid://105558355837082")

local func1 = universalTab:Section("Functional #1")
func1:Label("Combat")
func1:Button("ESP | by WA", function() Run.ESPwa() end)
func1:Button("LbEx | rewrite", function() Run.LimbExtender_rewrite() end)
func1:Button("Spin", function() Run.Spin() end)

func1:Label("Movement")
func1:Button("Fly", function() Run.Fly() end)
func1:Button("CFrame", function() Run.Cframe() end)

func1:Label("Multi - Tool")
func1:Button("soon", function() end)

local func2 = universalTab:Section("Functional #2")
func2:Label("Animations")
func2:Button("Gaze | rework", function() Run.Gaze() end)
func2:Button("AFEM | by ???", function() Run.afem() end)

func2:Label("Utillity")
func2:Button("IY | v6.4", function() Run.IY() end)
func2:Button("System Broken", function() Run.SysBroken() end)
func2:Button("External Shift", function() Run.External_Shift() end)
local supportedTab = window:Tab("Supported", "rbxassetid://133172752957923")
local searchSection = supportedTab:Section("Поиск")
local searchBar = searchSection:SearchBar("Search...")
local vdSection = supportedTab:Section("Violence District")
vdSection:Button("VD | by TexRBLX", function() Run.VDTexRBLX() end)
vdSection:Button("VDr | by TexRBLX", function() Run.VDTexRBLXRewrite() end)
vdSection:Button("Disable Stop Emote", function() Run.DisableStopEmote() end)
vdSection:Button("MoonWalk", function() Run.MoonWalk() end)
local evadeSection = supportedTab:Section("Evade")
evadeSection:Button("WhakizashiHubX | repack", function() Run.WhakazhiHubX() end)
evadeSection:Button("Dara Hub | collab", function() Run.DaraHub() end)
local mm2Section = supportedTab:Section("Murder Mystery 2")
mm2Section:Button("Vertex", function() Run.VertexMM2() end)
mm2Section:Button("XHub", function() Run.XHubMM2() end)
mm2Section:Button("OverDriveHub", function() Run.ODHMM2() end)
local lt2Section = supportedTab:Section("Lumber Tycoon 2")
lt2Section:Button("Luaware", function() Run.KronHub() end)
lt2Section:Button("Kron Hub", function() Run.LuaWare() end)
lt2Section:Button("School Hub", function() Run.SchoolHub() end)
