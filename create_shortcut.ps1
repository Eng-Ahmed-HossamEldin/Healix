$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktopPath 'Healix.lnk'
$electronReal = 'c:\Users\LEGION\project\healix_front_desktop\node_modules\electron\dist\electron.exe'
$appDir = 'c:\Users\LEGION\project\healix_front_desktop'
$iconFile = 'c:\Users\LEGION\project\healix_front_desktop\icon.ico'

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $electronReal
$Shortcut.Arguments = '.'
$Shortcut.WorkingDirectory = $appDir
$Shortcut.IconLocation = $iconFile
$Shortcut.Description = 'Healix Health Ecosystem'
$Shortcut.Save()

Write-Host "Desktop shortcut created: $shortcutPath"
sk-gH4Mc5Ka96dRrnsRinvTtK9sQGUTPcIXVW23Th73qYOXelQtsk-gH4Mc5Ka96dRrnsRinvTtK9sQGUTPcIXVW23Th73qYOXelQt