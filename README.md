# GraviGauge

A lightweight VS Code extension that monitors your AI model quotas from the local Antigravity server in real-time.

## Features

- **Real-Time Usage**: Displays your lowest available quota percentage directly in the status bar.
- **Detailed Tooltip**: Hover over the status bar item to see a complete list of all models, including:
    - **Active Quotas**: Shows exact percentage remaining.
    - **Green Checks**: For healthy quotas (> 20%).
    - **Red Alerts**: For low quotas (<= 20%) or exhausted/unavailable models (0%).
- **Auto-Refresh**: Automatically fetches new data every 60 seconds.
- **Manual Refresh**: Click the status bar item to force an immediate update.

## Requirements

- **Antigravity AI Application**: You must have the local Antigravity application (IDE/Server) running on your machine.
    - The extension automatically detects the running process and connects to it using the active session token.

## Usage

1.  Make sure Antigravity is running.
2.  Install this extension.
3.  **Zero Configuration**: No API keys or port settings are required. It just works!
4.  Look for the rocket icon `$(rocket)` in the bottom-right status bar.
    - **Green/White**: Healthy quota.
    - **Red**: Low quota (< 20%) or critical status.
5.  **Hover** to see the full breakdown of all models (Gemini, Claude, GPT-OSS, etc.).
6.  **Click** to refresh the data.

## Troubleshooting

- **"No Connection"**:
    - Ensure Antigravity is running.
    - The extension uses a PowerShell script to find the process. Ensure PowerShell is available on your system.
- **"0%" Models**:
    - This means the API is returning no remaining quota for this model, indicating it is either exhausted or not available on your current tier.
- **"Self-signed Certificate" Errors**:
    - The extension is configured to bypass local SSL errors solely for `127.0.0.1`.

## Release Notes

### 1.1.0
- **Dynamic Port Findings**: Automatically finds the Antigravity server port.
- **Zero Config**: No longer requires manual API Key setup. Authenticates using the active session token.
- Support for `GetUserStatus` API to show all available models.
- Handling for undefined/zero quotas.

### 1.0.0
- Initial release.
- Support for `GetUserStatus` API to show all available models.
- Handling for undefined/zero quotas.
