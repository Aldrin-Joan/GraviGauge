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
    # 1. Find process (look for "antigravity" in path or app_data_dir)
    $process = Get-CimInstance Win32_Process | Where-Object { 
        $_.CommandLine -match "antigravity" -and $_.Name -match "language_server"
    } | Select-Object -First 1

    if (-not $process) {
        throw "Antigravity process not found"
    }

    $cmd = $process.CommandLine
    
    # 2. Extract Token
    if ($cmd -match '--csrf_token[=\s]+([a-f0-9-]+)') {
        $token = $matches[1]
    } else {
        throw "CSRF Token not found in arguments"
    }

    # 3. Find Ports
    # Strategy: First check args for extension_server_port, else scan listening ports
    $ports = @()
    if ($cmd -match '--extension_server_port[=\s]+(\d+)') {
        $ports += $matches[1]
    }
    
    # Always scan for listening ports as fallback/confirmation
    $pidNum = $process.ProcessId
    $scannedPorts = Get-ListeningPorts -PidToSearch $pidNum
    $ports += $scannedPorts

    # Remove duplicates and empty
    $ports = $ports | Select-Object -Unique | Where-Object { $_ }

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
