Set WshShell = CreateObject("WScript.Shell")
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptPosition)
WshShell.Run "cmd.exe /c """ & scriptDir & "\start_backend.bat""", 0, False
