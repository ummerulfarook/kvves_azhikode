Set WshShell = CreateObject("WScript.Shell")
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Start backend in background (hidden)
WshShell.Run "cmd.exe /c """ & scriptDir & "\start_backend.bat""", 0, False

' Start frontend in background (hidden)
WshShell.Run "cmd.exe /c """ & scriptDir & "\start_frontend.bat""", 0, False

' Wait 3 seconds for servers to initialize
WScript.Sleep 3000

' Open default browser to the web app
WshShell.Run "http://localhost:5173", 9
