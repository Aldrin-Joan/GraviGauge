[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$processName = "language_server_windows_x64.exe"
try {
    $processes = Get-CimInstance Win32_Process -Filter "name='$processName'" -ErrorAction Stop
    $results = $processes | Select-Object CommandLine
    $results | ConvertTo-Json -Depth 1
} catch {
    Write-Error $_.Exception.Message
}
