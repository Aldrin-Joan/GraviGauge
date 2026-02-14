[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Get-ListeningPorts {
    param ( [int]$PidToSearch )
    $netstat = netstat -ano | Select-String -Pattern "\s+$PidToSearch$"
    $ports = @()
    foreach ($line in $netstat) {
        if ($line -match 'TCP\s+\d+\.\d+\.\d+\.\d+:(\d+)\s+.*LISTENING') {
            $ports += $matches[1]
        }
    }
    return $ports
}

try {
    # Find process
    $process = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*extension_server_port*" } | Select-Object -First 1

    if (-not $process) {
        throw "Antigravity process not found"
    }

    $cmd = $process.CommandLine
    
    # Extract Token
    if ($cmd -match '--csrf_token[=\s]+([a-f0-9-]+)') {
        $token = $matches[1]
    } else {
        throw "CSRF Token not found in arguments"
    }

    # Find Ports
    $pidNum = $process.ProcessId
    $ports = Get-ListeningPorts -PidToSearch $pidNum

    $result = @{
        pid = $pidNum
        token = $token
        ports = $ports
    }

    $result | ConvertTo-Json -Depth 2
} catch {
    $err = @{ error = $_.Exception.Message }
    $err | ConvertTo-Json
}
